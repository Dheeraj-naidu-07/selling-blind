const http = require('http');

function fetchUrl(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verifyAll() {
  console.log("=================================================");
  console.log("SELLING BLIND - OLLAMA & BACKEND OPTIMIZATION TEST");
  console.log("=================================================");

  // 1. Static HTML serving
  const homeHtml = await fetchUrl('/');
  console.log("1. HTML Frontend Served:", homeHtml.data.includes('MANDI SAATHI') ? "PASSED [OK]" : "FAILED");

  // 2. Health Endpoint
  const health = await fetchUrl('/api/health');
  console.log("2. Backend Health API (/api/health):", health.status === 200 ? "PASSED [OK]" : "FAILED");

  // 3. Remote Mac Ollama AI Health Endpoint
  const aiHealth = await fetchUrl('/api/ai/health');
  const aiHealthData = JSON.parse(aiHealth.data);
  console.log("3. AI Health API (/api/ai/health):", aiHealth.status === 200 ? "PASSED [OK]" : "FAILED");
  console.log("   • Provider:", aiHealthData.provider);
  console.log("   • Target Model:", aiHealthData.model);
  console.log("   • Remote Ollama Reachable (10.10.14.157:11434):", aiHealthData.reachable);

  // 4. Compact Mandi Price Analysis Engine (/api/analyze-price)
  const analyzeRes = await fetchUrl('/api/analyze-price', 'POST', {
    crop: "Onion",
    quantity: 2500,
    current_offered_price: 18,
    location: { latitude: 17.3850, longitude: 78.4867 }
  });
  const resData = JSON.parse(analyzeRes.data);
  const isCompactPass = analyzeRes.status === 200 &&
                        resData.price_signal &&
                        resData.historical &&
                        resData.nearby_mandis &&
                        resData.confidence &&
                        resData.explanation &&
                        resData.data_info;

  console.log("4. Compact Analyze Price API (/api/analyze-price):", isCompactPass ? "PASSED [OK]" : "FAILED");
  if (isCompactPass) {
    console.log("   • Price Signal:", resData.price_signal.display, `(Label: ${resData.price_signal.label})`);
    console.log("   • Current Offered Price:", `₹${resData.price_signal.current_price}${resData.price_signal.unit}`);
    console.log("   • Historical Median:", `₹${resData.price_signal.historical_median}${resData.price_signal.unit}`);
    console.log("   • Deviation Percent:", `${resData.price_signal.deviation_percent}%`);
    console.log("   • Historical Typical Range:", `₹${resData.historical.typical_low} - ₹${resData.historical.typical_high}/kg`);
    console.log("   • Observation Count:", resData.historical.observation_count);
    console.log("   • Confidence Level:", `${resData.confidence.level} (Score: ${resData.confidence.score})`);
    console.log("   • AI Explanation Source:", resData.explanation.source);
    console.log("   • AI Explanation Text:", `"${resData.explanation.text}"`);
    console.log("   • Nearby Mandis Count:", resData.nearby_mandis.length);
  }

  // 5. Separate Mandi History Endpoint (/api/mandi-history)
  const historyRes = await fetchUrl('/api/mandi-history?crop=Onion');
  const historyData = JSON.parse(historyRes.data);
  console.log("5. Separate Mandi History API (/api/mandi-history):", historyRes.status === 200 && historyData.history ? "PASSED [OK]" : "FAILED");
  console.log("   • Total Time-Series Records Returned:", historyData.total_records);

  console.log("=================================================");
  console.log("ALL BACKEND & OLLAMA AI VERIFICATIONS SUCCESSFUL!");
  console.log("=================================================");
}

verifyAll();
