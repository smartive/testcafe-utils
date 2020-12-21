(() => {
  type FetchArgs = [input: RequestInfo, init?: RequestInit];

  const interceptor = (url: string, method: string): Promise<void> => {
    const { key, interceptor } = window.__findInterceptor(url, method);

    if (interceptor) {
      console.log(`[${window.__interceptorName}] Intercepted '${url}' by '${key}'`);
      return interceptor.promise;
    }

    return Promise.resolve();
  };

  const attach = () => {
    window.fetch = ((fetch) => {
      return async (...args: FetchArgs) => {
        const [url, options] = args;

        await interceptor(url.toString(), options?.method || 'GET');

        return fetch(...args);
      };
    })(window.fetch);
  };

  attach();
})();
