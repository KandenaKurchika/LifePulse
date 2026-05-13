/* ═══════════════════════════════════════════
   LifePulse — Charts & Visualizations
   ═══════════════════════════════════════════ */

let dashChart = null, trendChart = null, barChart = null, doughnutChart = null, moodChart = null;

const CHART_COLORS = {
  fitness: { bg: 'rgba(99,102,241,0.2)', border: '#6366f1' },
  study: { bg: 'rgba(139,92,246,0.2)', border: '#8b5cf6' },
  work: { bg: 'rgba(6,182,212,0.2)', border: '#06b6d4' },
  sleep: { bg: 'rgba(16,185,129,0.2)', border: '#10b981' },
  water: { bg: 'rgba(59,130,246,0.2)', border: '#3b82f6' },
  mood: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b' }
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyle: 'circle' } },
    tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, cornerRadius: 8, titleFont: { family: 'Inter', weight: '600' }, bodyFont: { family: 'Inter' } }
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { color: 'rgba(255,255,255,0.08)' } },
    y: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { color: 'rgba(255,255,255,0.08)' }, beginAtZero: true }
  }
};

function shortDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function destroyChart(chart) { if (chart) chart.destroy(); return null; }

function setTimeRange(range) {
  currentTimeRange = range;
  document.querySelectorAll('.time-pill').forEach(p => p.classList.toggle('active', p.dataset.range == range));
  renderAllCharts();
}

// ── Dashboard Mini Chart ──
function renderDashboardChart() {
  const { entries, dates } = getEntriesInRange(7);
  const labels = dates.map(shortDate);

  dashChart = destroyChart(dashChart);
  const ctx = document.getElementById('dashboardChart');
  if (!ctx) return;

  dashChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Fitness (min)', data: dates.map(d => entries[d]?.fitness || 0), borderColor: CHART_COLORS.fitness.border, backgroundColor: CHART_COLORS.fitness.bg, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Study (hrs)', data: dates.map(d => entries[d]?.study || 0), borderColor: CHART_COLORS.study.border, backgroundColor: CHART_COLORS.study.bg, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Sleep (hrs)', data: dates.map(d => entries[d]?.sleep || 0), borderColor: CHART_COLORS.sleep.border, backgroundColor: CHART_COLORS.sleep.bg, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 }
      ]
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } } }
  });
}

// ── Trend Line Chart ──
function renderTrendChart() {
  const { entries, dates } = getEntriesInRange(currentTimeRange);
  const labels = dates.map(shortDate);

  trendChart = destroyChart(trendChart);
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Fitness', data: dates.map(d => entries[d]?.fitness || 0), borderColor: CHART_COLORS.fitness.border, backgroundColor: CHART_COLORS.fitness.bg, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: 'Study', data: dates.map(d => entries[d]?.study || 0), borderColor: CHART_COLORS.study.border, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: 'Work', data: dates.map(d => entries[d]?.work || 0), borderColor: CHART_COLORS.work.border, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: 'Sleep', data: dates.map(d => entries[d]?.sleep || 0), borderColor: CHART_COLORS.sleep.border, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: 'Water', data: dates.map(d => entries[d]?.water || 0), borderColor: CHART_COLORS.water.border, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3 }
      ]
    },
    options: CHART_DEFAULTS
  });
}

// ── Bar Chart ──
function renderBarChart() {
  const { entries, dates } = getEntriesInRange(currentTimeRange);
  const labels = dates.map(shortDate);

  barChart = destroyChart(barChart);
  const ctx = document.getElementById('barChart');
  if (!ctx) return;

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Fitness', data: dates.map(d => entries[d]?.fitness || 0), backgroundColor: CHART_COLORS.fitness.border, borderRadius: 4 },
        { label: 'Study', data: dates.map(d => entries[d]?.study || 0), backgroundColor: CHART_COLORS.study.border, borderRadius: 4 },
        { label: 'Sleep', data: dates.map(d => entries[d]?.sleep || 0), backgroundColor: CHART_COLORS.sleep.border, borderRadius: 4 }
      ]
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins }, scales: { ...CHART_DEFAULTS.scales, x: { ...CHART_DEFAULTS.scales.x, stacked: false }, y: { ...CHART_DEFAULTS.scales.y, stacked: false } } }
  });
}

// ── Doughnut Chart ──
function renderDoughnutChart() {
  const { entries, dates } = getEntriesInRange(currentTimeRange);
  if (!dates.length) return;

  let totals = { fitness: 0, study: 0, work: 0, sleep: 0 };
  dates.forEach(d => {
    totals.fitness += (entries[d]?.fitness || 0) / 60;
    totals.study += entries[d]?.study || 0;
    totals.work += entries[d]?.work || 0;
    totals.sleep += entries[d]?.sleep || 0;
  });

  doughnutChart = destroyChart(doughnutChart);
  const ctx = document.getElementById('doughnutChart');
  if (!ctx) return;

  doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Fitness', 'Study', 'Work', 'Sleep'],
      datasets: [{
        data: [totals.fitness.toFixed(1), totals.study.toFixed(1), totals.work.toFixed(1), totals.sleep.toFixed(1)],
        backgroundColor: [CHART_COLORS.fitness.border, CHART_COLORS.study.border, CHART_COLORS.work.border, CHART_COLORS.sleep.border],
        borderWidth: 0, hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true } },
        tooltip: CHART_DEFAULTS.plugins.tooltip
      }
    }
  });
}

// ── Mood Chart ──
function renderMoodChart() {
  const { entries, dates } = getEntriesInRange(currentTimeRange);
  const labels = dates.map(shortDate);
  const moodData = dates.map(d => entries[d]?.mood || null);

  moodChart = destroyChart(moodChart);
  const ctx = document.getElementById('moodChart');
  if (!ctx) return;

  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mood',
        data: moodData,
        borderColor: CHART_COLORS.mood.border,
        backgroundColor: CHART_COLORS.mood.bg,
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 6, pointHoverRadius: 8,
        pointBackgroundColor: moodData.map(m => {
          if (m >= 4) return '#10b981';
          if (m === 3) return '#f59e0b';
          if (m >= 1) return '#ef4444';
          return '#64748b';
        }),
        pointBorderColor: '#0a0e1a', pointBorderWidth: 2
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        ...CHART_DEFAULTS.scales,
        y: { ...CHART_DEFAULTS.scales.y, min: 0, max: 5, ticks: { ...CHART_DEFAULTS.scales.y.ticks, stepSize: 1, callback: v => ['', '😞', '😔', '😐', '😊', '😄'][v] || '' } }
      }
    }
  });
}

function renderAllCharts() {
  renderDashboardChart();
  renderTrendChart();
  renderBarChart();
  renderDoughnutChart();
  renderMoodChart();
}
