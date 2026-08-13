const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const rootDirectory = __dirname;
const host = '127.0.0.1';
const port = Number(process.env.PORT) || 8080;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function sendError(response, statusCode, message) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

function getFilePath(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || '/').split('?')[0]);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  const filePath = path.resolve(rootDirectory, relativePath);
  const isInsideWorkspace = filePath === rootDirectory || filePath.startsWith(`${rootDirectory}${path.sep}`);

  return isInsideWorkspace ? filePath : null;
}

const server = http.createServer((request, response) => {
  let filePath;

  try {
    filePath = getFilePath(request.url);
  } catch {
    sendError(response, 400, 'Invalid request URL');
    return;
  }

  if (!filePath) {
    sendError(response, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendError(response, 404, 'Not found');
      return;
    }

    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath)
      .on('error', () => sendError(response, 500, 'Unable to read file'))
      .pipe(response);
  });
});

console.log('Starting portfolio server...');
server.listen(port, host, () => {
  console.log(`Portfolio server running at http://${host}:${port}/`);
});

server.on('error', error => {
  console.error(`Portfolio server failed to start: ${error.message}`);
  process.exitCode = 1;
});
