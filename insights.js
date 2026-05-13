/* ═══════════════════════════════════════════
   LifePulse — Insights & Analysis Engine
   ═══════════════════════════════════════════ */

const ACHIEVEMENTS = [
  { id: 'first_log', name: 'First Step', desc: 'Log your first day', icon: '🌱', check: (dates) => dates.length >= 1 },
  { id: 'streak_3', name: 'Hat Trick', desc: '3-day streak', icon: '🎩', check: (_, s) => s.best >= 3 },
  { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', icon: '⚔️', check: (_, s) => s.best >= 7 },
  { id: 'streak_14', name: 'Fortnight Force', desc: '14-day streak', icon: '💪', check: (_, s) => s.best >= 14 },
  { id: 'streak_30', name: 'Monthly Master', desc: '30-day streak', icon: '👑', check: (_, s) => s.best >= 30 },
  { id: 'days_10', name: 'Getting Started', desc: 'Track 10 days', icon: '📊', check: (dates) => dates.length >= 10 },
  { id: 'days_30', name: 'Committed', desc: 'Track 30 days', icon: '🏅', check: (dates) => dates.length >= 30 },
  { id: 'days_100', name: 'Centurion', desc: 'Track 100 days', icon: '💯', check: (dates) => dates.length >= 100 },
  { id: 'happy_week', name: 'Happy Week', desc: '7 days with mood 4+', icon: '😄', check: (dates, _, entries) => { let count = 0; for (const d of dates) { if (entries[d]?.mood >= 4) count++; } return count >= 7; } },
  { id: 'hydrated', name: 'Hydration Hero', desc: '8+ glasses for 7 days', icon: '💧', check: (dates, _, entries) => { let count = 0; for (const d of dates) { if (entries[d]?.water >= 8) count++; } return count >= 7; } },
  { id: 'early_bird', name: 'Well Rested', desc: '7+ hrs sleep for 7 days', icon: '😴', check: (dates, _, entries) => { let count = 0; for (const d of dates) { if (entries[d]?.sleep >= 7) count++; } return count >= 7; } },
  { id: 'fit_week', name: 'Fitness Freak', desc: '30+ min exercise for 7 days', icon: '🏋️', check: (dates, _, entries) => { let count = 0; for (const d of dates) { if (entries[d]?.fitness >= 30) count++; } return count >= 7; } }
];

function generateInsights() {
  const entries = getAllEntries();
  const dates = Object.keys(entries).sort();
  if (dates.length < 3) return;

  const goals = getGoals();
  const insightsList = document.getElementById('insights-list');
  const suggestionsList = document.getElementById('suggestions-list');
  const insights = [];
  const suggestions = [];

  // Averages
  const avg = { fitness: 0, study: 0, work: 0, sleep: 0, water: 0, mood: 0 };
  let moodCount = 0;
  dates.forEach(d => {
    const e = entries[d];
    avg.fitness += e.fitness || 0;
    avg.study += e.study || 0;
    avg.work += e.work || 0;
    avg.sleep += e.sleep || 0;
    avg.water += e.water || 0;
    if (e.mood > 0) { avg.mood += e.mood; moodCount++; }
  });
  const n = dates.length;
  Object.keys(avg).forEach(k => { avg[k] = k === 'mood' ? (moodCount ? avg[k] / moodCount : 0) : avg[k] / n; });

  // Recent 7 vs previous 7 comparison
  if (dates.length >= 7) {
    const recent = dates.slice(-7);
    const prev = dates.length >= 14 ? dates.slice(-14, -7) : null;

    if (prev) {
      const recentAvg = calcAvg(recent, entries);
      const prevAvg = calcAvg(prev, entries);

      ['fitness', 'study', 'sleep', 'water'].forEach(key => {
        const change = recentAvg[key] - prevAvg[key];
        const pct = prevAvg[key] ? Math.round((change / prevAvg[key]) * 100) : 0;
        const labels = { fitness: 'Fitness', study: 'Study time', sleep: 'Sleep', water: 'Water intake' };

        if (Math.abs(pct) >= 10) {
          insights.push({
            type: change > 0 ? 'positive' : 'negative',
            icon: change > 0 ? '📈' : '📉',
            title: `${labels[key]} ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(pct)}%`,
            text: `Your ${labels[key].toLowerCase()} went from ${prevAvg[key].toFixed(1)} to ${recentAvg[key].toFixed(1)} compared to the previous week.`
          });
        }
      });
    }
  }

  // Goal-based insights
  if (avg.sleep < goals.sleep) {
    insights.push({ type: 'warning', icon: '⚠️', title: 'Sleep below target', text: `You average ${avg.sleep.toFixed(1)} hrs/night but your goal is ${goals.sleep} hrs. Try establishing a consistent bedtime routine.` });
  }
  if (avg.water < goals.water) {
    insights.push({ type: 'warning', icon: '⚠️', title: 'Hydration needs improvement', text: `You average ${avg.water.toFixed(1)} glasses/day but your goal is ${goals.water}. Keep a water bottle nearby as a reminder.` });
  }
  if (avg.fitness >= goals.fitness) {
    insights.push({ type: 'positive', icon: '🎉', title: 'Fitness goal crushed!', text: `You average ${avg.fitness.toFixed(0)} min/day, exceeding your ${goals.fitness} min goal. Excellent consistency!` });
  }

  // Mood correlations
  if (moodCount >= 5) {
    const highMoodDays = dates.filter(d => entries[d].mood >= 4);
    const lowMoodDays = dates.filter(d => entries[d].mood > 0 && entries[d].mood <= 2);

    if (highMoodDays.length >= 3 && lowMoodDays.length >= 2) {
      const highSleep = highMoodDays.reduce((s, d) => s + (entries[d].sleep || 0), 0) / highMoodDays.length;
      const lowSleep = lowMoodDays.reduce((s, d) => s + (entries[d].sleep || 0), 0) / lowMoodDays.length;

      if (highSleep - lowSleep > 0.5) {
        suggestions.push({ type: 'info', icon: '💡', title: 'Sleep ↔ Mood correlation detected', text: `On happy days you sleep ${highSleep.toFixed(1)} hrs vs ${lowSleep.toFixed(1)} hrs on low days. Better sleep = better mood!` });
      }

      const highFit = highMoodDays.reduce((s, d) => s + (entries[d].fitness || 0), 0) / highMoodDays.length;
      const lowFit = lowMoodDays.reduce((s, d) => s + (entries[d].fitness || 0), 0) / lowMoodDays.length;

      if (highFit - lowFit > 5) {
        suggestions.push({ type: 'info', icon: '💡', title: 'Exercise boosts your mood', text: `You exercise ${highFit.toFixed(0)} min on happy days vs ${lowFit.toFixed(0)} min on low days. Even a short walk can help!` });
      }
    }
  }

  // General suggestions
  if (avg.fitness < 15) suggestions.push({ type: 'warning', icon: '🏃', title: 'Move more!', text: 'You average under 15 min of exercise. Try a 10-minute walk after meals to start building the habit.' });
  if (avg.study > 0 && avg.study < 2) suggestions.push({ type: 'info', icon: '📚', title: 'Study in focused blocks', text: 'Try the Pomodoro technique: 25 min focused study + 5 min break. Small improvements compound!' });
  if (avg.sleep > 9) suggestions.push({ type: 'info', icon: '⏰', title: 'Oversleeping detected', text: 'Sleeping over 9 hrs may cause grogginess. Aim for 7-8 hrs for optimal energy.' });

  if (!insights.length) {
    insights.push({ type: 'info', icon: '📊', title: 'Keep tracking!', text: 'More data means better insights. Keep logging daily for personalized analysis.' });
  }
  if (!suggestions.length) {
    suggestions.push({ type: 'info', icon: '✨', title: 'Looking good!', text: 'Your habits seem balanced. Keep up the great work and stay consistent!' });
  }

  // Render
  insightsList.innerHTML = insights.map(i => renderInsightCard(i)).join('');
  suggestionsList.innerHTML = suggestions.map(s => renderInsightCard(s)).join('');

  // Weekly report
  renderWeeklyReport(entries, dates);
}

function calcAvg(dates, entries) {
  const a = { fitness: 0, study: 0, work: 0, sleep: 0, water: 0 };
  dates.forEach(d => {
    a.fitness += entries[d]?.fitness || 0;
    a.study += entries[d]?.study || 0;
    a.work += entries[d]?.work || 0;
    a.sleep += entries[d]?.sleep || 0;
    a.water += entries[d]?.water || 0;
  });
  const n = dates.length || 1;
  Object.keys(a).forEach(k => a[k] /= n);
  return a;
}

function renderInsightCard(i) {
  return `<div class="insight-card">
    <div class="insight-icon ${i.type}">${i.icon}</div>
    <div><div class="insight-title">${i.title}</div><div class="insight-text">${i.text}</div></div>
  </div>`;
}

function renderWeeklyReport(entries, dates) {
  if (dates.length < 7) return;
  const last7 = dates.slice(-7);
  const goals = getGoals();
  let score = 0, maxScore = 0;

  last7.forEach(d => {
    const e = entries[d];
    if (e.fitness >= goals.fitness) score++;
    if (e.sleep >= goals.sleep) score++;
    if (e.water >= goals.water) score++;
    if (e.study >= goals.study) score++;
    if (e.mood >= 3) score++;
    maxScore += 5;
  });

  const pct = maxScore ? (score / maxScore) * 100 : 0;
  let grade = 'D', gradeClass = 'grade-D';
  if (pct >= 85) { grade = 'A'; gradeClass = 'grade-A'; }
  else if (pct >= 70) { grade = 'B'; gradeClass = 'grade-B'; }
  else if (pct >= 50) { grade = 'C'; gradeClass = 'grade-C'; }

  const reportEl = document.getElementById('weekly-report');
  reportEl.innerHTML = `
    <div class="report-grade">
      <div class="grade-circle ${gradeClass}">${grade}</div>
      <p style="margin-top:8px;font-weight:600;">Weekly Score: ${Math.round(pct)}%</p>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${score}/${maxScore} goals met this week</p>
    </div>`;

  const gradeEl = document.getElementById('report-grade');
  if (gradeEl) { gradeEl.textContent = grade; gradeEl.className = `grade-circle ${gradeClass}`; }
}

function renderAchievements() {
  const entries = getAllEntries();
  const dates = Object.keys(entries).sort();
  const streak = typeof calculateStreak === 'function' ? calculateStreak(entries) : { current: 0, best: 0 };
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;

  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = a.check(dates, streak, entries);
    return `<div class="achievement ${unlocked ? 'unlocked' : 'locked'}">
      <div class="badge">${a.icon}</div>
      <div class="badge-name">${a.name}</div>
      <div class="badge-desc">${a.desc}</div>
    </div>`;
  }).join('');
}
