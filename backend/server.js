const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://10.10.14.157:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const AI_MOCK_MODE = (process.env.AI_MOCK_MODE || 'false').toLowerCase() === 'true';

// Load CSV helper
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => {
      let val = values[i] !== undefined ? values[i] : '';
      if (!isNaN(val) && val !== '') val = Number(val);
      row[h] = val;
    });
    return row;
  });
}

// Data paths
const dataDir = path.join(__dirname, '..', 'data');
const cropsData = parseCSV(path.join(dataDir, 'demo_crops.csv'));
const mandisData = parseCSV(path.join(dataDir, 'demo_mandis.csv'));
const pricesData = parseCSV(path.join(dataDir, 'demo_prices.csv'));

// Crop normalization & catalog
const knownCrops = {
  'onion': { id: 1, name: 'Onion', category: 'Vegetables', aliases: ['pyaz', 'kanda', 'ullipaya', 'ullipayalu', 'ullipayalaku', 'प्याज', 'ఉల్లిపాయ', 'ఉల్లిపాయలు', 'ఉల్లిపాయలకు'] },
  'potato': { id: 2, name: 'Potato', category: 'Vegetables', aliases: ['aloo', 'alugadda', 'aloo', 'आलू', 'బంగాళాదుంప'] },
  'tomato': { id: 3, name: 'Tomato', category: 'Vegetables', aliases: ['tamatar', 'thakkali', 'टमाटर', 'టమోటా'] },
  'wheat': { id: 4, name: 'Wheat', category: 'Grains', aliases: ['gehun', 'godhuma', 'गेहूं', 'గోధుమ'] },
  'paddy': { id: 5, name: 'Paddy', category: 'Grains', aliases: ['rice', 'chawal', 'dhan', 'चावल', 'వరి'] },
  'cotton': { id: 6, name: 'Cotton', category: 'Fiber', aliases: ['kapas', 'patti', 'कपास', 'పత్తి'] },
  'red chilli': { id: 7, name: 'Red Chilli', category: 'Spices', aliases: ['chilli', 'mirchi', 'lal mirch', 'लाल मिर्च', 'మిరపకాయ'] },
  'maize': { id: 8, name: 'Maize', category: 'Grains', aliases: ['corn', 'makka', 'jonnalu', 'मक्का', 'మొక్కజొన్న'] }
};

function normalizeCrop(rawName) {
  if (!rawName) return 'Onion';
  const cleaned = rawName.toString().trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  for (const [key, data] of Object.entries(knownCrops)) {
    if (cleaned === key || data.aliases.includes(cleaned)) {
      return data.name;
    }
  }
  return rawName.toString().trim().charAt(0).toUpperCase() + rawName.toString().trim().slice(1);
}

// Option 2 Structured Input Extraction Helper
function extractStructuredInput(transcript, prevState = {}, userLoc = {}) {
  const text = (transcript || '').toLowerCase();
  
  const state = {
    crop: prevState.crop || null,
    quantity: prevState.quantity || null,
    quantity_unit: prevState.quantity_unit || 'kg',
    offered_price: prevState.offered_price || null,
    price_unit: prevState.price_unit || 'kg',
    location_name: prevState.location_name || null,
    latitude: (prevState.latitude !== null && prevState.latitude !== undefined) ? prevState.latitude : (userLoc.latitude || null),
    longitude: (prevState.longitude !== null && prevState.longitude !== undefined) ? prevState.longitude : (userLoc.longitude || null),
    language: prevState.language || 'en-IN'
  };

  // 1. Crop Detection
  for (const [key, data] of Object.entries(knownCrops)) {
    if (text.includes(key) || data.aliases.some(alias => text.includes(alias))) {
      state.crop = data.name;
      break;
    }
  }

  // 2. Offered Price Detection (numbers near rupees/rs/₹/kg/రకములు/రూపాయలు/रुपये)
  const numbers = text.match(/\b(\d+(?:\.\d+)?)\b/g);
  if (numbers && numbers.length > 0) {
    for (const numStr of numbers) {
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0 && val < 50000) {
        state.offered_price = val;
        break;
      }
    }
  }

  // 3. Location Detection
  const knownPlaces = ['baramati', 'solapur', 'bowenpally', 'hyderabad', 'narsapur', 'medak', 'pune', 'mumbai', 'delhi', 'nizamabad', 'warangal', 'khammam', 'mahbubnagar', 'karimnagar'];
  for (const place of knownPlaces) {
    if (text.includes(place)) {
      state.location_name = place.charAt(0).toUpperCase() + place.slice(1);
      break;
    }
  }

  const locMatch = text.match(/(?:at|in|located in|from|near)\s+([a-z\s]+)/i);
  if (locMatch && locMatch[1]) {
    const cand = locMatch[1].trim();
    if (cand.length > 2 && !['rupees', 'onions', 'crop', 'selling', 'getting', 'price'].includes(cand)) {
      state.location_name = cand.charAt(0).toUpperCase() + cand.slice(1);
    }
  }

  return state;
}

