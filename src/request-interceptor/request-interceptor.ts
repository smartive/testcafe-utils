import { readFileSync } from 'fs';
import { resolve } from 'path';
import { IClientScript } from '../client-code';

type URLPattern = string | RegExp;
type URLRules = URLPattern | { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'; pattern: URLPattern };
export type InterceptUrls = Record<string, URLRules>;
type Interceptor = { resolve: () => void; promise: Promise<void> };

declare global {
  interface Window {
    __intercepted: { [key: string]: Interceptor };
    __interceptUrls: URLRules[];
    __interceptorName: string;
    __findInterceptor: (url: string, method: string) => { key: string | null; interceptor: Interceptor | null };
  }
}

const interceptUrlsMapper = readFileSync(resolve(__dirname, './intercept-urls-mapper.js')).toString();
const findInterceptor = readFileSync(resolve(__dirname, './find-interceptor.js')).toString();

export abstract class RequestInterceptor<T extends InterceptUrls> implements IClientScript {
  protected readonly REG_EXP_PREFIX: string = '__RegExp';

  protected abstract readonly clientCode: string;

  constructor(public readonly interceptUrls: T) {}

  public resolve<
    // This type definition only allows keys from the given InterceptUrls
    K extends keyof any &
      {
        [K in keyof T]: T[K] extends URLRules ? K : never;
      }[keyof T]
  >(urlKey: K): (t: { t: TestController }) => Promise<void> {
    const url = this.interceptUrls[urlKey.toString()];
    const key = url instanceof RegExp || typeof url === 'string' ? url.toString() : `${url.method}__${url.pattern}`;

    return ({ t }: { t: TestController }) =>
      t.eval(
        () => {
          console.log(`[${window.__interceptorName}] Resolve call matched by '${key}'`);
          window.__intercepted[key].resolve();

          return true;
        },
        { dependencies: { key } },
      );
  }

  public clientScript(): ClientScriptContent {
    const regExpReplacer = (_: any, value: RegExp | unknown) =>
      value instanceof RegExp ? `${this.REG_EXP_PREFIX}__${value.source}__${value.flags}` : value;
    // re-escape escaped characters from JSON.stringify to make evaluation of
    // ClientScriptContent by TestCafe with window.eval and JSON.parse possible
    const urls = JSON.stringify(Object.values(this.interceptUrls), regExpReplacer).replace(/\\\\/g, '\\\\\\\\');

    return {
      content: `
const regExpReviver = (_, value) => {
  if (typeof value === 'string' && value.startsWith('${this.REG_EXP_PREFIX}')) {
    const [,, pattern, flags=''] = value.split('__');
    return new RegExp(pattern, flags);
  }

  return value;
};

window.__interceptorName = '${this.constructor.name}';
window.__interceptUrls = JSON.parse('${urls}', regExpReviver);
${interceptUrlsMapper}
${findInterceptor}

${this.clientCode}

console.log(
  '[${this.constructor.name}] Intercepted urls and patterns:',
  window.__interceptUrls.map((url, i) =>
    \`\\n\\t\${i + 1}) \${url instanceof RegExp || typeof url === 'string' ? url.toString() : \`\${url.method}__\${url.pattern}\`}\`,
  ).join('')
);
`,
    };
  }
}
