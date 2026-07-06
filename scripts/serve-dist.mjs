import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const hostIndex = args.indexOf('--host');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT ?? 4321);
const host = hostIndex >= 0 ? args[hostIndex + 1] : '127.0.0.1';
const dist = path.resolve(process.cwd(), 'dist');

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function cleanPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  return decoded.replace(/\\/g, '/');
}

async function fileForRequest(urlPath) {
  const cleaned = cleanPath(urlPath);
  let candidate = path.resolve(dist, `.${cleaned}`);

  if (!candidate.startsWith(dist)) {
    return { status: 403, file: path.join(dist, '404.html') };
  }

  if (existsSync(candidate)) {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      candidate = path.join(candidate, 'index.html');
    }
  } else if (!path.extname(candidate)) {
    candidate = path.join(candidate, 'index.html');
  }

  if (existsSync(candidate)) {
    return { status: 200, file: candidate };
  }

  return { status: 404, file: path.join(dist, '404.html') };
}

const server = createServer(async (request, response) => {
  try {
    const result = await fileForRequest(request.url ?? '/');
    const body = await readFile(result.file);
    const ext = path.extname(result.file).toLowerCase();
    response.writeHead(result.status, {
      'content-type': contentTypes.get(ext) ?? 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff'
    });
    response.end(body);
  } catch {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
});

server.listen(port, host, () => {
  console.log(`Serving ${dist} at http://${host}:${port}/`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