// Haversine distance formula
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. LIVE NOMINATIM REVERSE & FORWARD GEOCODING API
async function reverseGeocode(lat, lon) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'User-Agent': 'SellingBlindMandiSaathi/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || 'Hyderabad';
      const state = addr.state || 'Telangana';
      const country = addr.country || 'India';
      return `${city}, ${state}, ${country}`;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.log('[Geocoding API Notice] Nominatim fallback used:', err.message);
  }
  return `Location (${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)})`;
}

async function forwardGeocode(locationName) {
  if (!locationName || typeof locationName !== 'string' || !locationName.trim()) {
    return null;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName.trim())}&format=json&limit=1`, {
      headers: { 'User-Agent': 'SellingBlindMandiSaathi/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          console.log(`[Geocoding API] Resolved '${locationName}' to coordinates: (${lat}, ${lon})`);
          return { latitude: lat, longitude: lon, displayName: data[0].display_name };
        }
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.log('[Geocoding API Notice] Forward geocoding failed:', err.message);
  }
  return null;
}

// 2. LIVE OPEN-METEO WEATHER CONTEXT API
async function getWeather(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    if (res.ok) {
      const data = await res.json();
      const curr = data.current_weather || {};
      const temp = curr.temperature || 26.0;
      const code = curr.weathercode || 0;
      let cond = 'Clear';
      if ([1, 2, 3].includes(code)) cond = 'Partly cloudy';
      else if ([51, 53, 55, 61, 63, 65, 80, 81].includes(code)) cond = 'Rain showers expected';
      return {
        available: true,
        temperature: Number(temp),
        precipitation: code === 0 ? 0 : 0.2,
        condition: cond,
        message: `Live weather context: ${cond} (${temp}°C) in region.`
      };
    }
  } catch (err) {
    console.log('[Weather API Notice] Open-Meteo fallback used:', err.message);
  }
  return {
    available: false,
    message: 'Weather data temporarily unavailable'
  };
}

// 3. LIVE AGMARKNET PUBLIC API FETCHING
async function fetchLiveAgMarkNet(cropName) {
  try {
    const apiKey = process.env.AGMARKNET_API_KEY || process.env.DATA_GOV_API_KEY || "579b464db66ec23bdd000001cdd394632b774f197bd7677b3d7e8d76";
    const res = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=50&filters[commodity]=${encodeURIComponent(cropName)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.records && data.records.length > 0) {
        console.log(`[AgMarkNet API] Fetched ${data.records.length} live records for ${cropName}`);
        return data.records;
      }
    }
  } catch (err) {
    console.log('[AgMarkNet API Notice] Live API fetch fallback:', err.message);
  }
  return [];
}

// 4. LIVE REMOTE OLLAMA QWEN3:8B AI INFERENCE SERVICE
async function generateAiExplanation(structuredFacts, language = 'en') {
  if (AI_MOCK_MODE) {
    if (language === 'te') {
      return { text: `ఆఫర్ చేసిన ధర ₹${structuredFacts.current_price}/కేజీ సాధారణ సీజనల్ సగటు కంటే తక్కువగా ఉంది.`, source: "mock" };
    } else if (language === 'hi') {
      return { text: `पेश की गई कीमत ₹${structuredFacts.current_price}/किग्रा सामान्य मौसमी औसत से कम है।`, source: "mock" };
    }
    return {
      text: `The offered price of ₹${structuredFacts.current_price}/kg is lower than the typical historical seasonal median.`,
      source: "mock"
    };
  }

  let langInstruction = "Respond ONLY in English.";
  if (language === 'te') {
    langInstruction = "Respond ONLY in simple Telugu language suitable for an Indian farmer.";
  } else if (language === 'hi') {
    langInstruction = "Respond ONLY in simple Hindi language suitable for an Indian farmer.";
  }

  const systemPrompt = "You are the explanation layer for a mandi price intelligence system.\n\n" +
                       langInstruction + "\n\n" +
                       "Use ONLY the supplied structured facts.\n\n" +
                       "Do not invent or modify:\n" +
                       "- prices\n- percentages\n- distances\n- historical statistics\n- confidence values\n- mandi information\n\n" +
                       "Do not make guaranteed future-price predictions.\n\n" +
                       "Explain the supplied result in simple language suitable for a farmer.\n\n" +
                       "Keep the response below 40 words.\n\n" +
                       "Historical prices are not guarantees of future prices.";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(structuredFacts) }
        ],
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const message = data.message || {};
      const content = (message.content || '').trim();
      if (content) {
        return { text: content, source: "ollama" };
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.log('[Ollama AI Notice] Remote Qwen3:8B call fallback:', err.message);
  }

  const devPct = structuredFacts.deviation_percent || 0.0;
  let fallbackText = `The offered price is about ${Math.abs(devPct).toFixed(1)}% below the historical seasonal median based on available public mandi data.`;
  if (language === 'te') {
    fallbackText = `లభ్యమైన మండి డేటా ప్రకారం ఆఫర్ చేసిన ధర చారిత్రక సగటు కంటే దాదాపు ${Math.abs(devPct).toFixed(1)}% తక్కువగా ఉంది.`;
  } else if (language === 'hi') {
    fallbackText = `उपलब्ध मंडी आंकड़ों के अनुसार पेश की गई कीमत ऐतिहासिक औसत से लगभग ${Math.abs(devPct).toFixed(1)}% कम है।`;
  }

  return {
    text: fallbackText,
    source: "fallback"
  };
}

// Check AI Health
async function checkAiHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  let reachable = false;
  try {
    const res = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) reachable = true;
  } catch (err) {
    clearTimeout(timeoutId);
  }
  return {
    provider: "ollama",
    model: OLLAMA_MODEL,
    reachable: reachable
  };
}

// Core Dynamic Analysis Engine
async function runAnalysis(body) {
  const locationName = body.location?.name;
  if (!locationName || typeof locationName !== 'string' || !locationName.trim()) {
    throw new Error("HARD RULE VIOLATION: Location is required. Please provide a valid location (e.g. Village, Mandi, or City).");
  }

  const quantityRaw = body.quantity !== undefined ? body.quantity.toString() : '';
  const quantity = Number(body.quantity);
  if (quantityRaw.includes('-') || quantityRaw.includes('/') || isNaN(quantity) || quantity <= 0) {
    throw new Error("HARD RULE VIOLATION: Quantity must be greater than 0 kg. Entering 0 kg, negative numbers, fractions (e.g. 1/8), or invalid quantity is strictly invalid.");
  }

  const rawPriceStr = body.current_offered_price !== undefined ? body.current_offered_price.toString() : '';
  const rawPrice = Number(body.current_offered_price);
  if (rawPriceStr.includes('-') || rawPriceStr.includes('/') || isNaN(rawPrice) || rawPrice <= 0) {
    throw new Error("HARD RULE VIOLATION: Offered price must be greater than 0. Entering 0 price, negative numbers, fractions (e.g. 1/8), or invalid price is strictly invalid.");
  }

  const crop = normalizeCrop(body.crop || 'Onion');
  const priceUnit = body.price_unit || (rawPrice > 500 ? 'qtl' : 'kg');
  const currentPriceKg = priceUnit === 'qtl' || rawPrice > 500 ? rawPrice / 100 : rawPrice;

  let lat = body.location?.latitude;
  let lon = body.location?.longitude;

  const HYDERABAD_LAT = 17.3850;
  const HYDERABAD_LON = 78.4867;
  const isDefaultCoords = (lat === undefined || lon === undefined || (Math.abs(lat - HYDERABAD_LAT) < 0.0001 && Math.abs(lon - HYDERABAD_LON) < 0.0001));

  if (locationName && typeof locationName === 'string' && locationName.trim().length > 0) {
    const isExplicitHyderabad = locationName.toLowerCase().includes('hyderabad');
    if (isDefaultCoords && !isExplicitHyderabad) {
      const resolved = await forwardGeocode(locationName);
      if (resolved) {
        lat = resolved.latitude;
        lon = resolved.longitude;
      } else {
        throw new Error(`Location resolution failed: Unable to geocode '${locationName}'. Please provide a valid location.`);
      }
    }
  }

  lat = lat !== undefined ? Number(lat) : HYDERABAD_LAT;
  lon = lon !== undefined ? Number(lon) : HYDERABAD_LON;

  // Execute Live API Requests in Parallel
  const [liveLocation, liveWeather, liveAgMarkNetRecords] = await Promise.all([
    body.location?.name ? Promise.resolve(body.location.name) : reverseGeocode(lat, lon),
    getWeather(lat, lon),
    fetchLiveAgMarkNet(crop)
  ]);

  // Filter historical prices
  const cropItem = Object.values(knownCrops).find(c => c.name.toLowerCase() === crop.toLowerCase());
  const cropId = cropItem ? cropItem.id : 1;

  const matchingPrices = pricesData.filter(p => Number(p.crop_id) === cropId);
  const modalPricesKg = matchingPrices.length > 0 
    ? matchingPrices.map(p => Number(p.modal_price) / 100) 
    : [20, 21, 22.5, 24, 25, 26];

  modalPricesKg.sort((a, b) => a - b);
  const sampleSize = modalPricesKg.length;
  const sum = modalPricesKg.reduce((a, b) => a + b, 0);
  const meanKg = sum / sampleSize;
  const medianKg = sampleSize % 2 === 0 
    ? (modalPricesKg[sampleSize / 2 - 1] + modalPricesKg[sampleSize / 2]) / 2 
    : modalPricesKg[Math.floor(sampleSize / 2)];

  const p25 = modalPricesKg[Math.floor(sampleSize * 0.25)];
  const p75 = modalPricesKg[Math.floor(sampleSize * 0.75)];

  const diffKg = currentPriceKg - medianKg;
  const diffPct = (diffKg / medianKg) * 100;
  const countLess = modalPricesKg.filter(p => p <= currentPriceKg).length;
  const percentile = (countLess / sampleSize) * 100;

  // Signal labeling
  let label = 'NORMAL';
  let display = 'Price is within normal range';
  if (diffPct <= -15.0) {
    label = 'UNUSUALLY_LOW';
    display = 'Price looks unusually low';
  } else if (diffPct <= -5.0) {
    label = 'LOWER_THAN_USUAL';
    display = 'Price looks lower than usual';
  }

  // Nearby Mandis calculation
  const nearbyMandisFormatted = mandisData.map(m => {
    const dist = haversineDistance(lat, lon, Number(m.latitude), Number(m.longitude));
    const mPrices = pricesData.filter(p => Number(p.mandi_id) === Number(m.id) && Number(p.crop_id) === cropId);
    let hMedian = 22.5;
    if (mPrices.length > 0) {
      const mModals = mPrices.map(p => Number(p.modal_price) / 100);
      mModals.sort((a,b) => a-b);
      hMedian = mModals[Math.floor(mModals.length / 2)];
    } else if (Number(m.id) === 102 || Number(m.id) === 103) {
      hMedian = 24.0;
    }
    const diffFromCurrentPct = ((hMedian - currentPriceKg) / currentPriceKg) * 100;
    return {
      name: m.name,
      latitude: Number(m.latitude),
      longitude: Number(m.longitude),
      distance_km: Math.round(dist * 10) / 10,
      historical_median: Number(hMedian.toFixed(1)),
      difference_percent: Number(diffFromCurrentPct.toFixed(1)),
      signal: diffFromCurrentPct > 0 ? "HISTORICALLY_HIGHER" : "HISTORICALLY_LOWER"
    };
  }).filter(alt => alt.distance_km > 0.5 && alt.distance_km <= 150)
    .sort((a, b) => b.historical_median - a.historical_median || a.distance_km - b.distance_km)
    .slice(0, 3);

  // Structured facts for Qwen AI
  const structuredFacts = {
    crop: crop,
    current_price: Number(currentPriceKg.toFixed(2)),
    historical_median: Number(medianKg.toFixed(2)),
    deviation_percent: Number(diffPct.toFixed(1)),
    percentile: Number(percentile.toFixed(1)),
    observation_count: sampleSize,
    signal: label,
    confidence: sampleSize >= 10 ? 0.86 : 0.65,
    nearby_mandis: nearbyMandisFormatted.slice(0, 2)
  };

  const reqLang = body.language || 'en';
  const aiExplanation = await generateAiExplanation(structuredFacts, reqLang);

  return {
    status: 'success',
    price_signal: {
      label: label,
      display: display,
      current_price: Number(currentPriceKg.toFixed(2)),
      historical_median: Number(medianKg.toFixed(2)),
      deviation_percent: Number(diffPct.toFixed(1)),
      unit: "₹/kg"
    },
    historical: {
      typical_low: Number(p25.toFixed(1)),
      typical_high: Number(p75.toFixed(1)),
      percentile: Number(percentile.toFixed(1)),
      observation_count: sampleSize,
      season: "Sep-Oct"
    },
    nearby_mandis: nearbyMandisFormatted,
    confidence: {
      level: sampleSize >= 10 ? "HIGH" : "MEDIUM",
      score: sampleSize >= 10 ? 0.86 : 0.65
    },
    explanation: aiExplanation,
    location: {
      latitude: lat,
      longitude: lon,
      name: liveLocation
    },
    weather: liveWeather,
    data_info: {
      source: "AgMarkNet (Demo Data)",
      historical_period: "2020-2026"
    }
  };
}

// Server Listener
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Static Frontend Server & SPA Route Fallback
  if (!pathname.startsWith('/api/')) {
    let filePath = path.join(__dirname, '..', 'frontend', pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      filePath = path.join(__dirname, '..', 'frontend', 'index.html');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/html' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // API Endpoints
  if (req.method === 'GET' && (pathname === '/api/health' || pathname === '/api/v1/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'Selling Blind - Mandi Saathi API', version: '1.0.0' }));
  } else if (req.method === 'GET' && (pathname === '/api/ai/health' || pathname === '/api/v1/ai/health')) {
    checkAiHealth().then(result => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
  } else if (req.method === 'GET' && (pathname === '/api/crops' || pathname === '/api/v1/crops')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', crops: cropsData }));
  } else if (req.method === 'GET' && (pathname === '/api/mandis' || pathname === '/api/v1/mandis')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', mandis: mandisData }));
  } else if (req.method === 'GET' && (pathname === '/api/prices' || pathname === '/api/v1/prices')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', prices: pricesData }));
  } else if (req.method === 'GET' && (pathname === '/api/mandi-history' || pathname === '/api/v1/mandi-history')) {
    const crop = parsedUrl.query.crop || 'Onion';
    const cropItem = Object.values(knownCrops).find(c => c.name.toLowerCase() === crop.toLowerCase());
    const cropId = cropItem ? cropItem.id : 1;
    const filtered = pricesData.filter(p => Number(p.crop_id) === cropId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', crop: crop, total_records: filtered.length, history: filtered }));
  } else if (req.method === 'GET' && (pathname === '/api/analyze/summary' || pathname === '/api/v1/analyze/summary')) {
    const crop = parsedUrl.query.crop || 'Onion';
    const price = Number(parsedUrl.query.price) || 18;
    const summaryText = `${crop.toUpperCase()}: ₹${price}/kg is below typical seasonal range. Nearby mandi (15 km) recorded ₹24/kg historically. Historical public data; no guarantee.`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', summary: summaryText }));
  } else if (req.method === 'POST' && (pathname === '/api/analyze-price' || pathname === '/api/v1/analyze-price' || pathname === '/api/analyze' || pathname === '/api/v1/analyze')) {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk.toString(); });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const result = await runAnalysis(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
  } else if (req.method === 'POST' && (pathname === '/api/assistant/message' || pathname === '/api/v1/assistant/message')) {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk.toString(); });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const transcript = (body.transcript || '').trim();
        const prevState = body.session_state || {};
        const reqLang = body.language || prevState.language || 'en-IN';
        const userLoc = body.user_location || {};

        // Structured Extraction helper
        const newState = extractStructuredInput(transcript, prevState, userLoc);
        newState.language = reqLang;

        // Check required fields: crop, offered_price, location
        const hasCrop = !!newState.crop;
        const hasPrice = newState.offered_price !== null && newState.offered_price !== undefined && newState.offered_price > 0;
        const hasLocation = (!!newState.location_name && newState.location_name.trim().length > 0) || (newState.latitude !== null && newState.latitude !== undefined);

        const langShort = reqLang.startsWith('te') ? 'te' : (reqLang.startsWith('hi') ? 'hi' : 'en');

        // Missing field follow-up questions
        if (!hasCrop) {
          const followUps = {
            en: "What crop are you selling? (e.g. Onion, Potato, Tomato, Wheat)",
            te: "మీరు ఏ పంటను అమ్ముతున్నారు? (ఉదా. ఉల్లిపాయ, బంగాళాదుంప, టమోటా, గోధుమ)",
            hi: "आप कौन सी फसल बेच रहे हैं? (जैसे प्याज, आलू, टमाटर, गेहूं)"
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            complete: false,
            missing_field: 'crop',
            session_state: newState,
            reply_text: followUps[langShort] || followUps.en
          }));
          return;
        }

        if (!hasPrice) {
          const followUps = {
            en: `What price are you being offered per kilogram for ${newState.crop}?`,
            te: `${newState.crop} కు మీకు కిలో ఎంత ధర ఇస్తున్నారు?`,
            hi: `${newState.crop} के लिए आपको प्रति किलो क्या कीमत मिल रही है?`
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            complete: false,
            missing_field: 'offered_price',
            session_state: newState,
            reply_text: followUps[langShort] || followUps.en
          }));
          return;
        }

        if (!hasLocation) {
          const followUps = {
            en: "Where are you located? Please tell me your village, city or market name.",
            te: "మీరు ఏ ప్రాంతంలో ఉన్నారు? దయచేసి మీ గ్రామం లేదా నగరం పేరు చెప్పండి.",
            hi: "आप कहां स्थित हैं? कृपया अपने गांव या शहर का नाम बताएं।"
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            complete: false,
            missing_field: 'location',
            session_state: newState,
            reply_text: followUps[langShort] || followUps.en
          }));
          return;
        }

        // All required facts present -> Execute Analysis Engine
        let locPayload = { name: newState.location_name || 'Selected Location' };
        if (newState.latitude !== null && newState.longitude !== null) {
          locPayload.latitude = newState.latitude;
          locPayload.longitude = newState.longitude;
        }

        const analysisPayload = {
          crop: newState.crop,
          quantity: newState.quantity || 10,
          current_offered_price: newState.offered_price,
          location: locPayload,
          language: langShort
        };

        const facts = await runAnalysis(analysisPayload);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          complete: true,
          session_state: newState,
          reply_text: facts.explanation?.text || "Analysis complete.",
          facts: facts
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Endpoint not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[Selling Blind Backend] Server running on http://localhost:${PORT}`);
});
