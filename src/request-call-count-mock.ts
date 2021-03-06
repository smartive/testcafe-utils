import { RequestHook } from 'testcafe';
import { ResponseMock, RequestEvent } from 'testcafe-hammerhead';
import { MockResponseBody } from './mock-response';

type MockResponse = {
  body?: Record<string, unknown> | string | MockResponseBody;
  statusCode?: number;
  headers?: Record<string, unknown>;
};

export class RequestCallCountMock extends RequestHook {
  private callCount = 0;
  private mocks: MockResponse[] = [];

  // Cause TestCafe types are not explicit enough
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(requestFilterRules: any, mocks: MockResponse[]) {
    super(requestFilterRules);
    this.mocks = mocks;
  }

  public onRequest(event: RequestEvent): any {
    const { body, statusCode, headers } = this.mocks[this.callCount] || this.mocks[this.mocks.length - 1];
    event.setMock(
      new ResponseMock(body as any, statusCode, {
        ...headers,
        'x-testcafe-call-count': this.callCount,
      }),
    );
    this.callCount += 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onResponse(): any {}
}
