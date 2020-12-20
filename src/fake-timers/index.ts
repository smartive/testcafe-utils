import { FakeTimerInstallOpts, InstalledClock } from '@sinonjs/fake-timers';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { IClientScript } from '../client-code';

declare global {
  interface Window {
    __fakeClock: InstalledClock;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export class FakeTimers implements IClientScript {
  constructor(private config: FakeTimerInstallOpts) {}

  /**
   * See https://github.com/sinonjs/fake-timers#api-reference for `method` and corresponding `arguments` descritpion
   */
  public execute<TClockMethod extends keyof Pick<InstalledClock, FunctionPropertyNames<InstalledClock>>>({
    t,
    method,
    methodArgs,
  }: {
    t: TestController;
    method: TClockMethod;
    methodArgs: ArgumentTypes<InstalledClock[TClockMethod]>;
  }): Promise<ReturnType<InstalledClock[TClockMethod]>> {
    return t.eval(
      () => {
        const [arg1, arg2, rest] = methodArgs;
        const result = window.__fakeClock[method](arg1 as any, arg2 as any, ...rest);
        console.log(`[FakeTimers] ${method}(${methodArgs.join(', ')}) => ${result}`);

        return true;
      },
      { dependencies: { method, methodArgs } },
    );
  }

  public clientScript(): ClientScriptContent {
    const clientCode = readFileSync(resolve(__dirname, './fake-timers.js')).toString();

    return {
      content: `${clientCode}
const config = JSON.parse('${JSON.stringify(this.config)}');
window.__fakeClock = window.__installFakeTimers(config);
console.log('[FakeTimers] Installed', config);`,
    };
  }
}
