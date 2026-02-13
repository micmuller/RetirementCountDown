const countdownDiv = document.getElementById('countdown');
const dateInput = document.getElementById('targetDate');
const bgColorPicker = document.getElementById('bgColorPicker');
const chartColorPicker = document.getElementById('chartColorPicker');
const titleInput = document.getElementById('customTitle');
const titleElem = document.getElementById('title');
const pageTitle = document.getElementById('pageTitle');
const languagePicker = document.getElementById('languagePicker');
const hourglass = document.getElementById('hourglass');
const chartCanvas = document.getElementById('progressChart');
const chartLabel = document.getElementById('chartLabel');

const APP_CONFIG = {
  defaultDate: '2027-09-02',
  maxDays: 730
};

const translations = {
  de: {
    title: 'Countdown bis zur Pensionierung',
    subtitle: 'Visualisiere deine verbleibende Zeit bis zur Pensionierung.',
    labels: ['Jahre', 'Monate', 'Tage', 'Stunden', 'Minuten', 'Sekunden'],
    done: '🎉 Es ist soweit! Glückliche Pensionierung! 🎉',
    placeholder: 'Titel eingeben',
    centerLabel: (days) => `Noch ${days} Tage`,
    ui: {
      targetDate: 'Zieldatum',
      customTitle: 'Eigener Titel',
      language: 'Sprache',
      colors: 'Farben',
      reset: 'Reset'
    },
    chartLegend: ['Verstrichen', 'Übrig']
  },
  en: {
    title: 'Countdown to Retirement',
    subtitle: 'Visualize your remaining time until retirement.',
    labels: ['Years', 'Months', 'Days', 'Hours', 'Minutes', 'Seconds'],
    done: "🎉 It's time! Happy Retirement! 🎉",
    placeholder: 'Enter title',
    centerLabel: (days) => `${days} days left`,
    ui: {
      targetDate: 'Target date',
      customTitle: 'Custom title',
      language: 'Language',
      colors: 'Colors',
      reset: 'Reset'
    },
    chartLegend: ['Elapsed', 'Remaining']
  }
};

let currentLang = localStorage.getItem('language') || 'de';
languagePicker.value = currentLang;

let chart = null;

function setText(id, text) {
  const elem = document.getElementById(id);
  if (elem) elem.textContent = text;
}

function translateUI() {
  const t = translations[currentLang];
  const customTitle = localStorage.getItem('customTitle') || t.title;

  titleElem.textContent = customTitle;
  pageTitle.textContent = customTitle;
  titleInput.placeholder = t.placeholder;

  setText('subtitle', t.subtitle);
  setText('targetDateLabel', t.ui.targetDate);
  setText('customTitleLabel', t.ui.customTitle);
  setText('languageLabel', t.ui.language);
  setText('colorLabel', t.ui.colors);
  setText('resetSettings', t.ui.reset);

  if (chart) {
    chart.data.labels = t.chartLegend;
    chart.update();
  }
}

function getRemainingParts(target, now) {
  const deltaMs = target - now;
  const seconds = Math.floor(deltaMs / 1000) % 60;
  const minutes = Math.floor(deltaMs / (1000 * 60)) % 60;
  const hours = Math.floor(deltaMs / (1000 * 60 * 60)) % 24;

  let years = target.getFullYear() - now.getFullYear();
  let months = target.getMonth() - now.getMonth();
  let days = target.getDate() - now.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days, hours, minutes, seconds, deltaMs };
}

function renderDoneState() {
  const t = translations[currentLang];
  countdownDiv.innerHTML = `<p class="done">${t.done}</p>`;
  chartLabel.textContent = '';

  if (chart) {
    chart.data.datasets[0].data = [APP_CONFIG.maxDays, 0];
    chart.update();
  }
}

function updateCountdown() {
  const t = translations[currentLang];
  const target = new Date(dateInput.value);
  const now = new Date();

  if (Number.isNaN(target.getTime()) || target <= now) {
    renderDoneState();
    return;
  }

  const { years, months, days, hours, minutes, seconds, deltaMs } = getRemainingParts(target, now);

  countdownDiv.innerHTML = `
    <div class="unit"><span>${years}</span>${t.labels[0]}</div>
    <div class="unit"><span>${months}</span>${t.labels[1]}</div>
    <div class="unit"><span>${days}</span>${t.labels[2]}</div>
    <div class="unit"><span>${hours}</span>${t.labels[3]}</div>
    <div class="unit"><span>${minutes}</span>${t.labels[4]}</div>
    <div class="unit"><span>${seconds}</span>${t.labels[5]}</div>
  `;

  if (seconds === 0) {
    hourglass.classList.add('flip');
    setTimeout(() => hourglass.classList.remove('flip'), 700);
  }

  const remainingDays = Math.floor(deltaMs / (1000 * 60 * 60 * 24));
  const usedDays = Math.min(APP_CONFIG.maxDays, Math.max(0, APP_CONFIG.maxDays - remainingDays));

  if (chart) {
    chart.data.datasets[0].data = [usedDays, APP_CONFIG.maxDays - usedDays];
    chart.update();
  }

  chartLabel.textContent = t.centerLabel(remainingDays);
}

function createChart() {
  const t = translations[currentLang];
  chart = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: t.chartLegend,
      datasets: [{
        data: [0, APP_CONFIG.maxDays],
        backgroundColor: [chartColorPicker.value || '#ff9800', '#eeeeee'],
        borderWidth: 1
      }]
    },
    options: {
      cutout: '62%',
      plugins: { legend: { display: false } }
    }
  });
}

function bindEvents() {
  document.getElementById('bgColorIcon').addEventListener('click', () => bgColorPicker.click());
  document.getElementById('chartColorIcon').addEventListener('click', () => chartColorPicker.click());

  chartColorPicker.addEventListener('input', () => {
    if (!chart) return;
    chart.data.datasets[0].backgroundColor[0] = chartColorPicker.value;
    chart.update();
  });

  bgColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    document.body.style.background = color;
    localStorage.setItem('bgColor', color);
  });

  titleInput.addEventListener('input', (e) => {
    const title = e.target.value || translations[currentLang].title;
    titleElem.textContent = title;
    pageTitle.textContent = title;
    localStorage.setItem('customTitle', title);
  });

  dateInput.addEventListener('change', (e) => {
    localStorage.setItem('targetDate', e.target.value);
    updateCountdown();
  });

  languagePicker.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('language', currentLang);
    translateUI();
    updateCountdown();
  });

  document.getElementById('resetSettings').addEventListener('click', () => {
    localStorage.removeItem('targetDate');
    localStorage.removeItem('bgColor');
    localStorage.removeItem('customTitle');
    localStorage.removeItem('language');
    location.reload();
  });
}

function restoreState() {
  dateInput.value = localStorage.getItem('targetDate') || APP_CONFIG.defaultDate;

  const bgColor = localStorage.getItem('bgColor');
  if (bgColor) {
    document.body.style.background = bgColor;
    bgColorPicker.value = bgColor;
  }

  const customTitle = localStorage.getItem('customTitle');
  if (customTitle) {
    titleInput.value = customTitle;
  }
}

window.addEventListener('load', () => {
  restoreState();
  bindEvents();
  createChart();
  translateUI();
  updateCountdown();
  setInterval(updateCountdown, 1000);
});
