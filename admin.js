// Admin Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated as admin
  checkAdminAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial data
  loadStatistics();
  loadAnnouncements();
  loadDashboardLeaderboard();
});

function checkAdminAuth() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (!token) {
    // Not logged in, redirect to login
    window.location.href = 'Login.html';
    return;
  }
  
  // Check if user is admin from stored data
  if (userData) {
    const parsed = JSON.parse(userData);
    // For admin, we need to check token validity via API
    verifyAdminToken(token);
  }
}

async function verifyAdminToken(token) {
  try {
    const response = await fetch('/api/admin/statistics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Token is invalid or not admin
      logout();
    }
  } catch (error) {
    console.error('Token verification error:', error);
    // If server is not running, still allow access if token exists
  }
}

function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}
  // Submit announcement button
  const submitBtn = document.getElementById('submitAnnouncement');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitAnnouncement);
  }
  
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Search Students modal
  const searchStudentsLink = document.getElementById('searchLink');
  const searchModal = document.getElementById('searchStudentModal');
  const closeSearchModal = document.getElementById('closeSearchModal');
  const searchStudentBtn = document.getElementById('searchStudentBtn');
  
  if (searchStudentsLink && searchModal) {
    searchStudentsLink.addEventListener('click', function(e) {
      e.preventDefault();
      searchModal.classList.add('show');
    });
  }
  
  if (closeSearchModal && searchModal) {
    closeSearchModal.addEventListener('click', function() {
      searchModal.classList.remove('show');
    });
  }
  
  if (searchModal) {
    searchModal.addEventListener('click', function(e) {
      if (e.target === searchModal) {
        searchModal.classList.remove('show');
      }
    });
  }
  
  if (searchStudentBtn) {
    searchStudentBtn.addEventListener('click', searchStudentById);
  }
  
  // Search on Enter key
  const searchInput = document.getElementById('searchStudentId');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchStudentById();
      }
    });
  }
  
  // Home link - show main content (Statistics and Announcement)
  const homeLink = document.getElementById('homeLink');
  const mainContent = document.querySelector('.admin-main');
  const studentInfoSection = document.getElementById('studentInfoSection');
  const viewSitInRecordsSection = document.getElementById('viewSitInRecordsSection');
  const currentSitInSection = document.getElementById('currentSitInSection');
  const sitinReportsSection = document.getElementById('sitinReportsSection');
  const feedbackReportsSection = document.getElementById('feedbackReportsSection');
  const reservationSection = document.getElementById('reservationSection');
  
  if (homeLink) {
    homeLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Show main content (Statistics and Announcement)
      if (mainContent) mainContent.style.display = 'block';
      if (studentInfoSection) studentInfoSection.style.display = 'none';
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
      if (currentSitInSection) currentSitInSection.style.display = 'none';
      if (sitinReportsSection) sitinReportsSection.style.display = 'none';
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
      if (reservationSection) reservationSection.style.display = 'none';
      
      const leaderboardSection = document.getElementById('leaderboardSection');
      if (leaderboardSection) leaderboardSection.style.display = 'none';
      
      loadDashboardLeaderboard();
    });
  }
  
  // Students link
  const studentsLink = document.getElementById('studentsLink');
  
  if (studentsLink) {
    studentsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content, show student info section
      if (mainContent) mainContent.style.display = 'none';
      if (studentInfoSection) studentInfoSection.style.display = 'block';
      // Hide other sections to prevent overlap
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
      if (currentSitInSection) currentSitInSection.style.display = 'none';
      if (sitinReportsSection) sitinReportsSection.style.display = 'none';
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
      if (reservationSection) reservationSection.style.display = 'none';
      // Load students
      loadStudents();
    });
  }
  
  // Add Student button
  const addStudentBtn = document.getElementById('addStudentBtn');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', function() {
      alert('Add Student functionality coming soon');
    });
  }
  
  // Reset All Sessions button
  const resetSessionsBtn = document.getElementById('resetSessionsBtn');
  if (resetSessionsBtn) {
    resetSessionsBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset all student sessions?')) {
        resetAllSessions();
      }
    });
  }
  
  // Student table search
  const studentTableSearch = document.getElementById('studentTableSearch');
  if (studentTableSearch) {
    studentTableSearch.addEventListener('input', function() {
      filterStudents(this.value);
    });
  }
  
  // Entries per page
  const entriesSelect = document.getElementById('entriesSelect');
  if (entriesSelect) {
    entriesSelect.addEventListener('change', function() {
      loadStudents();
    });
  }
  
  // Sit-In modal - removed direct link, only opens after student search
  const sitinModal = document.getElementById('sitinModal');
  const closeSitInModal = document.getElementById('closeSitInModal');
  const closeSitInBtn = document.getElementById('closeSitInBtn');
  const sitinSubmitBtn = document.getElementById('sitinSubmitBtn');
  const sitinIdNumber = document.getElementById('sitinIdNumber');
  
  // Sit-In link now shows current sit-in students page
  const sitinLink = document.getElementById('sitinLink');
  
  if (sitinLink) {
    sitinLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content and other sections, show current sit-in section
      if (mainContent) mainContent.style.display = 'none';
      if (studentInfoSection) studentInfoSection.style.display = 'none';
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
      if (currentSitInSection) currentSitInSection.style.display = 'block';
      if (sitinReportsSection) sitinReportsSection.style.display = 'none';
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
      if (reservationSection) reservationSection.style.display = 'none';
      // Load current sit-in students
      loadCurrentSitInStudents();
    });
  }
  
  // Current sit-in table search
  const currentSitinTableSearch = document.getElementById('currentSitinTableSearch');
  if (currentSitinTableSearch) {
    currentSitinTableSearch.addEventListener('input', function() {
      filterCurrentSitInStudents(this.value);
    });
  }
  
  // Current sit-in entries per page
  const currentSitinEntriesSelect = document.getElementById('currentSitinEntriesSelect');
  if (currentSitinEntriesSelect) {
    currentSitinEntriesSelect.addEventListener('change', function() {
      loadCurrentSitInStudents();
    });
  }
  
  if (closeSitInModal && sitinModal) {
    closeSitInModal.addEventListener('click', function() {
      sitinModal.classList.remove('show');
      clearSitInForm();
    });
  }
  
  if (closeSitInBtn && sitinModal) {
    closeSitInBtn.addEventListener('click', function() {
      sitinModal.classList.remove('show');
      clearSitInForm();
    });
  }
  
  if (sitinModal) {
    sitinModal.addEventListener('click', function(e) {
      if (e.target === sitinModal) {
        sitinModal.classList.remove('show');
        clearSitInForm();
      }
    });
  }
  
  // When ID Number is entered in Sit-In, fetch student info
  if (sitinIdNumber) {
    sitinIdNumber.addEventListener('change', async function() {
      const idNumber = this.value.trim();
      if (idNumber) {
        await fetchStudentForSitIn(idNumber);
      }
    });
  }
  
  // Submit Sit-In
  if (sitinSubmitBtn) {
    sitinSubmitBtn.addEventListener('click', submitSitIn);
  }
  
  // View Sit-in Records link
  const viewSitInRecordsLink = document.getElementById('viewSitInRecordsLink');
  // viewSitInRecordsSection already declared above
  
  if (viewSitInRecordsLink && viewSitInRecordsSection) {
    viewSitInRecordsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content and student section, show sit-in records
      if (mainContent) mainContent.style.display = 'none';
      if (studentInfoSection) studentInfoSection.style.display = 'none';
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'block';
      if (currentSitInSection) currentSitInSection.style.display = 'none';
      if (sitinReportsSection) sitinReportsSection.style.display = 'none';
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
      if (reservationSection) reservationSection.style.display = 'none';
      // Load sit-in records
      loadSitInRecords();
    });
  }
  
  // Sit-In Reports link
  const sitinReportsLink = document.getElementById('sitinReportsLink');
  
  if (sitinReportsLink && sitinReportsSection) {
    sitinReportsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide all other sections, show reports
      if (mainContent) mainContent.style.display = 'none';
      if (studentInfoSection) studentInfoSection.style.display = 'none';
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
      if (currentSitInSection) currentSitInSection.style.display = 'none';
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
      if (reservationSection) reservationSection.style.display = 'none';
      sitinReportsSection.style.display = 'block';
      // Load sit-in reports
      loadSitInReports();
    });
  }
  
  // Feedback Reports link
  const feedbackReportsLink = document.getElementById('feedbackReportsLink');
  
  if (feedbackReportsLink && feedbackReportsSection) {
    feedbackReportsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide all other sections, show feedback reports
      if (mainContent) mainContent.style.display = 'none';
      if (studentInfoSection) studentInfoSection.style.display = 'none';
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
      if (currentSitInSection) currentSitInSection.style.display = 'none';
      if (sitinReportsSection) sitinReportsSection.style.display = 'none';
      if (reservationSection) reservationSection.style.display = 'none';
      feedbackReportsSection.style.display = 'block';
      // Load feedback reports
      loadFeedbackReports();
    });
  }
  
  // Apply Feedback Filter button
  const applyFeedbackFilterBtn = document.getElementById('applyFeedbackFilterBtn');
  if (applyFeedbackFilterBtn) {
    applyFeedbackFilterBtn.addEventListener('click', function() {
      loadFeedbackReports();
    });
  }
  
  // Reset Feedback Filter button
  const resetFeedbackFilterBtn = document.getElementById('resetFeedbackFilterBtn');
  if (resetFeedbackFilterBtn) {
    resetFeedbackFilterBtn.addEventListener('click', function() {
      document.getElementById('feedbackStudentSearch').value = '';
      document.getElementById('feedbackDateFrom').value = '';
      document.getElementById('feedbackDateTo').value = '';
      loadFeedbackReports();
    });
  }
  
  // Feedback Export buttons
  const exportFeedbackCSVBtn = document.getElementById('exportFeedbackCSVBtn');
  const exportFeedbackPDFBtn = document.getElementById('exportFeedbackPDFBtn');
  const exportFeedbackExcelBtn = document.getElementById('exportFeedbackExcelBtn');
  const printFeedbackReportBtn = document.getElementById('printFeedbackReportBtn');
  
  if (exportFeedbackCSVBtn) {
    exportFeedbackCSVBtn.addEventListener('click', function() {
      exportFeedbackToCSV();
    });
  }
  
  if (exportFeedbackPDFBtn) {
    exportFeedbackPDFBtn.addEventListener('click', function() {
      exportFeedbackToPDF();
    });
  }
  
  if (exportFeedbackExcelBtn) {
    exportFeedbackExcelBtn.addEventListener('click', function() {
      exportFeedbackToExcel();
    });
  }
  
  if (printFeedbackReportBtn) {
    printFeedbackReportBtn.addEventListener('click', function() {
      printFeedbackReport();
    });
  }
  
  // Feedback entries per page
  const feedbackEntriesSelect = document.getElementById('feedbackEntriesSelect');
  if (feedbackEntriesSelect) {
    feedbackEntriesSelect.addEventListener('change', function() {
      loadFeedbackReports();
    });
  }
  
  // Reservation link
  const reservationLink = document.getElementById('reservationLink');
  
  if (reservationLink && reservationSection) {
    reservationLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide all other sections, show reservations
      if (mainContent) mainContent.style.display = 'none';
      if (studentInfoSection) studentInfoSection.style.display = 'none';
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
      if (currentSitInSection) currentSitInSection.style.display = 'none';
      if (sitinReportsSection) sitinReportsSection.style.display = 'none';
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
      reservationSection.style.display = 'block';
      // Load reservations
      loadAdminReservations();
    });
  }
  
  // Apply Reservation Filter button
  const applyReservationFilterBtn = document.getElementById('applyReservationFilterBtn');
  if (applyReservationFilterBtn) {
    applyReservationFilterBtn.addEventListener('click', function() {
      loadAdminReservations();
    });
  }
  
  // Reset Reservation Filter button
  const resetReservationFilterBtn = document.getElementById('resetReservationFilterBtn');
  if (resetReservationFilterBtn) {
    resetReservationFilterBtn.addEventListener('click', function() {
      document.getElementById('reservationStudentSearch').value = '';
      document.getElementById('reservationStatusFilter').value = 'all';
      loadAdminReservations();
    });
  }
  
  // Reservation entries per page
  const reservationEntriesSelect = document.getElementById('reservationEntriesSelect');
  if (reservationEntriesSelect) {
    reservationEntriesSelect.addEventListener('change', function() {
      loadAdminReservations();
    });
  }

  // Health Monitor link
  const healthMonitorLink = document.getElementById('healthMonitorLink');
  const healthMonitorSection = document.getElementById('healthMonitorSection');
  if (healthMonitorLink && healthMonitorSection) {
    healthMonitorLink.addEventListener('click', function(e) {
      e.preventDefault();
      hideAllSections();
      healthMonitorSection.style.display = 'block';
      loadHealthMonitor();
    });
  }

  const refreshHealthMonitorBtn = document.getElementById('refreshHealthMonitorBtn');
  if (refreshHealthMonitorBtn) {
    refreshHealthMonitorBtn.addEventListener('click', loadHealthMonitor);
  }
  const healthMonitorLabSelect = document.getElementById('healthMonitorLabSelect');
  if (healthMonitorLabSelect) {
    healthMonitorLabSelect.addEventListener('change', loadHealthMonitor);
  }

  // Settings link
  const settingsLink = document.getElementById('settingsLink');
  const settingsSection = document.getElementById('settingsSection');
  if (settingsLink && settingsSection) {
    settingsLink.addEventListener('click', function(e) {
      e.preventDefault();
      hideAllSections();
      settingsSection.style.display = 'block';
      loadSettings();
      loadSoftware();
    });
  }

  // Leaderboard link
  const leaderboardLink = document.getElementById('leaderboardLink');
  const leaderboardSection = document.getElementById('leaderboardSection');
  if (leaderboardLink && leaderboardSection) {
    leaderboardLink.addEventListener('click', function(e) {
      e.preventDefault();
      hideAllSections();
      leaderboardSection.style.display = 'block';
      loadLeaderboard();
    });
  }

  // Apply Filter button
  const applyFilterBtn = document.getElementById('applyFilterBtn');
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', function() {
      loadSitInReports();
    });
  }
  
  // Reset Filter button
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', function() {
      document.getElementById('reportStudentSearch').value = '';
      document.getElementById('reportDateFrom').value = '';
      document.getElementById('reportDateTo').value = '';
      loadSitInReports();
    });
  }
  
  // Export buttons
  const exportCSVBtn = document.getElementById('exportCSVBtn');
  const exportPDFBtn = document.getElementById('exportPDFBtn');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', function() {
      exportToCSV();
    });
  }
  
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener('click', function() {
      exportToPDF();
    });
  }
  
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', function() {
      exportToExcel();
    });
  }
  
  if (printReportBtn) {
    printReportBtn.addEventListener('click', function() {
      printReport();
    });
  }
  
  // Report entries per page
  const reportEntriesSelect = document.getElementById('reportEntriesSelect');
  if (reportEntriesSelect) {
    reportEntriesSelect.addEventListener('change', function() {
      loadSitInReports();
    });
  }
  
  // Sit-in table search
  const sitinTableSearch = document.getElementById('sitinTableSearch');
  if (sitinTableSearch) {
    sitinTableSearch.addEventListener('input', function() {
      filterSitInRecords(this.value);
    });
  }
  
  // Sit-in entries per page
  const sitinEntriesSelect = document.getElementById('sitinEntriesSelect');
  if (sitinEntriesSelect) {
    sitinEntriesSelect.addEventListener('change', function() {
      loadSitInRecords();
    });
  }

  // Generate PC Options
  const sitinPcNumber = document.getElementById('sitinPcNumber');
  if (sitinPcNumber) {
    for (let i = 1; i <= 49; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `PC ${i}`;
      sitinPcNumber.appendChild(option);
    }
  }

