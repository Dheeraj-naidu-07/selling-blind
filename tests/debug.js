const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function debugTest() {
  const lowPriceReq = {
    crop: "Onion",
    quantity: 2500,
    current_offered_price: 18,
    location: {
      latitude: 17.3850,
      longitude: 78.4867
    }
  };
  const res = await makeRequest('/api/v1/analyze', 'POST', lowPriceReq);
  console.log("Status:", res.status);
  console.log("Data:", JSON.stringify(res.data, null, 2));
}

debugTest();
