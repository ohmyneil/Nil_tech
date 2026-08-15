const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');

const rootDirectory = __dirname;
loadEnvironmentFile(path.join(rootDirectory, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 8080;
const maxRequestBytes = 12 * 1024;
const contactRequestLimit = 3;
const contactRequestWindowMs = 15 * 60 * 1000;
const contactRequestLog = new Map();

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

function loadEnvironmentFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach(function(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) return;

    const isQuoted = (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (isQuoted) value = value.slice(1, -1).replace(/\\n/g, '\n');
    process.env[key] = value;
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { ok: false, message });
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getRequestPath(requestUrl) {
  return new URL(requestUrl || '/', `http://${host}`).pathname;
}

function getFilePath(requestUrl) {
  const pathname = getRequestPath(requestUrl);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  const pathParts = relativePath.split(/[\\/]+/);
  const publicFolders = new Set(['assets', 'css', 'js']);
  const isPublicFile = relativePath === 'index.html' || publicFolders.has(pathParts[0]);
  const containsHiddenPath = pathParts.some(function(part) { return part.startsWith('.'); });

  if (!isPublicFile || containsHiddenPath) return null;

  const filePath = path.resolve(rootDirectory, relativePath);
  const isInsideWorkspace = filePath === rootDirectory || filePath.startsWith(`${rootDirectory}${path.sep}`);
  return isInsideWorkspace ? filePath : null;
}

function readJsonBody(request) {
  return new Promise(function(resolve, reject) {
    const contentLength = Number(request.headers['content-length']);
    if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
      request.resume();
      reject(createHttpError(413, 'Message is too large.'));
      return;
    }

    let byteLength = 0;
    const chunks = [];
    let settled = false;

    request.on('data', function(chunk) {
      if (settled) return;
      byteLength += chunk.length;
      if (byteLength > maxRequestBytes) {
        settled = true;
        reject(createHttpError(413, 'Message is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', function() {
      if (settled) return;
      settled = true;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(createHttpError(400, 'Please send a valid message.'));
      }
    });
    request.on('error', function() {
      if (!settled) reject(createHttpError(400, 'Unable to read the message.'));
    });
  });
}

function getTextValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailConfiguration() {
  const smtpHost = getTextValue(process.env.SMTP_HOST);
  const smtpUser = getTextValue(process.env.SMTP_USER);
  const smtpPassword = getTextValue(process.env.SMTP_PASS);
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const recipient = getTextValue(process.env.CONTACT_RECIPIENT) || smtpUser;
  const from = getTextValue(process.env.SMTP_FROM) || smtpUser;
  const secureValue = getTextValue(process.env.SMTP_SECURE).toLowerCase();
  const secure = secureValue ? secureValue === 'true' : smtpPort === 465;

  if (!smtpHost || !smtpUser || !smtpPassword || !recipient || !from ||
    !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    return null;
  }

  return {
    host: smtpHost,
    port: smtpPort,
    secure,
    user: smtpUser,
    password: smtpPassword,
    from,
    recipient
  };
}

function getRequestIp(request) {
  return request.socket.remoteAddress || 'unknown';
}

function hasAllowedOrigin(request) {
  const origin = getTextValue(request.headers.origin).replace(/\/$/, '');
  const siteOrigin = getTextValue(process.env.SITE_ORIGIN).replace(/\/$/, '');
  return !origin || !siteOrigin || origin === siteOrigin;
}

function isRateLimited(ipAddress) {
  const now = Date.now();
  const recentRequests = (contactRequestLog.get(ipAddress) || []).filter(function(timestamp) {
    return now - timestamp < contactRequestWindowMs;
  });

  if (recentRequests.length >= contactRequestLimit) {
    contactRequestLog.set(ipAddress, recentRequests);
    return true;
  }

  recentRequests.push(now);
  contactRequestLog.set(ipAddress, recentRequests);
  return false;
}

async function handleContactRequest(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendError(response, 405, 'Method not allowed.');
    return;
  }

  if (!String(request.headers['content-type'] || '').toLowerCase().includes('application/json')) {
    sendError(response, 415, 'Please send a JSON request.');
    return;
  }

  if (!hasAllowedOrigin(request)) {
    sendError(response, 403, 'This request is not allowed from this site.');
    return;
  }

  if (isRateLimited(getRequestIp(request))) {
    sendError(response, 429, 'Please wait a few minutes before sending another message.');
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const name = getTextValue(payload.name).replace(/[\r\n]+/g, ' ');
    const email = getTextValue(payload.email);
    const message = getTextValue(payload.message);

    if (getTextValue(payload.website)) {
      sendJson(response, 200, { ok: true, message: 'Thanks — your message was sent directly to Neil.' });
      return;
    }

    if (name.length < 2 || name.length > 80) {
      sendError(response, 400, 'Please enter a name between 2 and 80 characters.');
      return;
    }
    if (email.length > 120 || !isValidEmail(email)) {
      sendError(response, 400, 'Please enter a valid email address.');
      return;
    }
    if (message.length < 2 || message.length > 2000) {
      sendError(response, 400, 'Please enter a message between 2 and 2,000 characters.');
      return;
    }

    const emailConfiguration = getEmailConfiguration();
    if (!emailConfiguration) {
      console.error('Contact message rejected: SMTP is not configured.');
      sendError(response, 503, 'Email sending is not configured yet. Please use the direct email link instead.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: emailConfiguration.host,
      port: emailConfiguration.port,
      secure: emailConfiguration.secure,
      auth: {
        user: emailConfiguration.user,
        pass: emailConfiguration.password
      }
    });
    const subject = `Portfolio message from ${name}`;
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      'Message:',
      message
    ].join('\n');
    await transporter.sendMail({
      from: emailConfiguration.from,
      to: emailConfiguration.recipient,
      replyTo: email,
      subject,
      text
    });
    console.log('Contact email accepted by SMTP.');

    sendJson(response, 200, {
      ok: true,
      message: 'Thanks — your message was sent directly to Neil.'
    });
  } catch (error) {
    if (error.statusCode) {
      sendError(response, error.statusCode, error.message);
      return;
    }

    console.error('Unable to send contact email:', error.message);
    sendError(response, 502, 'The message could not be sent. Please use the direct email link instead.');
  }
}

function serveStaticFile(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    sendError(response, 405, 'Method not allowed.');
    return;
  }

  let filePath;
  try {
    filePath = getFilePath(request.url);
  } catch {
    sendError(response, 400, 'Invalid request URL.');
    return;
  }

  if (!filePath) {
    sendError(response, 403, 'Forbidden.');
    return;
  }

  fs.stat(filePath, function(statError, stats) {
    if (statError || !stats.isFile()) {
      sendError(response, 404, 'Not found.');
      return;
    }

    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    fs.createReadStream(filePath)
      .on('error', function() { sendError(response, 500, 'Unable to read file.'); })
      .pipe(response);
  });
}

const server = http.createServer(function(request, response) {
  let requestPath;
  try {
    requestPath = getRequestPath(request.url);
  } catch {
    sendError(response, 400, 'Invalid request URL.');
    return;
  }

  if (requestPath === '/api/contact') {
    handleContactRequest(request, response);
    return;
  }

  serveStaticFile(request, response);
});

console.log('Starting portfolio server...');
server.listen(port, host, function() {
  console.log(`Portfolio server running at http://${host}:${port}/`);
});

server.on('error', function(error) {
  console.error(`Portfolio server failed to start: ${error.message}`);
  process.exitCode = 1;
});