function hideAllSections() {
  if (mainContent) mainContent.style.display = 'none';
  if (studentInfoSection) studentInfoSection.style.display = 'none';
  if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'none';
  if (currentSitInSection) currentSitInSection.style.display = 'none';
  if (sitinReportsSection) sitinReportsSection.style.display = 'none';
  if (feedbackReportsSection) feedbackReportsSection.style.display = 'none';
  if (reservationSection) reservationSection.style.display = 'none';
  if (healthMonitorSection) healthMonitorSection.style.display = 'none';
  if (settingsSection) settingsSection.style.display = 'none';
  
  const leaderboardSection = document.getElementById('leaderboardSection');
  if (leaderboardSection) leaderboardSection.style.display = 'none';
}

function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

function logout() {
  // Clear authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redirect to login page
  window.location.href = 'Login.html';
}

// Load Statistics
async function loadStatistics() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/statistics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const stats = data.statistics;
      
      // Update stat values
      document.getElementById('studentsRegistered').textContent = stats.totalUsers || 0;
      document.getElementById('currentlySitIn').textContent = stats.currentlySitIn || 0;
      document.getElementById('totalSitIn').textContent = stats.totalSitIn || 0;
      document.getElementById('mostUsedLab').textContent = stats.mostUsedLab || 'N/A';
      document.getElementById('mostUsedPurpose').textContent = stats.mostUsedPurpose || 'N/A';
      
      // Update language graph
      updateLanguageGraph(stats.languageStats || []);
    } else {
      console.error('Error loading statistics:', data.message);
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    // Show demo data if server is not available
    showDemoStatistics();
  }
}

