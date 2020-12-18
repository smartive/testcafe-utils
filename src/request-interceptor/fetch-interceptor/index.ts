import { readFileSync } from 'fs';
import { resolve } from 'path';
import { InterceptUrls, RequestInterceptor } from '../request-interceptor';

export class FetchInterceptor<T extends InterceptUrls> extends RequestInterceptor<T> {
  protected readonly clientCode: string = readFileSync(resolve(__dirname, './fetch-interceptor.js')).toString();
}
