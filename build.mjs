import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("index.html", "dist/index.html");
await cp("styles.css", "dist/styles.css");
await cp("robots.txt", "dist/robots.txt");
await cp("repair", "dist/repair", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await writeFile(
  "dist/server/index.js",
  `const INDEX_PATH = "/index.html";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (env?.ASSETS?.fetch) {
      const response = await env.ASSETS.fetch(new Request(url, request));
      if (response.status !== 404) return response;
      const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
      if (request.method === "GET" && !url.pathname.includes(".") && acceptsHtml) {
        return env.ASSETS.fetch(new Request(new URL(INDEX_PATH, url), request));
      }
      return response;
    }
    return new Response("Rowan Workshop", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
`
);