function showDemoStatistics() {
  document.getElementById('studentsRegistered').textContent = '0';
  document.getElementById('currentlySitIn').textContent = '0';
  document.getElementById('totalSitIn').textContent = '0';
  
  // Show demo language data
  const demoLanguageStats = [
    { language: 'C Programming', count: 1 },
    { language: 'C++', count: 0 },
    { language: 'C#', count: 1 },
    { language: 'Java', count: 0 },
    { language: 'Python', count: 2 },
    { language: 'ASP.Net', count: 0 },
    { language: 'PHP', count: 1 }
  ];
  updateLanguageGraph(demoLanguageStats);
}

function updateLanguageGraph(languageStats) {
  const canvas = document.getElementById('languageRadarChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 30;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const languageMap = {
    'C#': 'csharp',
    'C Programming': 'c',
    'C++': 'cpp',
    'Java': 'java',
    'Python': 'python',
    'ASP.Net': 'aspnet',
    'PHP': 'php'
  };
  
  const languages = ['C Programming', 'C++', 'C#', 'Java', 'Python', 'ASP.Net', 'PHP'];
  
  // Get counts for each language
  const counts = languages.map(lang => {
    let count = 0;
    languageStats.forEach(stat => {
      if (stat.language === lang || stat.language === languageMap[lang]) {
        count = stat.count;
      }
    });
    return count;
  });
  
  // Calculate total
  const total = counts.reduce((sum, count) => sum + count, 0);
  
  // Colors for each language
  const colors = ['#1a1a2e', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#00cec9'];
  
  // Draw pie chart
  let startAngle = 0;
  
  counts.forEach((count, i) => {
    if (count === 0) return;
    
    const sliceAngle = (count / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    
    // Draw slice border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Calculate label position (midpoint of slice)
    const midAngle = startAngle + sliceAngle / 2;
    const labelX = centerX + (radius * 0.65) * Math.cos(midAngle);
    const labelY = centerY + (radius * 0.65) * Math.sin(midAngle);
    
    // Draw percentage label if slice is big enough
    if (count / total > 0.05) {
      const percentage = Math.round((count / total) * 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(percentage + '%', labelX, labelY);
    }
    
    startAngle = endAngle;
  });
  
  // Draw center circle (for donut effect)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
  ctx.fillStyle = '#f8f9fa';
  ctx.fill();
  
  // Draw total in center
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total.toString(), centerX, centerY - 8);
  ctx.font = '12px Arial';
  ctx.fillText('Total', centerX, centerY + 10);
  
  // Update legend
  updateRadarLegend(languages, counts, colors, total);
}

function updateRadarLegend(languages, counts, colors, total) {
  const legend = document.getElementById('radarLegend');
  if (!legend) return;
  
  let html = '';
  languages.forEach((lang, i) => {
    const percentage = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
    html += `
      <div class="radar-legend-item">
        <div class="radar-legend-color" style="background-color: ${colors[i % colors.length]}"></div>
        <span>${lang}: ${counts[i]} (${percentage}%)</span>
      </div>
    `;
  });
  
  legend.innerHTML = html;
}

// Load Announcements
async function loadAnnouncements() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/announcements', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayAnnouncements(data.announcements || []);
    } else {
      console.error('Error loading announcements:', data.message);
      displayAnnouncements([]);
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
    displayAnnouncements([]);
  }
}

function displayAnnouncements(announcements) {
  const listContainer = document.getElementById('announcementsList');
  
  if (!listContainer) return;
  
  if (announcements.length === 0) {
    listContainer.innerHTML = '<div class="no-announcements">No announcements yet</div>';
    return;
  }
  
  let html = '';
  announcements.forEach(announcement => {
    const date = new Date(announcement.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    html += `
      <div class="announcement-item" style="position: relative;">
        <button class="delete-btn" onclick="deleteAnnouncement(${announcement.id})" style="position: absolute; right: 10px; top: 10px; background: none; border: none; color: #F44336; cursor: pointer;">
          <i class="fa-solid fa-trash"></i>
        </button>
        <div class="announcement-date">${date}</div>
        <div class="announcement-content">${escapeHtml(announcement.content)}</div>
      </div>
    `;
  });
  
  listContainer.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Submit Announcement
async function submitAnnouncement() {
  const content = document.getElementById('announcementContent').value.trim();
  
  if (!content) {
    alert('Please enter an announcement');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Announcement',
        content: content
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear textarea
      document.getElementById('announcementContent').value = '';
      
      // Show success message
      alert('Announcement posted successfully!');
      
      // Reload announcements
      loadAnnouncements();
    } else {
      alert(data.message || 'Failed to post announcement');
    }
  } catch (error) {
    console.error('Error posting announcement:', error);
    alert('Unable to post announcement. Please try again.');
  }
}

// Check for session timeout
setInterval(() => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = 'Login.html';
  }
}, 60000); // Check every minute

// Auto refresh for Current Sit-In Students and Health Monitor
setInterval(() => {
  const currentSitInSection = document.getElementById('currentSitInSection');
  if (currentSitInSection && currentSitInSection.style.display !== 'none') {
    loadCurrentSitInStudents();
  }
  
  const healthMonitorSection = document.getElementById('healthMonitorSection');
  if (healthMonitorSection && healthMonitorSection.style.display !== 'none') {
    loadHealthMonitor();
  }
}, 5000);

// Search Student by ID
async function searchStudentById() {
  const studentId = document.getElementById('searchStudentId').value.trim();
  
  if (!studentId) {
    alert('Please enter a student ID number');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Display student info
      const student = data.student;
      const remainingSessions = student.sessions || 30;
      
      // Close search modal
      document.getElementById('searchStudentModal').classList.remove('show');
      document.getElementById('searchStudentId').value = '';
      
      // Open Sit-In modal and fill in the data
      const sitinModal = document.getElementById('sitinModal');
      if (sitinModal) {
        document.getElementById('sitinIdNumber').value = student.id_number;
        document.getElementById('sitinStudentName').value = `${student.firstname} ${student.lastname}`;
        document.getElementById('sitinRemainingSessions').value = remainingSessions;
        sitinModal.classList.add('show');
      }
    } else {
      alert(data.message || 'Student not found');
    }
  } catch (error) {
    console.error('Error searching student:', error);
    alert('Unable to search student. Please try again.');
  }
}

// Load Students
async function loadStudents() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/students', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayStudents(data.students || []);
    } else {
      console.error('Error loading students:', data.message);
      displayStudents([]);
    }
  } catch (error) {
    console.error('Error loading students:', error);
    displayStudents([]);
  }
}

