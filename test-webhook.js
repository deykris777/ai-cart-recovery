require('dotenv').config();
const crypto = require('crypto');
const http = require('http');

const dataObj = {
  id: "1234567890",
  total_price: "4500.00",
  currency: "INR",
  email: "testcustomer@example.com",
  customer: {
    first_name: "Alex",
    email: "testcustomer@example.com"
  },
  billing_address: {
    first_name: "Alex"
  },
  line_items: [
    {
      title: "Running Sneakers - Size 10",
      quantity: 1,
      price: "4500.00"
    }
  ]
};

const payload = JSON.stringify(dataObj);

const headers = {
  'Content-Type': 'application/json',
  'Content-Length': Buffer.byteLength(payload)
};

if (process.env.SHOPIFY_WEBHOOK_SECRET) {
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('base64');
  headers['x-shopify-hmac-sha256'] = hash;
}

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/webhooks/checkout/abandoned',
  method: 'POST',
  headers: headers
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
