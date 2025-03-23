const https = require('https');
const http = require('http');

// The URL from your screenshot (modify if needed)
const webhookUrl = 'https://92e2-2a02-2f0d-240d-9300-4df5-440e-705f-9323.ngrok-fr/webhook';

// Data to send
const data = JSON.stringify({
  lead: 'test lead value from Node.js script'
});

// Parse the URL to determine if it's HTTP or HTTPS
const url = new URL(webhookUrl);
const client = url.protocol === 'https:' ? https : http;
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`Sending test request to ${webhookUrl}...`);

const req = client.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();

console.log('Test request sent!'); 