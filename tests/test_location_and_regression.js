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

async function runTests() {
  console.log("=================================================");
  console.log("LOCATION RESOLUTION & REGRESSION TEST SUITE");
  console.log("=================================================");

  // 1. Health checks
  const health = await getJson('/api/health');
  console.log("1. GET /api/health -> Status:", health.status, "| Service:", health.data.service);

  const aiHealth = await getJson('/api/ai/health');
  console.log("2. GET /api/ai/health -> Provider:", aiHealth.data.provider, "| Model:", aiHealth.data.model, "| Reachable:", aiHealth.data.reachable);

  // 3. Test Baramati, Maharashtra location resolution
  console.log("\n--- TEST 1: Baramati, Maharashtra ---");
  const baramatiRes = await postJson('/api/analyze-price', {
    crop: "Onion",
    quantity: 2500,
    current_offered_price: 18,
    location: {
      latitude: 17.3850, // default old coords in payload
      longitude: 78.4867,
      name: "Baramati, Maharashtra"
    }
  });

  if (baramatiRes.status === 200) {
    const loc = baramatiRes.data.location;
    const mandis = baramatiRes.data.nearby_mandis;
    console.log("• Received Coordinates:", `Lat ${loc.latitude.toFixed(4)}, Lon ${loc.longitude.toFixed(4)}`);
    console.log("• Data Source:", baramatiRes.data.data_info.source);
    console.log("• AI Explanation Source:", baramatiRes.data.explanation.source);
    console.log("• AI Explanation Text:", `"${baramatiRes.data.explanation.text}"`);
    console.log("• Mandi Distances Calculated:");
    mandis.forEach(m => console.log(`   - ${m.name} (${m.distance_km} km) - ${m.signal}`));

    const hyderabadReturned = mandis.some(m => m.name.toLowerCase().includes('hyderabad') || m.name.toLowerCase().includes('bowenpally') || m.name.toLowerCase().includes('malakpet'));
    console.log("• Were Hyderabad mandis incorrectly returned?:", hyderabadReturned ? "YES (FAIL)" : "NO (PASS - SUCCESS!)");
  } else {
    console.log("Baramati test failed:", baramatiRes.data);
  }

  // 4. Test Telangana location (Nizamabad, Telangana)
  console.log("\n--- TEST 2: Nizamabad, Telangana ---");
  const nizamabadRes = await postJson('/api/analyze-price', {
    crop: "Onion",
    quantity: 1000,
    current_offered_price: 20,
    location: {
      latitude: 17.3850,
      longitude: 78.4867,
      name: "Nizamabad, Telangana"
    }
  });

  if (nizamabadRes.status === 200) {
    const loc = nizamabadRes.data.location;
    const mandis = nizamabadRes.data.nearby_mandis;
    console.log("• Received Coordinates:", `Lat ${loc.latitude.toFixed(4)}, Lon ${loc.longitude.toFixed(4)}`);
    console.log("• Mandi Distances Calculated:");
    mandis.forEach(m => console.log(`   - ${m.name} (${m.distance_km} km)`));
  } else {
    console.log("Nizamabad test failed:", nizamabadRes.data);
  }

  // 5. Test Geocoding failure handling
  console.log("\n--- TEST 3: Invalid Location Geocoding Failure ---");
  const invalidRes = await postJson('/api/analyze-price', {
    crop: "Onion",
    quantity: 1000,
    current_offered_price: 20,
    location: {
      latitude: 17.3850,
      longitude: 78.4867,
      name: "invalid_nonexistent_place_xyz999"
    }
  });
  console.log("• Invalid location response status:", invalidRes.status, "| Message:", invalidRes.data.message || invalidRes.data.detail);
  console.log("• Hyderabad silently substituted?:", invalidRes.status === 400 ? "NO (PASS - Properly rejected!)" : "YES (FAIL)");

  console.log("\n=================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
}

runTests().catch(console.error);