// Display Students in table
function displayStudents(students) {
  const tbody = document.getElementById('studentTableBody');
  
  if (!tbody) return;
  
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found</td></tr>';
    return;
  }
  
  let html = '';
  students.forEach(student => {
    html += `
      <tr>
        <td>${student.id_number}</td>
        <td>${student.firstname} ${student.lastname}</td>
        <td>${student.year}</td>
        <td>${student.course}</td>
        <td>${student.sessions || 30}</td>
        <td class="actions-cell">
          <button class="action-icon edit-btn" onclick="editStudent('${student.id_number}')" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-icon delete-btn" onclick="deleteStudent('${student.id_number}')" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

// Filter Students
function filterStudents(searchTerm) {
  const rows = document.querySelectorAll('#studentTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Edit Student
function editStudent(studentId) {
  alert('Edit student: ' + studentId + ' - functionality coming soon');
}

// Delete Student
function deleteStudent(studentId) {
  if (confirm('Are you sure you want to delete this student?')) {
    deleteStudentById(studentId);
  }
}

// Delete Student by ID
async function deleteStudentById(studentId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Student deleted successfully');
      loadStudents();
    } else {
      alert(data.message || 'Failed to delete student');
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    alert('Unable to delete student. Please try again.');
  }
}

// Reset All Sessions
async function resetAllSessions() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/students/reset-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('All student sessions have been reset');
      loadStudents();
    } else {
      alert(data.message || 'Failed to reset sessions');
    }
  } catch (error) {
    console.error('Error resetting sessions:', error);
    alert('Unable to reset sessions. Please try again.');
  }
}

// Fetch student for Sit-In
async function fetchStudentForSitIn(idNumber) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${idNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const student = data.student;
      document.getElementById('sitinStudentName').value = `${student.firstname} ${student.lastname}`;
      document.getElementById('sitinRemainingSessions').value = student.sessions || 30;
    } else {
      document.getElementById('sitinStudentName').value = '';
      document.getElementById('sitinRemainingSessions').value = '';
      alert('Student not found');
    }
  } catch (error) {
    console.error('Error fetching student:', error);
  }
}

// Submit Sit-In
async function submitSitIn() {
  const idNumber = document.getElementById('sitinIdNumber').value.trim();
  const purpose = document.getElementById('sitinPurpose').value;
  const lab = document.getElementById('sitinLab').value.trim();
  const pcNumber = document.getElementById('sitinPcNumber') ? document.getElementById('sitinPcNumber').value : '';
  
  if (!idNumber) {
    alert('Please enter ID Number');
    return;
  }
  
  if (!purpose) {
    alert('Please select a Purpose/Language');
    return;
  }
  
  if (!lab) {
    alert('Please enter Lab/Room Number');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        idNumber: idNumber,
        purpose: purpose,
        lab: lab,
        pcNumber: pcNumber
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Sit-In recorded successfully!');
      document.getElementById('sitinModal').classList.remove('show');
      clearSitInForm();
      loadCurrentSitInStudents();
      loadSitInRecords();
      loadHealthMonitor();
    } else {
      alert(data.message || 'Failed to record Sit-In');
    }
  } catch (error) {
    console.error('Error submitting sit-in:', error);
    alert('Unable to submit Sit-In. Please try again.');
  }
}

// Clear Sit-In Form
function clearSitInForm() {
  document.getElementById('sitinIdNumber').value = '';
  document.getElementById('sitinStudentName').value = '';
  document.getElementById('sitinPurpose').value = '';
  document.getElementById('sitinLab').value = '';
  document.getElementById('sitinRemainingSessions').value = '';
  const sitinPcSelect = document.getElementById('sitinPcNumber');
  if (sitinPcSelect) {
    sitinPcSelect.innerHTML = '<option value="">Select PC</option>';
  }
}

// Dynamic populating and filtering of Sit-in PC dropdown based on selected Lab
const sitinLabInput = document.getElementById('sitinLab');
const sitinPcSelect = document.getElementById('sitinPcNumber');

if (sitinLabInput && sitinPcSelect) {
  sitinLabInput.addEventListener('input', updateSitInPcDropdown);
  sitinLabInput.addEventListener('change', updateSitInPcDropdown);
}

async function updateSitInPcDropdown() {
  const lab = sitinLabInput.value.trim();
  sitinPcSelect.innerHTML = '<option value="">Select PC</option>';
  
  if (!lab) return;
  
  try {
    const response = await fetch('/api/disabled-pcs');
    const data = await response.json();
    
    if (data.success) {
      const disabledPCs = new Set(
        data.disabledPCs
          .filter(pc => String(pc.lab) === String(lab))
          .map(pc => parseInt(pc.pc_number))
      );
      
      for (let i = 1; i <= 49; i++) {
        if (!disabledPCs.has(i)) {
          const option = document.createElement('option');
          option.value = i;
          option.textContent = `PC ${i}`;
          sitinPcSelect.appendChild(option);
        }
      }
    }
  } catch (error) {
    console.error('Error filtering sit-in PCs:', error);
    for (let i = 1; i <= 49; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `PC ${i}`;
      sitinPcSelect.appendChild(option);
    }
  }
}

// Global variables for pagination
let sitInRecords = [];
let currentSitInPage = 1;
let sitInRecordsPerPage = 10;

// Load Sit-In Records
async function loadSitInRecords() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin-records', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      sitInRecords = data.records || [];
      displaySitInRecords();
    } else {
      console.error('Error loading sit-in records:', data.message);
      displaySitInRecords([]);
    }
  } catch (error) {
    console.error('Error loading sit-in records:', error);
    displaySitInRecords([]);
  }
}

// Display Sit-In Records in table
function displaySitInRecords() {
  const tbody = document.getElementById('sitinTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('sitinEntriesSelect');
  sitInRecordsPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = sitInRecords.length;
  const totalPages = Math.ceil(totalRecords / sitInRecordsPerPage);
  const startIndex = (currentSitInPage - 1) * sitInRecordsPerPage;
  const endIndex = Math.min(startIndex + sitInRecordsPerPage, totalRecords);
  const recordsToShow = sitInRecords.slice(startIndex, endIndex);
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No records found</td></tr>';
    updateSitInPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach(record => {
    // Capitalize first letter of status
    const status = record.status.charAt(0).toUpperCase() + record.status.slice(1);
    html += `
      <tr>
        <td>${record.id}</td>
        <td>${record.id_number}</td>
        <td>${record.name}</td>
        <td>${record.purpose}</td>
        <td>${record.lab}</td>
        <td>${record.session || 1}</td>
        <td><span class="status-badge status-${record.status}">${status}</span></td>
        <td class="actions-cell">
          <button class="action-icon edit-btn" onclick="completeSitIn('${record.id}')" title="Complete">
            <i class="fa-solid fa-check"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateSitInPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update pagination info
function updateSitInPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('sitinShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('sitinCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = currentSitInPage;
  }
}

// Filter Sit-In Records
function filterSitInRecords(searchTerm) {
  const rows = document.querySelectorAll('#sitinTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Pagination functions
function goToFirstPage() {
  currentSitInPage = 1;
  displaySitInRecords();
}

function goToPrevPage() {
  const totalPages = Math.ceil(sitInRecords.length / sitInRecordsPerPage);
  if (currentSitInPage > 1) {
    currentSitInPage--;
    displaySitInRecords();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(sitInRecords.length / sitInRecordsPerPage);
  if (currentSitInPage < totalPages) {
    currentSitInPage++;
    displaySitInRecords();
  }
}

function goToLastPage() {
  const totalPages = Math.ceil(sitInRecords.length / sitInRecordsPerPage);
  currentSitInPage = totalPages;
  displaySitInRecords();
}

// Complete Sit-In
function completeSitIn(recordId) {
  if (confirm('Mark this sit-in as completed?')) {
    completeSitInRecord(recordId);
  }
}

async function completeSitInRecord(recordId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/sitin-records/${recordId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Sit-in completed successfully');
      loadSitInRecords();
      loadCurrentSitInStudents(); // Refresh current sit-in list
    } else {
      alert(data.message || 'Failed to complete sit-in');
    }
  } catch (error) {
    console.error('Error completing sit-in:', error);
    alert('Unable to complete sit-in. Please try again.');
  }
}

// Global variables for current sit-in pagination
let currentSitInStudents = [];
let currentPageSitIn = 1;
let currentSitInPerPage = 10;

// Load Current Sit-In Students (active only)
async function loadCurrentSitInStudents() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin-records', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Filter only active sit-ins
      currentSitInStudents = (data.records || []).filter(record => record.status === 'active');
      displayCurrentSitInStudents();
    } else {
      console.error('Error loading sit-in records:', data.message);
      displayCurrentSitInStudents([]);
    }
  } catch (error) {
    console.error('Error loading sit-in records:', error);
    displayCurrentSitInStudents([]);
  }
}

