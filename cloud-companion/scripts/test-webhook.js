#!/usr/bin/env node

/**
 * Simple script to test the webhook endpoint
 * 
 * Usage:
 * node test-webhook.js "Your message here"
 */

import fetch from 'node-fetch';

// Get the message from command line arguments
const message = process.argv[2] || 'Test message from CLI';

// Get the base URL from environment or use default
const baseUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';

console.log(`Sending message to webhook: "${message}"`);
console.log(`Webhook URL: ${baseUrl}`);

// Send the request
fetch(baseUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: message,
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'CLI Test Script',
    },
  }),
})
  .then(response => response.json())
  .then(data => {
    console.log('Response from webhook:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error calling webhook:', error);
    process.exit(1);
  }); 