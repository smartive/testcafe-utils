# @smartive/testcafe-utils

This package is a toolbox which contains various helpers we often use when working with TestCafe.

## `FetchInterceptor`

The `FetchInterceptor` class can be used to intercept the `window.fetch`-calls within the browser. The class takes a key/value object, where the values are `string` or `RegExp` for an URL to intercept. Afterwards it is possible to resolve a running `fetch` call at any desired time with `await fetchInterceptor.resolve('interceptURLKey')({ t })`. (where `t` is the TestCafe `TestController`)

### Example

```Typescript
// The following snippet does not include all needed imports and code it is intended
// to give you a starting point and an idea how this class can be used.

import { FetchInterceptor } from '@smartive/testcafe-utils';

fixture('My Fixture').page`http://localhost:3000`;

const fetchInterceptor = new FetchInterceptor({
  fetchLuke: 'https://swapi.dev/api/people/1/',
  fetchPeople: /.+swapi\.dev.+\/people\/$/,
  fetchMore: /.+swapi\.dev.+\/people\/\?page=.+/,
});

test.clientScripts([fetchInterceptor.clientScript()])('My Test', async (t) => {
  await t.click(page.loadPeople).expect(page.spinner.exists).ok();
  await fetchInterceptor.resolve('fetchPeople')({ t });
  await t
    .expect(page.list.childElementCount)
    .gt(0)
    .click(page.loadMorePeople)
    .expect(page.spinner.exists)
    .ok();
  await fetchInterceptor.resolve('fetchMore')({ t });
  await t
    .expect(page.list.childElementCount)
    .gt(10)
    .click(page.loadLuke)
    .expect(page.spinner.exists)
    .ok();
  await fetchInterceptor.resolve('fetchLuke')({ t });
  await t.expect(detailPage.title.textContent).eql('Luke Skywalker');
});
```

## `mockHeaders`

The `mockHeaders` object can be used to fix the cross origin problem which often occurs because TestCafe does not set an often desired `access-control-allow-credentials` and `access-control-allow-origin` header property.

### Example

```Typescript
import { mockHeaders } from '@smartive/testcafe-utils';
import { RequestMock } from 'testcafe';

const mockCrossOriginRequest = RequestMock()
  .onRequestTo(({ method, url }) => method === 'post' && RegExp(/\/people\/$/).test(url))
  .respond(null, 200, mockHeaders);

```

## `mockResponse`

The `mockResponse` function can be used to simplify the creation of mock responses. Additionally it adds a new header field `x-testcafe-mock` to make a mocked request better traceable.

### Example

```Typescript
import { mockResponse } from '@smartive/testcafe-utils';
import { RequestMock } from 'testcafe';

const PeopleRequestMock = RequestMock()
  .onRequestTo(/.+swapi\.dev.+\/people\/$/)
  .respond(
    mockResponse(
      {}, // response data
      400, // statusCode (default: 200)
      'PUT', // method (default: 'GET') somehow TestCafe needs this on response object ¯\_(ツ)_/¯
      { 'my-foobar-header': 42 } // additionalHeaders (default: {})
    )
  );
```

## `RequestCallCountMock`

The `RequestCallCountMock` class can be used to add a `RequestMock` to a TestCafe `fixture` or `test` which returns the given responses according to the call count. An extra header `'x-testcafe-call-count'` will be added to the response to make a mocked request better traceable.

### Example

```Typescript
import { mockResponse, RequestCallCountMock } from '@smartive/testcafe-utils';

test.requestHooks([
  new RequestCallCountMock(/.+swapi\.dev.+\/people\/$/, [
    { body: mockResponse(['a', 'b', 'c']) }, // On the first api call to `/.+swapi\.dev.+\/people\/$/` the response is `['a', 'b', 'c']`
    { body: mockResponse([1, 2, 3]) }, // on the second call the response is `[1,2,3]`
    { body: mockResponse({}, 400) }, // on the third and all following calls the repsonse is a `statusCode` 400 and `{}`
  ]),
]);
```
