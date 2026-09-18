const http = require('http');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runMultilingualTests() {
  console.log("=================================================");
  console.log("MULTI-LANGUAGE (EN, TELUGU, HINDI) TEST SUITE");
  console.log("=================================================");

  // 1. Health checks
  const health = await getJson('/api/health');
  console.log("1. GET /api/health -> Status:", health.status);

  const aiHealth = await getJson('/api/ai/health');
  console.log("2. GET /api/ai/health -> Provider:", aiHealth.data.provider, "| Reachable:", aiHealth.data.reachable);

  const testPayload = {
    crop: "Onion",
    quantity: 2500,
    current_offered_price: 18,
    location: {
      latitude: 18.2199,
      longitude: 74.4534,
      name: "Baramati, Maharashtra"
    }
  };

  // 3. English Test
  console.log("\n--- TEST 1: English (language: 'en') ---");
  const enRes = await postJson('/api/analyze-price', { ...testPayload, language: 'en' });
  console.log("• Offered Price:", `₹${enRes.data.price_signal.current_price}/kg`);
  console.log("• Historical Median:", `₹${enRes.data.price_signal.historical_median}/kg`);
  console.log("• Deviation Percent:", `${enRes.data.price_signal.deviation_percent}%`);
  console.log("• AI Explanation Source:", enRes.data.explanation.source);
  console.log("• AI Explanation Text:", `"${enRes.data.explanation.text}"`);

  // 4. Telugu Test
  console.log("\n--- TEST 2: Telugu (language: 'te') ---");
  const teRes = await postJson('/api/analyze-price', { ...testPayload, language: 'te' });
  console.log("• Offered Price:", `₹${teRes.data.price_signal.current_price}/kg`);
  console.log("• Historical Median:", `₹${teRes.data.price_signal.historical_median}/kg`);
  console.log("• Deviation Percent:", `${teRes.data.price_signal.deviation_percent}%`);
  console.log("• AI Explanation Source:", teRes.data.explanation.source);
  console.log("• AI Explanation Text:", `"${teRes.data.explanation.text}"`);

  // 5. Hindi Test
  console.log("\n--- TEST 3: Hindi (language: 'hi') ---");
  const hiRes = await postJson('/api/analyze-price', { ...testPayload, language: 'hi' });
  console.log("• Offered Price:", `₹${hiRes.data.price_signal.current_price}/kg`);
  console.log("• Historical Median:", `₹${hiRes.data.price_signal.historical_median}/kg`);
  console.log("• Deviation Percent:", `${hiRes.data.price_signal.deviation_percent}%`);
  console.log("• AI Explanation Source:", hiRes.data.explanation.source);
  console.log("• AI Explanation Text:", `"${hiRes.data.explanation.text}"`);

  // 6. Verify numerical stability
  const numbersIdentical = enRes.data.price_signal.current_price === teRes.data.price_signal.current_price &&
                           teRes.data.price_signal.current_price === hiRes.data.price_signal.current_price &&
                           enRes.data.price_signal.historical_median === teRes.data.price_signal.historical_median;

  console.log("\n• Are numerical statistical calculations identical across EN, TE, HI?:", numbersIdentical ? "YES (PASS)" : "NO (FAIL)");

  console.log("\n=================================================");
  console.log("MULTI-LANGUAGE VERIFICATION COMPLETED!");
  console.log("=================================================");
}

runMultilingualTests().catch(console.error);
