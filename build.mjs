import {cp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),dest=path.resolve(root,'dist');
if(dest!==path.join(root,'dist')||!dest.startsWith(root+path.sep))throw Error('Unexpected build destination');
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});
const files=['guides.html','sample-downloads.js','index.html','styles.css','app.js','workbook-check.html','workbook-check.js','xlsx-inventory.js','privacy.html','service-scope.html','robots.txt','sitemap.xml'];
for(const f of files)await cp(f,path.join(dest,f));
for(const dir of ['samples','repair','ckd','tenderfit'])await cp(dir,path.join(dest,dir),{recursive:true});
await mkdir(path.join(dest,'.openai'),{recursive:true});await cp('.openai/hosting.json',path.join(dest,'.openai/hosting.json'));
// Preserve the existing server entry for compatibility with the repository's earlier hosting setup.
await mkdir(path.join(dest,'server'),{recursive:true});
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
console.log(JSON.stringify({built:dest,publicFiles:files.length,samples:true}));
