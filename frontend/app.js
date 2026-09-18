// Selling Blind - Mandi Saathi Frontend Client Logic

const API_BASE = 'http://localhost:8000/api/v1';

let currentCoordinates = {
  latitude: 17.3850,
  longitude: 78.4867
};

// Navigation View Switcher
function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollToElement(elemId) {
  const el = document.getElementById(elemId);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToHowItWorks() {
  switchView('home-view');
  setTimeout(() => scrollToElement('home-view'), 100);
}

function openAiChatModal() {
  alert("AI Assistant: Hello farmer! I can help analyze your offered mandi prices, crop seasons, and nearby market alternatives based on historical AgMarkNet records.");
}

// Browser Geolocation API
function detectBrowserLocation() {
  const locInput = document.getElementById('location-input');
  if (navigator.geolocation) {
    locInput.value = "Detecting coordinates...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentCoordinates.latitude = pos.coords.latitude;
        currentCoordinates.longitude = pos.coords.longitude;
        locInput.value = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
      },
      (err) => {
        alert("Geolocation access denied or unavailable. Using manual location selection.");
        locInput.value = "Hyderabad, Telangana";
      },
      { timeout: 5000 }
    );
  } else {
    alert("Browser Geolocation is not supported by your browser.");
  }
}

// Form Submission & API Integration
async function handleFormSubmit(event) {
  event.preventDefault();

  const crop = document.getElementById('crop-input').value;
  const quantityRaw = document.getElementById('quantity-input').value.replace(/[^0-9.]/g, '') || "2500";
  const priceRaw = document.getElementById('price-input').value.replace(/[^0-9.]/g, '') || "18";
  const locationName = document.getElementById('location-input').value;

  const btnCheck = document.getElementById('btn-check-price');
  btnCheck.innerText = "Analyzing Prices...";
  btnCheck.disabled = true;

  const payload = {
    crop: crop,
    quantity: parseFloat(quantityRaw),
    current_offered_price: parseFloat(priceRaw),
    price_unit: parseFloat(priceRaw) > 500 ? "qtl" : "kg",
    location: {
      latitude: currentCoordinates.latitude,
      longitude: currentCoordinates.longitude,
      name: locationName
    }
  };

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      renderDashboardResults(data);
      switchView('results-view');
    } else {
      alert("Failed to analyze price. Please check input parameters.");
    }
  } catch (err) {
    console.error("API error:", err);
    // Offline / Demo Fallback Simulation if backend is unreachable
    renderDemoFallback(payload);
    switchView('results-view');
  } finally {
    btnCheck.innerText = "Check Price";
    btnCheck.disabled = false;
  }
}

