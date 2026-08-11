/* Minimal static server — zero dependencies, Node 18+.
   Only needed if this repo is deployed on Render as a WEB SERVICE rather
   than a STATIC SITE. A static site needs no server at all. */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');
const TYPES = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',   '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.ico':'image/x-icon',  '.woff2':'font/woff2', '.csv':'text/csv; charset=utf-8'
};
const SEC = {
  'Cache-Control':'no-cache, must-revalidate',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin'
};

function sendIndex(res, code){
  fs.readFile(path.join(ROOT, 'index.html'), (err, buf) => {
    if(err){ res.writeHead(500, SEC); return res.end('index.html is missing — run ./build.sh'); }
    res.writeHead(code || 200, Object.assign({'Content-Type':TYPES['.html']}, SEC));
    res.end(buf);
  });
}

http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch(_){ return sendIndex(res, 200); }

  if(url === '/healthz'){
    res.writeHead(200, Object.assign({'Content-Type':'application/json'}, SEC));
    return res.end('{"status":"ok"}');
  }

  const file = path.resolve(ROOT, '.' + (url === '/' ? '/index.html' : url));
  if(!file.startsWith(ROOT)){                       // no path traversal
    res.writeHead(403, SEC); return res.end('Forbidden');
  }
  fs.stat(file, (err, st) => {
    if(err || !st.isFile()) return sendIndex(res, 200);   // any path serves the app
    res.writeHead(200, Object.assign(
      {'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'}, SEC));
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => console.log('Boardroom Growth Plan listening on ' + PORT));