// Display Current Sit-In Students in table
function displayCurrentSitInStudents() {
  const tbody = document.getElementById('currentSitinTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('currentSitinEntriesSelect');
  currentSitInPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = currentSitInStudents.length;
  const totalPages = Math.ceil(totalRecords / currentSitInPerPage);
  const startIndex = (currentPageSitIn - 1) * currentSitInPerPage;
  const endIndex = Math.min(startIndex + currentSitInPerPage, totalRecords);
  const recordsToShow = currentSitInStudents.slice(startIndex, endIndex);
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No active sit-in students</td></tr>';
    updateCurrentSitInPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach(record => {
    // Format time in
    const timeIn = new Date(record.timeIn).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    html += `
      <tr>
        <td>${record.id}</td>
        <td>${record.id_number}</td>
        <td>${record.name}</td>
        <td>${record.purpose}</td>
        <td>${record.lab}</td>
        <td>${timeIn}</td>
        <td class="actions-cell">
          <button class="action-icon edit-btn" onclick="completeSitIn('${record.id}')" title="Complete">
            <i class="fa-solid fa-check"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateCurrentSitInPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update current sit-in pagination info
function updateCurrentSitInPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('currentSitinShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('currentSitinCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = currentPageSitIn;
  }
}

// Filter Current Sit-In Students
function filterCurrentSitInStudents(searchTerm) {
  const rows = document.querySelectorAll('#currentSitinTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Pagination functions for current sit-in
function goToCurrentSitInFirstPage() {
  currentPageSitIn = 1;
  displayCurrentSitInStudents();
}

function goToCurrentSitInPrevPage() {
  const totalPages = Math.ceil(currentSitInStudents.length / currentSitInPerPage);
  if (currentPageSitIn > 1) {
    currentPageSitIn--;
    displayCurrentSitInStudents();
  }
}

function goToCurrentSitInNextPage() {
  const totalPages = Math.ceil(currentSitInStudents.length / currentSitInPerPage);
  if (currentPageSitIn < totalPages) {
    currentPageSitIn++;
    displayCurrentSitInStudents();
  }
}

function goToCurrentSitInLastPage() {
  const totalPages = Math.ceil(currentSitInStudents.length / currentSitInPerPage);
  currentPageSitIn = totalPages;
  displayCurrentSitInStudents();
}

// Global variables for reports pagination
let sitInReportsData = [];
let filteredReportsData = [];
let reportPage = 1;
let reportsPerPage = 10;

// Load Sit-In Reports
async function loadSitInReports() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin-records', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      sitInReportsData = data.records || [];
      applyReportsFilters();
    } else {
      console.error('Error loading sit-in records:', data.message);
      displaySitInReports([]);
    }
  } catch (error) {
    console.error('Error loading sit-in records:', error);
    displaySitInReports([]);
  }
}

// Apply filters to reports
function applyReportsFilters() {
  const searchTerm = document.getElementById('reportStudentSearch').value.toLowerCase();
  const dateFrom = document.getElementById('reportDateFrom').value;
  const dateTo = document.getElementById('reportDateTo').value;
  
  filteredReportsData = sitInReportsData.filter(record => {
    // Search filter
    const matchesSearch = !searchTerm || 
      record.name.toLowerCase().includes(searchTerm) || 
      record.id_number.toLowerCase().includes(searchTerm);
    
    // Date filters
    const recordDate = new Date(record.timeIn);
    const matchesDateFrom = !dateFrom || recordDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || recordDate <= new Date(dateTo + 'T23:59:59');
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });
  
  reportPage = 1;
  displaySitInReports(filteredReportsData);
}

// Display Sit-In Reports in table
function displaySitInReports(records) {
  const tbody = document.getElementById('sitinReportsTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('reportEntriesSelect');
  reportsPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = records.length;
  const totalPages = Math.ceil(totalRecords / reportsPerPage);
  const startIndex = (reportPage - 1) * reportsPerPage;
  const endIndex = Math.min(startIndex + reportsPerPage, totalRecords);
  const recordsToShow = records.slice(startIndex, endIndex);
  
  // Update total records display
  const totalRecordsEl = document.getElementById('reportTotalRecords');
  if (totalRecordsEl) {
    totalRecordsEl.textContent = `Total: ${totalRecords} records`;
  }
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">No records found</td></tr>';
    updateReportPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach((record, index) => {
    // Format dates and times
    const dateObj = new Date(record.timeIn);
    const date = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const login = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const logout = record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';
    
    html += `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${record.name}</td>
        <td>${record.id_number}</td>
        <td>${record.purpose}</td>
        <td>${record.lab}</td>
        <td>${login}</td>
        <td>${logout}</td>
        <td>${date}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateReportPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update report pagination info
function updateReportPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('reportShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('reportCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = reportPage;
  }
}

// Pagination functions for reports
function goToReportFirstPage() {
  reportPage = 1;
  displaySitInReports(filteredReportsData);
}

function goToReportPrevPage() {
  const totalPages = Math.ceil(filteredReportsData.length / reportsPerPage);
  if (reportPage > 1) {
    reportPage--;
    displaySitInReports(filteredReportsData);
  }
}

function goToReportNextPage() {
  const totalPages = Math.ceil(filteredReportsData.length / reportsPerPage);
  if (reportPage < totalPages) {
    reportPage++;
    displaySitInReports(filteredReportsData);
  }
}

function goToReportLastPage() {
  const totalPages = Math.ceil(filteredReportsData.length / reportsPerPage);
  reportPage = totalPages;
  displaySitInReports(filteredReportsData);
}

// Export to CSV
function exportToCSV() {
  if (filteredReportsData.length === 0) {
    alert('No data to export');
    return;
  }
  
  let csv = 'Student,ID Number,Purpose,Laboratory,Login,Logout,Date\n';
  
  filteredReportsData.forEach(record => {
    const dateObj = new Date(record.timeIn);
    const date = dateObj.toLocaleDateString('en-US');
    const login = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const logout = record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    
    csv += `"${record.name}","${record.id_number}","${record.purpose}","${record.lab}","${login}","${logout}","${date}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `sitin_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to Excel (CSV format with .xls extension)
function exportToExcel() {
  if (filteredReportsData.length === 0) {
    alert('No data to export');
    return;
  }
  
  let excel = '<table><tr><th>Student</th><th>ID Number</th><th>Purpose</th><th>Laboratory</th><th>Login</th><th>Logout</th><th>Date</th></tr>';
  
  filteredReportsData.forEach(record => {
    const dateObj = new Date(record.timeIn);
    const date = dateObj.toLocaleDateString('en-US');
    const login = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const logout = record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    
    excel += `<tr><td>${record.name}</td><td>${record.id_number}</td><td>${record.purpose}</td><td>${record.lab}</td><td>${login}</td><td>${logout}</td><td>${date}</td></tr>`;
  });
  
  excel += '</table>';
  
  const blob = new Blob(['\ufeff', excel], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `sitin_report_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF (real PDF file generation)
function exportToPDF() {
  if (filteredReportsData.length === 0) {
    alert('No data to export');
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode for wider table readability
    
    // Page Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(106, 13, 173); // Purple theme color
    doc.text("CCS Sit-In Report", 14, 18);
    
    // Report Info
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredReportsData.length}`, 14, 25);
    
    // Table headers and data rows mapping
    const headers = [['#', 'Student Name', 'ID Number', 'Purpose/Subject', 'Laboratory', 'Time In', 'Time Out', 'Date']];
    const data = filteredReportsData.map((record, index) => {
      const dateObj = new Date(record.timeIn);
      const date = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const login = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const logout = record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';
      
      return [
        index + 1,
        record.name,
        record.id_number,
        record.purpose,
        record.lab,
        login,
        logout,
        date
      ];
    });
    
    // AutoTable creation
    doc.autoTable({
      head: headers,
      body: data,
      startY: 30,
      theme: 'striped',
      headStyles: {
        fillColor: [106, 13, 173],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        font: 'Helvetica',
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      margin: { left: 14, right: 14 }
    });
    
    doc.save(`CCS_SitIn_Report_${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while exporting the PDF. Falling back to print menu...');
    printReport();
  }
}

// Print Report
function printReport() {
  if (filteredReportsData.length === 0) {
    alert('No data to print');
    return;
  }
  
  const printWindow = window.open('', '', 'height=600,width=1200');
  
  let html = `
    <html>
      <head>
        <title>Sit-In Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #6a0dad; }
          .report-info { margin-bottom: 20px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #6a0dad; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>CCS Sit-In Report</h1>
        <div class="report-info">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${filteredReportsData.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>ID Number</th>
              <th>Purpose</th>
              <th>Laboratory</th>
              <th>Login</th>
              <th>Logout</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  filteredReportsData.forEach((record, index) => {
    const dateObj = new Date(record.timeIn);
    const date = dateObj.toLocaleDateString('en-US');
    const login = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const logout = record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${record.name}</td>
        <td>${record.id_number}</td>
        <td>${record.purpose}</td>
        <td>${record.lab}</td>
        <td>${login}</td>
        <td>${logout}</td>
        <td>${date}</td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

// Global variables for reservations pagination
let adminReservationsData = [];
let filteredReservationsData = [];
let reservationPage = 1;
let reservationsPerPage = 10;

// Load Admin Reservations
async function loadAdminReservations() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/reservations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      adminReservationsData = data.reservations || [];
      applyReservationFilters();
    } else {
      console.error('Error loading reservations:', data.message);
      displayAdminReservations([]);
    }
  } catch (error) {
    console.error('Error loading reservations:', error);
    displayAdminReservations([]);
  }
}

// Apply filters to reservations
function applyReservationFilters() {
  const searchTerm = document.getElementById('reservationStudentSearch').value.toLowerCase();
  const statusFilter = document.getElementById('reservationStatusFilter').value;
  
  filteredReservationsData = adminReservationsData.filter(record => {
    // Search filter
    const matchesSearch = !searchTerm || 
      record.student.toLowerCase().includes(searchTerm) || 
      record.id_number.toLowerCase().includes(searchTerm);
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  reservationPage = 1;
  displayAdminReservations(filteredReservationsData);
}

// Display Admin Reservations in table
function displayAdminReservations(records) {
  const tbody = document.getElementById('reservationsTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('reservationEntriesSelect');
  reservationsPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = records.length;
  const totalPages = Math.ceil(totalRecords / reservationsPerPage);
  const startIndex = (reservationPage - 1) * reservationsPerPage;
  const endIndex = Math.min(startIndex + reservationsPerPage, totalRecords);
  const recordsToShow = records.slice(startIndex, endIndex);
  
  // Update total records display
  const totalRecordsEl = document.getElementById('reservationTotalRecords');
  if (totalRecordsEl) {
    totalRecordsEl.textContent = `Total: ${totalRecords} records`;
  }
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px;">No reservations found</td></tr>';
    updateReservationPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach((record, index) => {
    // Format date
    const date = new Date(record.reservation_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Status badge
    const statusBadge = `<span class="status-badge status-${record.status}">${record.status}</span>`;
    
    // Action buttons (only for pending reservations)
    let actions = '-';
    if (record.status === 'pending') {
      actions = `
        <button class="action-btn approve-btn" onclick="approveReservation(${record.id})">
          <i class="fa-solid fa-check"></i> Approve
        </button>
        <button class="action-btn cancel-btn" onclick="cancelReservation(${record.id})">
          <i class="fa-solid fa-times"></i> Cancel
        </button>
      `;
    }
    
    html += `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${record.student}</td>
        <td>${record.id_number}</td>
        <td>${record.lab}</td>
        <td>${record.purpose}</td>
        <td>${date}</td>
        <td>${record.reservation_time}</td>
        <td>${statusBadge}</td>
        <td>${actions}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateReservationPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update reservation pagination info
function updateReservationPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('reservationShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('reservationCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = reservationPage;
  }
}

// Pagination functions for reservations
function goToReservationFirstPage() {
  reservationPage = 1;
  displayAdminReservations(filteredReservationsData);
}

function goToReservationPrevPage() {
  const totalPages = Math.ceil(filteredReservationsData.length / reservationsPerPage);
  if (reservationPage > 1) {
    reservationPage--;
    displayAdminReservations(filteredReservationsData);
  }
}

function goToReservationNextPage() {
  const totalPages = Math.ceil(filteredReservationsData.length / reservationsPerPage);
  if (reservationPage < totalPages) {
    reservationPage++;
    displayAdminReservations(filteredReservationsData);
  }
}

function goToReservationLastPage() {
  const totalPages = Math.ceil(filteredReservationsData.length / reservationsPerPage);
  reservationPage = totalPages;
  displayAdminReservations(filteredReservationsData);
}

// Approve reservation
async function approveReservation(reservationId) {
  if (!confirm('Are you sure you want to approve this reservation?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/reservations/${reservationId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'approved' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Reservation approved successfully');
      loadAdminReservations();
    } else {
      alert(data.message || 'Failed to approve reservation');
    }
  } catch (error) {
    console.error('Error approving reservation:', error);
    alert('Unable to approve reservation. Please try again.');
  }
}

// // Cancel Reservation
async function cancelReservation(id) {
  if (!confirm('Are you sure you want to cancel this reservation?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/reservations/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Reservation cancelled successfully');
      loadAdminReservations();
    } else {
      alert(data.message || 'Failed to cancel reservation');
    }
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    alert('Unable to cancel reservation. Please try again.');
  }
}

// Health Monitor
async function loadHealthMonitor() {
  try {
    const token = localStorage.getItem('authToken');
    
    // Fetch active sit-ins
    const sitinResponse = await fetch('/api/admin/sitin-records', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const sitinData = await sitinResponse.json();
    
    // Fetch disabled PCs
    const disabledResponse = await fetch('/api/disabled-pcs');
    const disabledData = await disabledResponse.json();
    
    if (sitinData.success && disabledData.success) {
      const selectedLab = document.getElementById('healthMonitorLabSelect').value;
      const activeSitins = sitinData.records.filter(r => r.status === 'active' && String(r.lab) === String(selectedLab));
      const occupiedPCs = new Set(activeSitins.map(r => parseInt(r.pc_number)).filter(pc => !isNaN(pc)));
      
      const disabledPCs = new Set();
      disabledData.disabledPCs
        .filter(pc => String(pc.lab) === String(selectedLab))
        .forEach(pc => disabledPCs.add(parseInt(pc.pc_number)));
      
      const grid = document.getElementById('pcGrid');
      grid.innerHTML = '';
      
      for (let i = 1; i <= 49; i++) {
        const div = document.createElement('div');
        div.style.padding = '15px 5px';
        div.style.textAlign = 'center';
        div.style.border = '1px solid #ddd';
        div.style.borderRadius = '8px';
        div.style.transition = 'all 0.3s ease';
        div.style.cursor = 'pointer';
        
        const isOccupied = occupiedPCs.has(i);
        const isDisabled = disabledPCs.has(i);
        
        let color = '#4CAF50'; // Green: Available
        let statusText = 'Available';
        let iconClass = 'fa-desktop';
        
        if (isOccupied) {
          color = '#F44336'; // Red: Occupied
          statusText = 'Occupied';
          div.style.backgroundColor = '#ffebee';
          div.style.borderColor = '#ffcdd2';
        } else if (isDisabled) {
          color = '#9E9E9E'; // Grey: Disabled
          statusText = 'Disabled';
          iconClass = 'fa-ban';
          div.style.backgroundColor = '#eeeeee';
          div.style.borderColor = '#e0e0e0';
        } else {
          div.style.backgroundColor = '#e8f5e9';
          div.style.borderColor = '#c8e6c9';
        }
        
        div.innerHTML = `
          <i class="fa-solid ${iconClass}" style="font-size: 24px; color: ${color};"></i>
          <div style="margin-top: 5px; font-weight: bold; color: ${isDisabled ? '#757575' : '#333'};">PC ${i}</div>
          <div style="font-size: 10px; font-weight: bold; color: ${color}; text-transform: uppercase; margin-top: 2px;">${statusText}</div>
        `;
        
        // Add click event for Admin to enable/disable
        div.addEventListener('click', async () => {
          if (isOccupied) {
            alert(`PC ${i} is currently occupied by a student. Please complete their sit-in session before disabling this PC.`);
            return;
          }
          
          const action = isDisabled ? 'enable' : 'disable';
          if (confirm(`Are you sure you want to ${action} PC ${i} in Lab ${selectedLab}?`)) {
            try {
              const res = await fetch('/api/admin/disabled-pcs/toggle', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ lab: selectedLab, pcNumber: i })
              });
              const resData = await res.json();
              if (resData.success) {
                // Reload monitor
                loadHealthMonitor();
              } else {
                alert(resData.message || `Failed to ${action} PC`);
              }
            } catch (err) {
              console.error(err);
              alert(`Error toggling PC status`);
            }
          }
        });
        
        // Premium hover micro-animations
        div.addEventListener('mouseenter', () => {
          div.style.transform = 'translateY(-3px)';
          div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });
        div.addEventListener('mouseleave', () => {
          div.style.transform = 'translateY(0)';
          div.style.boxShadow = 'none';
        });
        
        grid.appendChild(div);
      }
    }
  } catch (error) {
    console.error('Error loading health monitor:', error);
  }
}

// Settings
async function loadSettings() {
  try {
    const response = await fetch('/api/settings/reservations_enabled');
    const data = await response.json();
    if (data.success) {
      document.getElementById('enableReservationsToggle').checked = (data.value === 'true');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

const enableReservationsToggle = document.getElementById('enableReservationsToggle');
if (enableReservationsToggle) {
  enableReservationsToggle.addEventListener('change', async function() {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/admin/settings/reservations_enabled', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ value: this.checked ? 'true' : 'false' })
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  });
}

// Software
async function loadSoftware() {
  const lab = document.getElementById('softwareLabSelect').value;
  try {
    const response = await fetch(`/api/lab-software?lab=${lab}`);
    const data = await response.json();
    const list = document.getElementById('softwareList');
    list.innerHTML = '';
    if (data.success) {
      data.software.forEach(sw => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.padding = '8px 0';
        li.style.borderBottom = '1px solid #eee';
        li.innerHTML = `
          <span>${sw.software_name}</span>
          <button class="delete-btn" onclick="deleteSoftware(${sw.id})" style="background: none; border: none; color: #F44336; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
        list.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error loading software:', error);
  }
}

const softwareLabSelect = document.getElementById('softwareLabSelect');
if (softwareLabSelect) {
  softwareLabSelect.addEventListener('change', loadSoftware);
}

const addSoftwareBtn = document.getElementById('addSoftwareBtn');
if (addSoftwareBtn) {
  addSoftwareBtn.addEventListener('click', async () => {
    const lab = document.getElementById('softwareLabSelect').value;
    const softwareName = document.getElementById('softwareNameInput').value;
    if (!softwareName) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/admin/lab-software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lab, softwareName })
      });
      document.getElementById('softwareNameInput').value = '';
      loadSoftware();
    } catch (error) {
      console.error('Error adding software:', error);
    }
  });
}

window.deleteSoftware = async function(id) {
  if (!confirm('Delete this software?')) return;
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`/api/admin/lab-software/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadSoftware();
  } catch (error) {
    console.error('Error deleting software:', error);
  }
};

window.deleteAnnouncement = async function(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      loadAnnouncements();
    } else {
      alert(data.message || 'Failed to delete announcement');
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
  }
};

// Global variables for feedback reports pagination
let feedbackReportsData = [];
let filteredFeedbackData = [];
let feedbackPage = 1;
let feedbackPerPage = 10;

// Load Feedback Reports
async function loadFeedbackReports() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/feedback-reports', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      feedbackReportsData = data.feedback || [];
      applyFeedbackFilters();
    } else {
      console.error('Error loading feedback reports:', data.message);
      displayFeedbackReports([]);
    }
  } catch (error) {
    console.error('Error loading feedback reports:', error);
    displayFeedbackReports([]);
  }
}

// Apply filters to feedback reports
function applyFeedbackFilters() {
  const searchTerm = document.getElementById('feedbackStudentSearch').value.toLowerCase();
  const dateFrom = document.getElementById('feedbackDateFrom').value;
  const dateTo = document.getElementById('feedbackDateTo').value;
  
  filteredFeedbackData = feedbackReportsData.filter(record => {
    // Search filter
    const matchesSearch = !searchTerm || 
      record.student.toLowerCase().includes(searchTerm) || 
      record.id_number.toLowerCase().includes(searchTerm);
    
    // Date filters
    const recordDate = new Date(record.date);
    const matchesDateFrom = !dateFrom || recordDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || recordDate <= new Date(dateTo + 'T23:59:59');
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });
  
  feedbackPage = 1;
  displayFeedbackReports(filteredFeedbackData);
}

// Display Feedback Reports in table
function displayFeedbackReports(records) {
  const tbody = document.getElementById('feedbackReportsTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('feedbackEntriesSelect');
  feedbackPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = records.length;
  const totalPages = Math.ceil(totalRecords / feedbackPerPage);
  const startIndex = (feedbackPage - 1) * feedbackPerPage;
  const endIndex = Math.min(startIndex + feedbackPerPage, totalRecords);
  const recordsToShow = records.slice(startIndex, endIndex);
  
  // Update total records display
  const totalRecordsEl = document.getElementById('feedbackTotalRecords');
  if (totalRecordsEl) {
    totalRecordsEl.textContent = `Total: ${totalRecords} records`;
  }
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No feedback found</td></tr>';
    updateFeedbackPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach((record, index) => {
    // Format date
    const dateObj = new Date(record.date);
    const date = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Create star rating display
    const stars = '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating);
    
    html += `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${record.student}</td>
        <td>${record.lab}</td>
        <td>${record.purpose}</td>
        <td class="rating-cell"><span class="stars">${stars}</span></td>
        <td class="comment-cell">${record.comment || 'N/A'}</td>
        <td>${date}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateFeedbackPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update feedback pagination info
function updateFeedbackPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('feedbackShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('feedbackCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = feedbackPage;
  }
}

// Pagination functions for feedback
function goToFeedbackFirstPage() {
  feedbackPage = 1;
  displayFeedbackReports(filteredFeedbackData);
}

function goToFeedbackPrevPage() {
  const totalPages = Math.ceil(filteredFeedbackData.length / feedbackPerPage);
  if (feedbackPage > 1) {
    feedbackPage--;
    displayFeedbackReports(filteredFeedbackData);
  }
}

function goToFeedbackNextPage() {
  const totalPages = Math.ceil(filteredFeedbackData.length / feedbackPerPage);
  if (feedbackPage < totalPages) {
    feedbackPage++;
    displayFeedbackReports(filteredFeedbackData);
  }
}

function goToFeedbackLastPage() {
  const totalPages = Math.ceil(filteredFeedbackData.length / feedbackPerPage);
  feedbackPage = totalPages;
  displayFeedbackReports(filteredFeedbackData);
}

// Export Feedback to CSV
function exportFeedbackToCSV() {
  if (filteredFeedbackData.length === 0) {
    alert('No data to export');
    return;
  }
  
  let csv = 'Student,Lab,Purpose,Rating,Comments,Date\n';
  
  filteredFeedbackData.forEach(record => {
    const date = new Date(record.date).toLocaleDateString('en-US');
    csv += `"${record.student}","${record.lab}","${record.purpose}","${record.rating}","${record.comment || 'N/A'}","${date}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `feedback_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Feedback to Excel
function exportFeedbackToExcel() {
  if (filteredFeedbackData.length === 0) {
    alert('No data to export');
    return;
  }
  
  let excel = '<table><tr><th>Student</th><th>Lab</th><th>Purpose</th><th>Rating</th><th>Comments</th><th>Date</th></tr>';
  
  filteredFeedbackData.forEach(record => {
    const date = new Date(record.date).toLocaleDateString('en-US');
    const stars = '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating);
    excel += `<tr><td>${record.student}</td><td>${record.lab}</td><td>${record.purpose}</td><td>${stars}</td><td>${record.comment || 'N/A'}</td><td>${date}</td></tr>`;
  });
  
  excel += '</table>';
  
  const blob = new Blob(['\ufeff', excel], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `feedback_report_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Feedback to PDF (real PDF file generation)
function exportFeedbackToPDF() {
  if (filteredFeedbackData.length === 0) {
    alert('No data to export');
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); // Portrait mode for feedback
    
    // Page Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(106, 13, 173); // Purple theme color
    doc.text("CCS Feedback Report", 14, 18);
    
    // Report Info
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Feedbacks: ${filteredFeedbackData.length}`, 14, 25);
    
    // Table headers and data rows mapping
    const headers = [['#', 'Student Name', 'Lab', 'Purpose', 'Rating', 'Comments', 'Date']];
    const data = filteredFeedbackData.map((record, index) => {
      const dateObj = new Date(record.created_at);
      const date = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      let ratingText = '';
      for (let i = 0; i < 5; i++) {
        ratingText += i < record.rating ? '★' : '☆';
      }
      
      return [
        index + 1,
        record.name,
        record.lab,
        record.purpose,
        `${record.rating}/5 (${ratingText})`,
        record.comments || 'No comments',
        date
      ];
    });
    
    // AutoTable creation
    doc.autoTable({
      head: headers,
      body: data,
      startY: 30,
      theme: 'striped',
      headStyles: {
        fillColor: [106, 13, 173],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        font: 'Helvetica',
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        4: { textColor: [255, 193, 7] }, // Star color styling (Gold)
        5: { cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      margin: { left: 14, right: 14 }
    });
    
    doc.save(`CCS_Feedback_Report_${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while exporting the PDF. Falling back to print menu...');
    printFeedbackReport();
  }
}

// Print Feedback Report
function printFeedbackReport() {
  if (filteredFeedbackData.length === 0) {
    alert('No data to print');
    return;
  }
  
  const printWindow = window.open('', '', 'height=600,width=1200');
  
  let html = `
    <html>
      <head>
        <title>Feedback Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #6a0dad; }
          .report-info { margin-bottom: 20px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #6a0dad; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stars { color: #ffc107; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>CCS Feedback Report</h1>
        <div class="report-info">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${filteredFeedbackData.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Lab</th>
              <th>Purpose</th>
              <th>Rating</th>
              <th>Comments</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  filteredFeedbackData.forEach((record, index) => {
    const date = new Date(record.date).toLocaleDateString('en-US');
    const stars = '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating);
    
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${record.student}</td>
        <td>${record.lab}</td>
        <td>${record.purpose}</td>
        <td class="stars">${stars}</td>
        <td>${record.comment || 'N/A'}</td>
        <td>${date}</td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

// Load Dashboard Leaderboard Preview
async function loadDashboardLeaderboard() {
  const container = document.getElementById('dashboardLeaderboardList');
  if (!container) return;

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const response = await fetch('/api/leaderboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success && data.leaderboard) {
      displayDashboardLeaderboard(data.leaderboard);
    } else {
      container.innerHTML = '<div class="no-announcements">Failed to load leaderboard data</div>';
    }
  } catch (error) {
    console.error('Error loading dashboard leaderboard:', error);
    container.innerHTML = '<div class="no-announcements">Error loading leaderboard data</div>';
  }
}

// Display Leaderboard on Dashboard Preview
function displayDashboardLeaderboard(leaderboard) {
  const container = document.getElementById('dashboardLeaderboardList');
  if (!container) return;

  if (leaderboard.length === 0) {
    container.innerHTML = '<div class="no-announcements">No leaderboard records found</div>';
    return;
  }

  let html = '';
  leaderboard.slice(0, 10).forEach((user, index) => {
    const rank = index + 1;
    let rankBadge = '';
    let borderStyle = '';
    
    if (rank === 1) {
      rankBadge = '🥇';
      borderStyle = 'border-left: 4px solid #ffd700;';
    } else if (rank === 2) {
      rankBadge = '🥈';
      borderStyle = 'border-left: 4px solid #c0c0c0;';
    } else if (rank === 3) {
      rankBadge = '🥉';
      borderStyle = 'border-left: 4px solid #cd7f32;';
    } else {
      rankBadge = `<span style="font-weight: bold; color: #666; width: 20px; display: inline-block;">#${rank}</span>`;
      borderStyle = 'border-left: 4px solid #6a0dad;';
    }

    html += `
      <div class="announcement-item" style="${borderStyle} padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${rankBadge}
          <div>
            <div style="font-weight: 600; color: #333; font-size: 14px;">${escapeHtml(user.name)}</div>
            <div style="font-size: 12px; color: #666;">${escapeHtml(user.course)}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: #6a0dad; font-size: 15px;">${user.totalHours || 0} hrs</div>
          <div style="font-size: 11px; color: #999;">${user.sessions || 0} sessions</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Load Detailed Leaderboard Page
async function loadLeaderboard() {
  const tableBody = document.getElementById('leaderboardTableBody');
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Loading leaderboard data...</td></tr>';
  }

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const response = await fetch('/api/leaderboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success && data.leaderboard) {
      displayLeaderboard(data.leaderboard);
    } else {
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: red;">Failed to load leaderboard data</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error loading detailed leaderboard:', error);
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: red;">Error loading leaderboard data</td></tr>';
    }
  }
}

// Display Detailed Leaderboard Page Table
function displayLeaderboard(leaderboard) {
  const tableBody = document.getElementById('leaderboardTableBody');
  if (!tableBody) return;

  if (leaderboard.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No leaderboard records found</td></tr>';
    return;
  }

  let html = '';
  leaderboard.forEach((user, index) => {
    const rank = index + 1;
    let rankDisplay = '';
    
    if (rank === 1) {
      rankDisplay = '<span style="font-size: 20px; font-weight: bold; color: #ffd700;">🥇 1st</span>';
    } else if (rank === 2) {
      rankDisplay = '<span style="font-size: 18px; font-weight: bold; color: #c0c0c0;">🥈 2nd</span>';
    } else if (rank === 3) {
      rankDisplay = '<span style="font-size: 18px; font-weight: bold; color: #cd7f32;">🥉 3rd</span>';
    } else {
      rankDisplay = `<span style="font-weight: 600; color: #555; padding-left: 8px;">#${rank}</span>`;
    }

    html += `
      <tr>
        <td>${rankDisplay}</td>
        <td><strong>${escapeHtml(user.name || 'N/A')}</strong></td>
        <td><span style="background: #eef2f7; padding: 4px 8px; border-radius: 4px; font-weight: 500;">${escapeHtml(user.course || 'N/A')}</span></td>
        <td><strong style="color: #6a0dad; font-size: 15px;">${user.totalHours || 0} hrs</strong></td>
        <td><span style="color: #555;">${user.sessions || 0} sessions</span></td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}