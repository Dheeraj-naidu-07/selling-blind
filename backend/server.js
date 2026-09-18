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

// Crop normalization
const knownCrops = {
  'onion': { id: 1, name: 'Onion', category: 'Vegetables', aliases: ['pyaz', 'kanda', 'ullipaya'] },
  'potato': { id: 2, name: 'Potato', category: 'Vegetables', aliases: ['aloo', 'alugadda'] },
  'tomato': { id: 3, name: 'Tomato', category: 'Vegetables', aliases: ['tamatar', 'thakkali'] },
  'wheat': { id: 4, name: 'Wheat', category: 'Grains', aliases: ['gehun', 'godhuma'] },
  'paddy': { id: 5, name: 'Paddy', category: 'Grains', aliases: ['rice', 'chawal', 'dhan'] },
  'cotton': { id: 6, name: 'Cotton', category: 'Fiber', aliases: ['kapas', 'patti'] },
  'red chilli': { id: 7, name: 'Red Chilli', category: 'Spices', aliases: ['chilli', 'mirchi', 'lal mirch'] },
  'maize': { id: 8, name: 'Maize', category: 'Grains', aliases: ['corn', 'makka', 'jonnalu'] }
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

// AI Service Call (Remote Ollama on Mac 10.10.14.157:11434)
async function generateAiExplanation(structuredFacts) {
  if (AI_MOCK_MODE) {
    return {
      text: `The offered price of ₹${structuredFacts.current_price}/kg is lower than the typical historical seasonal median.`,
      source: "mock"
    };
  }

  const systemPrompt = "You are the explanation layer for a mandi price intelligence system.\n\n" +
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
      // ONLY return message.content (ignore message.thinking)
      const content = (message.content || '').trim();
      if (content) {
        return { text: content, source: "ollama" };
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }

  // Fallback explanation if Ollama is unreachable
  const devPct = structuredFacts.deviation_percent || 0.0;
  return {
    text: `The offered price is about ${Math.abs(devPct).toFixed(1)}% below the historical seasonal median based on available public mandi data.`,
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

// Core Analysis Engine
async function runAnalysis(body) {
  const crop = normalizeCrop(body.crop || 'Onion');
  const quantity = Number(body.quantity) || 1000;
  let rawPrice = Number(body.current_offered_price) || 18;
  const priceUnit = body.price_unit || (rawPrice > 500 ? 'qtl' : 'kg');
  const currentPriceKg = priceUnit === 'qtl' || rawPrice > 500 ? rawPrice / 100 : rawPrice;

  const lat = body.location?.latitude || 17.3850;
  const lon = body.location?.longitude || 78.4867;

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

  // Nearby Mandis
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
      distance_km: Math.round(dist * 10) / 10,
      historical_median: Number(hMedian.toFixed(1)),
      difference_percent: Number(diffFromCurrentPct.toFixed(1)),
      signal: diffFromCurrentPct > 0 ? "HISTORICALLY_HIGHER" : "HISTORICALLY_LOWER"
    };
  }).filter(alt => alt.distance_km > 0.5 && alt.distance_km <= 300)
    .sort((a, b) => b.historical_median - a.historical_median || a.distance_km - b.distance_km)
    .slice(0, 3);

  // Structured facts for Qwen
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

  const aiExplanation = await generateAiExplanation(structuredFacts);

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
    data_info: {
      source: "AgMarkNet",
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

  // Static Frontend Server Fallback
  if (!pathname.startsWith('/api/')) {
    let filePath = path.join(__dirname, '..', 'frontend', pathname === '/' ? 'index.html' : pathname);
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
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
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
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Endpoint not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[Selling Blind Backend] Server running on http://localhost:${PORT}`);
});
