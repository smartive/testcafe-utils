import { mockHeaders } from './mock-headers';

export const mockResponse = (fixture: unknown, statusCode = 200, method = 'GET', additionalHeaders = {}) => (
  _req: RequestOptions,
  res: ResponseMock & { method: string },
): void => {
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
