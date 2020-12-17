import { mockHeaders } from './mock-headers';

export type MockResponseBody = (req: RequestOptions, res: ResponseMock & { method?: string }) => unknown;
export const mockResponse = (
  fixture: unknown,
  statusCode = 200,
  method = 'GET',
  additionalHeaders = {},
): MockResponseBody => (_, res) => {
  res.headers = {
    ...mockHeaders,
    'content-type': 'application/json',
    'x-testcafe-mock': 'true',
    ...additionalHeaders,
  };
  res.method = method;
  res.statusCode = statusCode;
  res.setBody(JSON.stringify(fixture));
};
