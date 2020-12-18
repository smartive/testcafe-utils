import { readFileSync } from 'fs';
import { resolve } from 'path';
import { InterceptUrls, RequestInterceptor } from '../request-interceptor';

export class XHRInterceptor<T extends InterceptUrls> extends RequestInterceptor<T> {
  protected readonly clientCode: string = readFileSync(resolve(__dirname, './xhr-interceptor.js')).toString();
}
