// Extend report structure with status: 'solved', 'processing', 'not_solved'
// Default new reports to 'processing'

function loadReports() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}

function saveReports(reports) {
  localStorage.setItem(LS_KEY, JSON.stringify(reports));
}

function renderReports() {
  const reports = loadReports();
  const reportList = document.getElementById('reportList');
  reportList.innerHTML = '';

  reports.slice().reverse().forEach((r, index) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    // Status icon and color
    let statusIcon = '';
    let statusColor = '';
    switch (r.status) {
      case 'solved':
        statusIcon = '✔️';
        statusColor = 'green';
        break;
      case 'processing':
        statusIcon = '⏳';
        statusColor = 'orange';
        break;
      case 'not_solved':
      default:
        statusIcon = '❌';
        statusColor = 'red';
    }
    div.innerHTML = `
      <strong>${r.village}</strong> (${r.symptom}) - ${r.count} people
      <span style="color:${statusColor}; font-weight:bold; margin-left:10px;">${statusIcon}</span>
      <br><small>${new Date(r.time).toLocaleString()}</small>
      <br>
      <button data-index="${index}" class="btn-status" style="margin-top:5px; font-size:0.9rem; cursor:pointer;">
        Change Status
      </button>
    `;
    reportList.appendChild(div);
  });

  // Add event listeners for status change buttons
  document.querySelectorAll('.btn-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-index');
      openStatusMenu(idx);
    });
  });
}

// Open a simple prompt to change status (for demo)
function openStatusMenu(index) {
  const reports = loadReports();
  const currentStatus = reports[index].status || 'processing';
  const newStatus = prompt(
    `Change status for report at ${reports[index].village} (current: ${currentStatus})\nEnter one of: solved, processing, not_solved`,
    currentStatus
  );
  if (newStatus && ['solved', 'processing', 'not_solved'].includes(newStatus)) {
    reports[index].status = newStatus;
    saveReports(reports);
    renderReports();
    updateDashboardKPIs();
    showNotification(`Status updated to "${newStatus}"`);
  } else if (newStatus !== null) {
    alert('Invalid status entered.');
  }
}

// Update dashboard KPIs with status awareness
function updateDashboardKPIs() {
  const reports = loadReports();
  const totalReports = reports.length;
  const activeCases = reports.filter(r => r.status !== 'solved').reduce((sum, r) => sum + Number(r.count || 1), 0);
  const waterIssues = reports.filter(r => r.waterQuality && r.waterQuality !== 'none').length;
  // For demo, response rate = % of solved reports
  const solvedCount = reports.filter(r => r.status === 'solved').length;
  const responseRate = totalReports ? Math.round((solvedCount / totalReports) * 100) : 0;

  kTotalReports.textContent = totalReports;
  kActiveCases.textContent = activeCases;
  kWaterIssues.textContent = waterIssues;
  kResponseRate.textContent = responseRate + '%';

  renderAlertsAndHotspots(reports);
}

// Render alerts and hotspots (simplified)
function renderAlertsAndHotspots(reports) {
  alertList.innerHTML = '';
  hotspotList.innerHTML = '';

  // Alerts: reports with symptom diarrhea or fever and not solved
  const alerts = reports.filter(r => ['diarrhea', 'fever'].includes(r.symptom) && r.status !== 'solved');
  if (alerts.length === 0) {
    alertList.innerHTML = '<li>No current alerts</li>';
  } else {
    alerts.forEach(r => {
      const li = document.createElement('li');
      li.className = 'critical';
      li.textContent = `High ${r.symptom} cases reported in ${r.village} - Status: ${r.status}`;
      alertList.appendChild(li);
    });
  }

  // Hotspots: villages with >5 active cases (not solved)
  const hotspotMap = {};
  reports.forEach(r => {
    if (r.status !== 'solved') {
      hotspotMap[r.village] = (hotspotMap[r.village] || 0) + Number(r.count || 1);
    }
  });
  const hotspots = Object.entries(hotspotMap).filter(([village, count]) => count > 5);
  if (hotspots.length === 0) {
    hotspotList.innerHTML = '<li>No hotspots detected</li>';
  } else {
    hotspots.forEach(([village, count]) => {
      const li = document.createElement('li');
      li.textContent = `${village} - ${count} active cases (Priority: High)`;
      hotspotList.appendChild(li);
    });
  }
}

// On form submit, add status field defaulting to 'processing'
form.addEventListener('submit', e => {
  e.preventDefault();

  const newReport = {
    name: form.name.value.trim(),
    village: form.location.value.trim(),
    symptom: Array.from(form.symptoms.selectedOptions).map(o => o.value),
    waterQuality: form.waterQuality.value,
    comments: form.comments.value.trim(),
    count: 1, // default 1 person affected, or you can add input for count
    time: Date.now(),
    status: 'processing',
  };

  if (!newReport.village || newReport.symptom.length === 0 || !newReport.waterQuality) {
    alert('Please fill all required fields.');
    return;
  }

  const reports = loadReports();
  reports.push(newReport);
  saveReports(reports);

  form.reset();
  showNotification('Report submitted successfully!');
  renderReports();
  updateDashboardKPIs();
  showSection('dashboard');
});

// Initial render calls
renderReports();
updateDashboardKPIs();
showSection('problem'); // or default section

// Language toggle and theme toggle code remain unchanged from previous snippet
