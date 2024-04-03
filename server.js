const http = require('http');
const fs = require('fs');
const url = require('url');

http.createServer((request, response) => {
  let q = new url.URL(request.url, 'http://localhost:8080');
  let filePath;

  if (q.pathname.includes('documentation')) {
    filePath = (__dirname + '/documentation.html');
  } else {
    filePath = 'index.html';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('Internal Server Error\n');
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(data);
    response.end();
  });

  // Log the request URL and timestamp
  const logEntry = `${new Date().toISOString()} - ${request.url}\n`;
  fs.appendFile('log.txt', logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log.txt:', err);
    }
  });

}).listen(8080);

console.log('My test server is running on Port 8080.');