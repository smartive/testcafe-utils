export type InterceptUrls = Record<string, string | RegExp>;

declare global {
  const urls: InterceptUrls;

  interface Window {
    __intercepted: {
      [key: string]: { resolve: () => void; promise: Promise<void> };
    };
    __interceptUrls: string[];
  }
}

export abstract class RequestInterceptor<T extends InterceptUrls> {
  protected readonly REG_EXP_PREFIX: string = '__RegExp';

  protected abstract readonly clientCode: string;

  constructor(public readonly interceptUrls: T) {}

  public resolve<
    // This type definition only allows keys from the given InterceptUrls
    K extends keyof any &
      {
        [K in keyof T]: T[K] extends string | RegExp ? K : never;
      }[keyof T]
  >(urlKey: K): (t: { t: TestController }) => Promise<void> {
    const options = { dependencies: { urlKey, urls: this.interceptUrls } };
    return ({ t }: { t: TestController }) =>
      t.eval(() => window.__intercepted[urls[urlKey.toString()].toString()].resolve(), options);
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
${this.clientCode}

console.log(
  '[${this.constructor.name}] Intercepted urls and patterns:',
  window.__interceptUrls.map((url, i) => \`\\n\\t\${i + 1}) \${url}\`).join('')
);
`,
    };
  }
}
