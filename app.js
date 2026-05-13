/* ═══════════════════════════════════════════
   LifePulse — Core Application Logic
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'lifepulse_data';
const GOALS_KEY = 'lifepulse_goals';
const HABITS_KEY = 'lifepulse_habits';

const DEFAULT_GOALS = {
  fitness: 30, study: 4, work: 8, sleep: 7, water: 8
};

const DEFAULT_HABITS = [
  'Read for 30 minutes',
  'Meditate',
  'No junk food',
  'Exercise',
  'Journal writing'
];

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "A year from now you'll wish you had started today.", author: "Karen Lamb" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John Maxwell" }
];

const MOOD_EMOJIS = ['', '😞', '😔', '😐', '😊', '😄'];

// ── State ──
let currentPage = 'dashboard';
let selectedMood = 0;
let currentTimeRange = 7;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setLogDateToday();
  setupNavigation();
  setupMobileMenu();
  loadHabits();
  loadGoalsUI();
  updateGreeting();
  updateDashboard();
  showQuote();
  renderHabitSettings();
  loadLogForDate();
  loadTheme();
  renderHeatmap();
  loadReminderUI();
  registerSW();
  if (typeof renderAllCharts === 'function') renderAllCharts();
  if (typeof generateInsights === 'function') generateInsights();
  if (typeof renderAchievements === 'function') renderAchievements();

  document.getElementById('log-date').addEventListener('change', loadLogForDate);
}

// ── Navigation ──
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');

  // Refresh page data
  if (page === 'dashboard') updateDashboard();
  if (page === 'analytics' && typeof renderAllCharts === 'function') renderAllCharts();
  if (page === 'insights') {
    if (typeof generateInsights === 'function') generateInsights();
    if (typeof renderAchievements === 'function') renderAchievements();
  }
  if (page === 'log') loadLogForDate();
}

function setupMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
}

// ── Greeting ──
function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Morning';
  if (hour >= 12 && hour < 17) greeting = 'Afternoon';
  else if (hour >= 17) greeting = 'Evening';
  document.getElementById('greeting-time').textContent = greeting;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('today-date-display').textContent = new Date().toLocaleDateString('en-US', options);
}

function showQuote() {
  const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;
  const q = QUOTES[dayIndex];
  document.getElementById('quote-text').textContent = q.text;
  document.getElementById('quote-author').textContent = `— ${q.author}`;
}

// ── LocalStorage CRUD ──
function getAllEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function getEntry(date) {
  return getAllEntries()[date] || null;
}

function saveEntry(date, data) {
  const entries = getAllEntries();
  entries[date] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getGoals() {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY)) || { ...DEFAULT_GOALS };
  } catch { return { ...DEFAULT_GOALS }; }
}

function saveGoalsData(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function getHabits() {
  try {
    const h = JSON.parse(localStorage.getItem(HABITS_KEY));
    return h && h.length ? h : [...DEFAULT_HABITS];
  } catch { return [...DEFAULT_HABITS]; }
}

function saveHabitsData(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

// ── Date Helpers ──
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDateStr(d) {
  return d.toISOString().split('T')[0];
}

function setLogDateToday() {
  document.getElementById('log-date').value = getTodayStr();
  updateLogDateLabel();
  loadLogForDate();
}

function updateLogDateLabel() {
  const dateInput = document.getElementById('log-date');
  const label = document.getElementById('log-date-label');
  if (!dateInput.value) return;
  const d = new Date(dateInput.value + 'T00:00:00');
  const today = getTodayStr();
  if (dateInput.value === today) {
    label.textContent = '(Today)';
  } else {
    label.textContent = `(${d.toLocaleDateString('en-US', { weekday: 'long' })})`;
  }
}

// ── Log Form ──
function updateRangeVal(field) {
  const el = document.getElementById(`log-${field}`);
  document.getElementById(`${field}-val`).textContent = el.value;
}

function selectMood(val) {
  selectedMood = val;
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.mood) === val);
  });
}

function loadHabits() {
  const habits = getHabits();
  const container = document.getElementById('habit-list');
  container.innerHTML = '';
  habits.forEach((h, i) => {
    const div = document.createElement('div');
    div.className = 'habit-item';
    div.dataset.index = i;
    div.innerHTML = `<div class="habit-check"></div><span>${h}</span>`;
    div.addEventListener('click', () => div.classList.toggle('checked'));
    container.appendChild(div);
  });
}

function loadLogForDate() {
  updateLogDateLabel();
  const date = document.getElementById('log-date').value;
  if (!date) return;
  const entry = getEntry(date);

  const fields = ['fitness', 'study', 'work', 'sleep', 'water'];
  if (entry) {
    fields.forEach(f => {
      const el = document.getElementById(`log-${f}`);
      el.value = entry[f] || 0;
      document.getElementById(`${f}-val`).textContent = entry[f] || 0;
    });
    selectMood(entry.mood || 0);
    document.getElementById('log-notes').value = entry.notes || '';

    // Restore habits
    const habitItems = document.querySelectorAll('#habit-list .habit-item');
    habitItems.forEach((item, i) => {
      if (entry.habits && entry.habits[i]) {
        item.classList.add('checked');
      } else {
        item.classList.remove('checked');
      }
    });
  } else {
    clearLogForm(true);
  }
}

function clearLogForm(silent) {
  ['fitness', 'study', 'work', 'sleep', 'water'].forEach(f => {
    document.getElementById(`log-${f}`).value = 0;
    document.getElementById(`${f}-val`).textContent = 0;
  });
  selectMood(0);
  document.getElementById('log-notes').value = '';
  document.querySelectorAll('#habit-list .habit-item').forEach(i => i.classList.remove('checked'));
  if (!silent) showToast('Form cleared', 'success');
}

function saveLog() {
  const date = document.getElementById('log-date').value;
  if (!date) { showToast('Please select a date', 'error'); return; }

  const habitItems = document.querySelectorAll('#habit-list .habit-item');
  const habits = [];
  habitItems.forEach(item => habits.push(item.classList.contains('checked')));

  const data = {
    fitness: parseFloat(document.getElementById('log-fitness').value) || 0,
    study: parseFloat(document.getElementById('log-study').value) || 0,
    work: parseFloat(document.getElementById('log-work').value) || 0,
    sleep: parseFloat(document.getElementById('log-sleep').value) || 0,
    water: parseInt(document.getElementById('log-water').value) || 0,
    mood: selectedMood,
    habits: habits,
    notes: document.getElementById('log-notes').value.trim(),
    timestamp: Date.now()
  };

  saveEntry(date, data);
  showToast('✅ Entry saved successfully!', 'success');

  // Refresh
  updateDashboard();
  if (typeof renderAllCharts === 'function') renderAllCharts();
  if (typeof generateInsights === 'function') generateInsights();
}

// ── Dashboard Update ──
function updateDashboard() {
  const entries = getAllEntries();
  const dates = Object.keys(entries).sort();
  const today = getTodayStr();
  const todayEntry = entries[today];

  // Today summary
  if (todayEntry) {
    document.getElementById('ts-fitness').textContent = `${todayEntry.fitness}m`;
    document.getElementById('ts-study').textContent = `${todayEntry.study}h`;
    document.getElementById('ts-work').textContent = `${todayEntry.work}h`;
    document.getElementById('ts-sleep').textContent = `${todayEntry.sleep}h`;
    document.getElementById('ts-water').textContent = todayEntry.water;
    document.getElementById('ts-mood').textContent = MOOD_EMOJIS[todayEntry.mood] || '—';
  } else {
    ['ts-fitness', 'ts-study', 'ts-work', 'ts-sleep', 'ts-water', 'ts-mood'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
  }

  // Stats
  document.getElementById('stat-total-days').textContent = dates.length;

  // Average mood
  const moodEntries = dates.filter(d => entries[d].mood > 0);
  if (moodEntries.length) {
    const avgMood = moodEntries.reduce((s, d) => s + entries[d].mood, 0) / moodEntries.length;
    document.getElementById('stat-avg-mood').textContent = MOOD_EMOJIS[Math.round(avgMood)] || avgMood.toFixed(1);
  }

  // Streak calculation
  const { current, best } = calculateStreak(entries);
  document.getElementById('stat-streak').textContent = current;
  document.getElementById('stat-best-streak').textContent = best;
  document.getElementById('streak-display-count').textContent = `${current} day${current !== 1 ? 's' : ''}`;

  // Dashboard mini chart
  if (typeof renderDashboardChart === 'function') renderDashboardChart();
}

function calculateStreak(entries) {
  const dates = Object.keys(entries).sort().reverse();
  if (!dates.length) return { current: 0, best: 0 };

  let current = 0;
  let best = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Check if today or yesterday has entry (allow for not yet logged today)
  const todayStr = getDateStr(checkDate);
  if (!entries[todayStr]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count current streak
  while (true) {
    const ds = getDateStr(checkDate);
    if (entries[ds]) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak
  const allDates = Object.keys(entries).sort();
  let tempStreak = 1;
  best = 1;
  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1] + 'T00:00:00');
    const curr = new Date(allDates[i] + 'T00:00:00');
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      tempStreak++;
      best = Math.max(best, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  if (!allDates.length) best = 0;
  best = Math.max(best, current);
  return { current, best };
}

// ── Goals ──
function loadGoalsUI() {
  const goals = getGoals();
  const container = document.getElementById('goals-list');
  const labels = {
    fitness: '🏋️ Fitness (min/day)',
    study: '📚 Study (hrs/day)',
    work: '💼 Work (hrs/day)',
    sleep: '😴 Sleep (hrs/day)',
    water: '💧 Water (glasses/day)'
  };
  container.innerHTML = '';
  for (const [key, label] of Object.entries(labels)) {
    container.innerHTML += `
      <div class="goal-input-row">
        <label>${label}</label>
        <input type="number" id="goal-${key}" value="${goals[key] || 0}" min="0" step="0.5">
      </div>`;
  }
}

function saveGoals() {
  const goals = {};
  ['fitness', 'study', 'work', 'sleep', 'water'].forEach(k => {
    goals[k] = parseFloat(document.getElementById(`goal-${k}`).value) || 0;
  });
  saveGoalsData(goals);
  showToast('✅ Goals saved!', 'success');
}

// ── Habit Settings ──
function renderHabitSettings() {
  const habits = getHabits();
  const container = document.getElementById('custom-habits-settings');
  container.innerHTML = '';
  habits.forEach((h, i) => {
    container.innerHTML += `
      <div class="goal-input-row" style="justify-content: space-between;">
        <span>${h}</span>
        <button class="btn btn-sm btn-danger" onclick="removeHabit(${i})">✕</button>
      </div>`;
  });
}

function addCustomHabit() {
  const input = document.getElementById('new-habit-input');
  const name = input.value.trim();
  if (!name) return;
  const habits = getHabits();
  habits.push(name);
  saveHabitsData(habits);
  input.value = '';
  loadHabits();
  renderHabitSettings();
  showToast('✅ Habit added!', 'success');
}

function removeHabit(index) {
  const habits = getHabits();
  habits.splice(index, 1);
  saveHabitsData(habits);
  loadHabits();
  renderHabitSettings();
  showToast('Habit removed', 'success');
}

// ── Data Export / Import ──
function exportDataAsPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    showToast('❌ PDF library not loaded. Please check your internet connection.', 'error');
    return;
  }

  const entries = getAllEntries();
  const dates = Object.keys(entries).sort();
  const goals = getGoals();
  const habits = getHabits();

  if (dates.length === 0) {
    showToast('⚠️ No data to export. Log some days first!', 'error');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 0;

  // ── Helper: check page overflow ──
  function checkPage(needed) {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  }

  // ── HEADER ──
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 48, 'F');
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 42, pageW, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('LifePulse — Progress Report', margin, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated: ${reportDate}`, margin, 38);
  y = 60;

  // ── OVERVIEW STATS ──
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview', margin, y);
  y += 10;

  const { current: streak, best: bestStreak } = calculateStreak(entries);
  const moodEntries = dates.filter(d => entries[d].mood > 0);
  const avgMood = moodEntries.length ? (moodEntries.reduce((s, d) => s + entries[d].mood, 0) / moodEntries.length).toFixed(1) : 'N/A';
  const moodLabels = ['', 'Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'];
  const avgMoodLabel = avgMood !== 'N/A' ? `${avgMood}/5 (${moodLabels[Math.round(avgMood)]})` : 'N/A';

  const statsData = [
    { label: 'Total Days Tracked', value: `${dates.length}` },
    { label: 'Current Streak', value: `${streak} day${streak !== 1 ? 's' : ''}` },
    { label: 'Best Streak', value: `${bestStreak} day${bestStreak !== 1 ? 's' : ''}` },
    { label: 'Average Mood', value: avgMoodLabel },
    { label: 'Tracking Since', value: new Date(dates[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
  ];

  // Draw stats boxes
  const boxW = (pageW - margin * 2 - 10) / 2;
  statsData.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = margin + col * (boxW + 10);
    const by = y + row * 22;

    doc.setFillColor(245, 245, 255);
    doc.roundedRect(bx, by, boxW, 18, 3, 3, 'F');
    doc.setDrawColor(200, 200, 230);
    doc.roundedRect(bx, by, boxW, 18, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text(stat.label, bx + 6, by + 7);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 80);
    doc.text(stat.value, bx + 6, by + 14);
  });

  y += Math.ceil(statsData.length / 2) * 22 + 10;

  // ── GOALS SECTION ──
  checkPage(40);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Goals', margin, y);
  y += 8;

  const goalLabels = { fitness: 'Fitness (min)', study: 'Study (hrs)', work: 'Work (hrs)', sleep: 'Sleep (hrs)', water: 'Water (glasses)' };

  // Calculate averages
  const totals = { fitness: 0, study: 0, work: 0, sleep: 0, water: 0 };
  dates.forEach(d => {
    const e = entries[d];
    totals.fitness += e.fitness || 0;
    totals.study += e.study || 0;
    totals.work += e.work || 0;
    totals.sleep += e.sleep || 0;
    totals.water += e.water || 0;
  });

  const colW = (pageW - margin * 2) / 4;

  // Table header
  doc.setFillColor(99, 102, 241);
  doc.rect(margin, y, pageW - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Category', margin + 4, y + 5.5);
  doc.text('Goal', margin + colW + 4, y + 5.5);
  doc.text('Average', margin + colW * 2 + 4, y + 5.5);
  doc.text('Status', margin + colW * 3 + 4, y + 5.5);
  y += 8;

  Object.entries(goalLabels).forEach(([key, label], i) => {
    const avg = (totals[key] / dates.length).toFixed(1);
    const goal = goals[key] || 0;
    const pct = goal > 0 ? ((avg / goal) * 100).toFixed(0) : '—';
    const status = goal > 0 ? (avg >= goal ? 'Achieved' : `${pct}%`) : 'No goal set';

    const bgColor = i % 2 === 0 ? [250, 250, 255] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(margin, y, pageW - margin * 2, 7, 'F');

    doc.setTextColor(60, 60, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, margin + 4, y + 5);
    doc.text(`${goal}`, margin + colW + 4, y + 5);
    doc.text(`${avg}`, margin + colW * 2 + 4, y + 5);

    if (status === 'Achieved') {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(status, margin + colW * 3 + 4, y + 5);
    y += 7;
  });

  y += 10;

  // ── HABITS SECTION ──
  checkPage(30);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Habits Tracked', margin, y);
  y += 8;

  habits.forEach((h, i) => {
    checkPage(8);
    // Count how many times habit was completed
    let completed = 0;
    dates.forEach(d => {
      const e = entries[d];
      if (e.habits && e.habits[i]) completed++;
    });
    const rate = dates.length > 0 ? ((completed / dates.length) * 100).toFixed(0) : 0;

    const bgColor = i % 2 === 0 ? [250, 250, 255] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(margin, y, pageW - margin * 2, 7, 'F');

    doc.setTextColor(60, 60, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(h, margin + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(`${completed}/${dates.length} days (${rate}%)`, pageW - margin - 4, y + 5, { align: 'right' });
    y += 7;
  });

  y += 12;

  // ── DAILY ENTRIES TABLE ──
  checkPage(30);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Entries', margin, y);
  y += 8;

  // Table header
  const entryCols = ['Date', 'Fitness', 'Study', 'Work', 'Sleep', 'Water', 'Mood'];
  const ecw = (pageW - margin * 2) / entryCols.length;

  doc.setFillColor(99, 102, 241);
  doc.rect(margin, y, pageW - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  entryCols.forEach((col, i) => {
    doc.text(col, margin + i * ecw + 3, y + 5.5);
  });
  y += 8;

  // Rows (show all entries, newest first)
  const sortedDates = [...dates].reverse();
  sortedDates.forEach((d, idx) => {
    checkPage(7);
    const e = entries[d];
    const moodText = ['', 'Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'][e.mood] || '—';
    const dateFormatted = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const bgColor = idx % 2 === 0 ? [250, 250, 255] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(margin, y, pageW - margin * 2, 6.5, 'F');

    doc.setTextColor(60, 60, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const rowData = [dateFormatted, `${e.fitness || 0}m`, `${e.study || 0}h`, `${e.work || 0}h`, `${e.sleep || 0}h`, `${e.water || 0}`, moodText];
    rowData.forEach((val, i) => {
      doc.text(val, margin + i * ecw + 3, y + 4.5);
    });
    y += 6.5;
  });

  // ── FOOTER on last page ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(160, 160, 170);
  doc.text('LifePulse — Daily Life Tracker | Progress Report', pageW / 2, pageH - 10, { align: 'center' });

  // Add page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 170);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' });
  }

  doc.save(`LifePulse-Progress-${getTodayStr()}.pdf`);
  showToast('📄 PDF report downloaded!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.entries) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
      if (data.goals) localStorage.setItem(GOALS_KEY, JSON.stringify(data.goals));
      if (data.habits) localStorage.setItem(HABITS_KEY, JSON.stringify(data.habits));
      showToast('📥 Data imported successfully!', 'success');
      initApp();
    } catch {
      showToast('❌ Invalid file format', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (confirm('⚠️ Are you sure? This will permanently delete ALL your tracking data.')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(HABITS_KEY);
    showToast('🗑️ All data cleared', 'success');
    initApp();
  }
}

// ── Toast Notifications ──
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Helper: Get entries for a range ──
function getEntriesInRange(days) {
  const entries = getAllEntries();
  const allDates = Object.keys(entries).sort();
  if (days === 'all') return { entries, dates: allDates };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = getDateStr(cutoff);
  const filteredDates = allDates.filter(d => d >= cutoffStr);
  const filtered = {};
  filteredDates.forEach(d => filtered[d] = entries[d]);
  return { entries: filtered, dates: filteredDates };
}

// ══════════════════════════════════
// FEATURE 1: Dark/Light Theme Toggle
// ══════════════════════════════════
const THEME_KEY = 'lifepulse_theme';

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon) icon.textContent = theme === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
  if (label) label.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
}

// ══════════════════════════════════
// FEATURE 2: PWA Service Worker
// ══════════════════════════════════
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// ══════════════════════════════════
// FEATURE 3: Calendar Heatmap
// ══════════════════════════════════
function renderHeatmap() {
  const container = document.getElementById('heatmap-container');
  const tooltip = document.getElementById('heatmap-tooltip-el');
  const summary = document.getElementById('heatmap-summary');
  if (!container) return;

  const entries = getAllEntries();
  const goals = getGoals();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate last 20 weeks (140 days)
  const totalWeeks = 20;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalWeeks * 7) + (7 - today.getDay()));
  startDate.setDate(startDate.getDate() - 7);

  // Calculate activity level for a date
  function getLevel(dateStr) {
    const e = entries[dateStr];
    if (!e) return 0;
    let score = 0;
    if (e.fitness >= goals.fitness * 0.5) score++;
    if (e.sleep >= goals.sleep * 0.7) score++;
    if (e.water >= goals.water * 0.5) score++;
    if (e.study > 0 || e.work > 0) score++;
    if (e.mood >= 3) score++;
    if (score <= 1) return 1;
    if (score <= 2) return 2;
    if (score <= 3) return 3;
    return 4;
  }

  let html = '<div class="heatmap-grid">';
  html += '<div class="heatmap-day-labels">';
  ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(d => {
    html += `<span>${d}</span>`;
  });
  html += '</div>';

  let loggedDays = 0;
  const weekStart = new Date(startDate);
  // Align to Sunday
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  for (let w = 0; w < totalWeeks; w++) {
    html += '<div class="heatmap-week">';
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(weekStart);
      cellDate.setDate(cellDate.getDate() + w * 7 + d);
      const ds = getDateStr(cellDate);
      const isFuture = cellDate > today;
      const level = isFuture ? 0 : getLevel(ds);
      if (level > 0) loggedDays++;
      const futureClass = isFuture ? ' future' : '';
      const dateLabel = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      html += `<div class="heatmap-cell level-${level}${futureClass}" data-date="${ds}" data-label="${dateLabel}" data-level="${level}"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';

  // Legend
  html += '<div class="heatmap-legend">Less ';
  for (let i = 0; i <= 4; i++) html += `<div class="heatmap-cell level-${i}"></div>`;
  html += ' More</div>';

  container.innerHTML = html;
  if (summary) summary.textContent = `${loggedDays} days logged`;

  // Tooltip
  container.addEventListener('mouseover', (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (!cell || !cell.dataset.date) return;
    const lvl = cell.dataset.level;
    const labels = ['No data', 'Low activity', 'Moderate', 'Good', 'Excellent'];
    tooltip.textContent = `${cell.dataset.label} — ${labels[lvl]}`;
    tooltip.style.display = 'block';
    const rect = cell.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 36) + 'px';
  });

  container.addEventListener('mouseout', () => {
    tooltip.style.display = 'none';
  });

  // Click to navigate to that date's log
  container.addEventListener('click', (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (!cell || cell.classList.contains('future') || !cell.dataset.date) return;
    document.getElementById('log-date').value = cell.dataset.date;
    navigateTo('log');
  });
}

// ══════════════════════════════════
// FEATURE 4: Daily Reminder
// ══════════════════════════════════
const REMINDER_KEY = 'lifepulse_reminder';
let reminderInterval = null;

function loadReminderUI() {
  const saved = JSON.parse(localStorage.getItem(REMINDER_KEY) || 'null');
  if (saved && saved.enabled) {
    document.getElementById('reminder-time').value = saved.time || '21:00';
    updateReminderStatus(true, saved.time);
    startReminderCheck(saved.time);
  }
}

function enableReminder() {
  if (!('Notification' in window)) {
    showToast('\u274C Notifications not supported in this browser', 'error');
    return;
  }

  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      const time = document.getElementById('reminder-time').value || '21:00';
      localStorage.setItem(REMINDER_KEY, JSON.stringify({ enabled: true, time }));
      updateReminderStatus(true, time);
      startReminderCheck(time);
      showToast(`\u{1F514} Reminder set for ${time}!`, 'success');
    } else {
      showToast('\u26A0\uFE0F Please allow notifications in your browser', 'error');
    }
  });
}

function disableReminder() {
  localStorage.removeItem(REMINDER_KEY);
  if (reminderInterval) clearInterval(reminderInterval);
  updateReminderStatus(false);
  showToast('Reminder disabled', 'success');
}

function updateReminderStatus(enabled, time) {
  const el = document.getElementById('reminder-status');
  if (enabled) {
    el.innerHTML = `<span class="dot on"></span> Reminder active at <strong>${time}</strong>`;
  } else {
    el.innerHTML = '<span class="dot off"></span> Reminder not set';
  }
}

function startReminderCheck(targetTime) {
  if (reminderInterval) clearInterval(reminderInterval);
  reminderInterval = setInterval(() => {
    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    if (hhmm === targetTime) {
      const todayEntry = getEntry(getTodayStr());
      if (!todayEntry) {
        new Notification('\u{1F4CA} LifePulse Reminder', {
          body: "You haven't logged today yet! Take a moment to track your day.",
          icon: '\u{1F4CA}'
        });
      }
    }
  }, 60000); // check every minute
}