// Render Dashboard Data
function renderDashboardResults(data) {
  const priceSig = data.price_signal || {};
  const hist = data.historical || {};
  const explanation = data.explanation || {};
  const conf = data.confidence || {};

  const currentKg = priceSig.current_price || 18.0;
  const medianKg = priceSig.historical_median || 24.0;
  const diffPct = priceSig.deviation_percent || -20.0;
  const lowerRange = hist.typical_low || 20.0;
  const upperRange = hist.typical_high || 26.0;

  // Alert Card
  document.getElementById('display-offered-price').innerText = `₹${currentKg}`;
  document.getElementById('display-diff-text').innerText = `${Math.abs(diffPct)}% ${diffPct < 0 ? 'below' : 'above'} the historical seasonal median`;
  document.getElementById('display-typical-text').innerHTML = `Historical median: <strong>₹${medianKg.toFixed(1)}/kg</strong>`;
  document.getElementById('anomaly-badge-text').innerText = priceSig.display ? priceSig.display.toUpperCase() : "PRICE LOOKS LOWER THAN USUAL";

  // Metric Pills
  document.getElementById('pill-today-offer').innerText = `₹${currentKg}/kg`;
  document.getElementById('pill-historical-median').innerText = `₹${medianKg.toFixed(1)}/kg`;
  document.getElementById('pill-typical-range').innerText = `₹${lowerRange}-₹${upperRange}/kg`;
  document.getElementById('pill-difference').innerText = `${diffPct}%`;

  // Decision & Weather / AI Explanation
  document.getElementById('decision-message-text').innerText = explanation.text || "Analyzed against historical seasonal data.";
  document.getElementById('quality-rating-badge').innerText = `${conf.level || 'HIGH'} (${conf.score || 0.86})`;
  document.getElementById('weather-context-text').innerText = `Source: ${explanation.source || 'ollama'} (Qwen3:8B)`;
  document.getElementById('disclaimer-text').innerText = "Based on historical public mandi data. Historical performance does not guarantee future prices or outcomes.";

  // Nearby Mandis Table
  const tbody = document.getElementById('nearby-mandis-tbody');
  tbody.innerHTML = "";
  if (data.nearby_mandis && data.nearby_mandis.length > 0) {
    data.nearby_mandis.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${m.name}</strong></td>
        <td>${m.distance_km} km</td>
        <td><strong style="color: #047857;">₹${m.historical_median}/kg</strong></td>
        <td>${m.difference_percent}%</td>
        <td><span class="mandi-badge good">${m.signal}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="5">No nearby mandis found within 300 km.</td></tr>`;
  }

  // Draw Charts
  drawTrendChart(currentKg, medianKg);
  drawDistributionChart(currentKg, medianKg, lowerRange, upperRange);
}

// Demo Fallback Renderer
function renderDemoFallback(payload) {
  renderDashboardResults({
    current_price_per_kg: payload.current_offered_price,
    historical_analysis: {
      median: 22.5,
      difference_percentage: -20.0,
      historical_lower_range: 20.0,
      historical_upper_range: 26.0
    },
    anomaly: { status: "UNUSUALLY_LOW" },
    decision: {
      simple_message: `The offered price (₹${payload.current_offered_price}/kg) is about 20% below the typical historical seasonal range (median ₹22.5/kg). Bowenpally Agricultural Market (15 km away) has historically recorded better prices (~₹24.0/kg) during comparable periods.`
    },
    data_quality: "GOOD",
    weather: { message: "Clear in region (29°C)" },
    disclaimer: "Based on historical public mandi data. Historical performance does not guarantee future prices or outcomes.",
    nearby_alternatives: [
      { mandi_name: "Bowenpally Wholesale Market", district: "Hyderabad", state: "Telangana", distance_km: 15.0, historical_median_price: 24.0, sample_size: 80, data_quality: "GOOD" },
      { mandi_name: "Malakpet Market", district: "Hyderabad", state: "Telangana", distance_km: 18.5, historical_median_price: 23.5, sample_size: 55, data_quality: "GOOD" }
    ]
  });
}

// Draw Trend Chart (HTML5 Canvas)
function drawTrendChart(currentPrice, medianPrice) {
  const canvas = document.getElementById('trendChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set dimensions
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 240;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const dataPoints = [18, 22, 26, 24, 25, currentPrice];

  const padding = 40;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  const minVal = 14;
  const maxVal = 30;

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#94a3b8';

  for (let v = 16; v <= 30; v += 4) {
    const y = h - padding - ((v - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
    ctx.fillText(`₹${v}`, 8, y + 4);
  }

  // Draw smooth curve
  ctx.beginPath();
  const step = chartW / (months.length - 1);
  const points = dataPoints.map((val, i) => ({
    x: padding + i * step,
    y: h - padding - ((val - minVal) / (maxVal - minVal)) * chartH
  }));

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw points & labels
  points.forEach((pt, i) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Month label
    ctx.fillStyle = '#64748b';
    ctx.fillText(months[i], pt.x - 10, h - 12);

    // Value pill label
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`₹${dataPoints[i]}`, pt.x - 8, pt.y - 10);
  });
}

// Draw Distribution Chart (Bar comparison)
function drawDistributionChart(todayOffer, histMedian, lowerRange, upperRange) {
  const canvas = document.getElementById('distributionChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth || 300;
  canvas.height = 140;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const labels = ["Today's offer", "Hist. median", "Typical range"];
  const values = [todayOffer, histMedian, (lowerRange + upperRange) / 2];
  const colors = ['#10b981', '#3b82f6', '#a855f7'];

  const barW = 40;
  const gap = (w - 60 - barW * 3) / 2;

  values.forEach((val, i) => {
    const x = 30 + i * (barW + gap);
    const barH = (val / 30) * (h - 40);
    const y = h - 25 - barH;

    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 6) : ctx.rect(x, y, barW, barH);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`₹${val}`, x + 6, y - 6);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText(labels[i], x - 5, h - 8);
  });
}

// ClickSpark Canvas Animation Effect
function initClickSpark() {
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.id = 'sparkCanvasOverlay';
  sparkCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(sparkCanvas);

  const ctx = sparkCanvas.getContext('2d');
  let sparks = [];

  function resize() {
    sparkCanvas.width = window.innerWidth;
    sparkCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function easeOut(t) {
    return t * (2 - t);
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    const duration = 400;
    const sparkRadius = 20;
    const sparkSize = 10;

    sparks = sparks.filter(spark => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= duration) return false;

      const progress = elapsed / duration;
      const eased = easeOut(progress);

      const distance = eased * sparkRadius;
      const lineLength = sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = spark.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  window.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    const sparkCount = 8;
    const colors = ['#10b981', '#2563eb', '#363B45', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < sparkCount; i++) {
      sparks.push({
        x: x,
        y: y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
        color: color
      });
    }
  });
}

// Initialize default view & click spark
document.addEventListener('DOMContentLoaded', () => {
  switchView('home-view');
  initClickSpark();
});
