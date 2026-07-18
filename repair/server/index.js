const INDEX_PATH = "/index.html";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (env?.ASSETS?.fetch) {
      const response = await env.ASSETS.fetch(new Request(url, request));
      if (response.status !== 404) return response;

      const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
      const isPageRequest = request.method === "GET" && !url.pathname.includes(".") && acceptsHtml;
      if (isPageRequest) {
        return env.ASSETS.fetch(new Request(new URL(INDEX_PATH, url), request));
      }
      return response;
    }

    return new Response("David Rowan web-app repair site is starting.", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
