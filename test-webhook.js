const http = require('http');

const payload = JSON.stringify({
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
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/webhooks/checkout/abandoned',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
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
