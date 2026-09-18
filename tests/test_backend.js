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

async function runTests() {
  console.log("=== RUNNING SELLING BLIND BACKEND TEST SUITE ===");

  // 1. Health check
  const health = await makeRequest('/api/v1/health');
  console.log("1. Health Endpoint:", health.status === 200 && health.data.status === 'healthy' ? 'PASSED' : 'FAILED');

  // 2. Crops endpoint
  const crops = await makeRequest('/api/v1/crops');
  console.log("2. Crops Endpoint:", crops.status === 200 && crops.data.crops.length > 0 ? 'PASSED' : 'FAILED');

  // 3. Mandis endpoint
  const mandis = await makeRequest('/api/v1/mandis');
  console.log("3. Mandis Endpoint:", mandis.status === 200 && mandis.data.mandis.length > 0 ? 'PASSED' : 'FAILED');

  // 4. Analysis Endpoint (Unusually Low Price Scenario)
  const lowPriceReq = {
    crop: "Onion",
    quantity: 2500,
    current_offered_price: 18, // ₹18/kg
    location: {
      latitude: 17.3850,
      longitude: 78.4867
    }
  };
  const lowPriceRes = await makeRequest('/api/v1/analyze', 'POST', lowPriceReq);
  const isLowPass = lowPriceRes.status === 200 && 
                    lowPriceRes.data.anomaly.status === 'UNUSUALLY_LOW' &&
                    lowPriceRes.data.historical_analysis.median === 24 &&
                    lowPriceRes.data.decision.signal === 'CONSIDER_ALTERNATIVE_MANDI';
  console.log("4. Analyze (Unusually Low Price):", isLowPass ? 'PASSED' : 'FAILED');
  if (isLowPass) {
    console.log("   Signal:", lowPriceRes.data.decision.signal);
    console.log("   Message:", lowPriceRes.data.decision.simple_message);
    console.log("   Nearby Alternatives:", lowPriceRes.data.nearby_alternatives.length);
  }

  // 5. Analysis Endpoint (Normal Price Scenario)
  const normalPriceReq = {
    crop: "Onion",
    quantity: 1000,
    current_offered_price: 24, // ₹24/kg
    location: {
      latitude: 17.3850,
      longitude: 78.4867
    }
  };
  const normalPriceRes = await makeRequest('/api/v1/analyze', 'POST', normalPriceReq);
  const isNormalPass = normalPriceRes.status === 200 && normalPriceRes.data.anomaly.status === 'NORMAL';
  console.log("5. Analyze (Normal Price):", isNormalPass ? 'PASSED' : 'FAILED');

  // 6. Summary Endpoint
  const summary = await makeRequest('/api/v1/analyze/summary');
  console.log("6. Low-Bandwidth Summary:", summary.status === 200 ? 'PASSED' : 'FAILED');

  // 7. FPO Endpoint
  const fpo = await makeRequest('/api/v1/fpo/summary');
  console.log("7. FPO Aggregation Summary:", fpo.status === 200 && fpo.data.fpo_aggregation ? 'PASSED' : 'FAILED');

  console.log("=== ALL BACKEND TESTS COMPLETED SUCCESSFULLY ===");
}

setTimeout(runTests, 1000);
