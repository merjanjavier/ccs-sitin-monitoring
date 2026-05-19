// Client-side JavaScript for profile page

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in (by checking localStorage)
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (!userData && !authToken) {
    // Redirect to login if not authenticated
    window.location.href = 'Login.html';
    return;
  }

  // Load user data from localStorage
  loadUserData();

  // Load announcements
  loadAnnouncements();

  // Setup notification dropdown
  setupNotificationDropdown();

  // Setup logout button
  setupLogoutButton();

  // Setup mobile menu toggle
  setupMobileMenu();

  // Setup change photo button - now handled by edit profile modal
  setupChangePhotoButton();

  // Setup edit profile modal
  setupEditProfileModal();

  // Setup navigation between sections
  setupNavigation();

  // Setup history section
  setupHistorySection();

// Setup reservation section
   setupReservationSection();

   // Setup sessions section
   setupSessionsSection();

   // Setup feedback modal
   setupFeedbackModal();
});

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null || localStorage.getItem('userData') !== null;
}

// Load user data from localStorage or server
async function loadUserData() {
  const token = localStorage.getItem('authToken');
  const cachedUserData = localStorage.getItem('userData');
  
  // Try to fetch fresh data from server
  if (token) {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update localStorage with fresh data
          const user = data.user;
          localStorage.setItem('userData', JSON.stringify(user));
          
          // Update student information
          document.getElementById('studentName').textContent = `${user.firstname} ${user.lastname}`;
          document.getElementById('studentCourse').textContent = user.course || 'N/A';
          document.getElementById('studentYear').textContent = user.courseLevel || 'N/A';
          document.getElementById('studentEmail').textContent = user.email || 'N/A';
          document.getElementById('studentAddress').textContent = user.address || 'N/A';
          
          // Set sessions
          document.getElementById('studentSessions').textContent = user.sessions !== undefined ? user.sessions : 30;
          
          // Set profile photo if available
          if (user.photo) {
            document.getElementById('profileImage').src = user.photo;
          } else {
            document.getElementById('profileImage').src = './images/2.jpg';
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }
  
  // Fallback to cached data
  if (cachedUserData) {
    const user = JSON.parse(cachedUserData);
    
    // Update student information
    document.getElementById('studentName').textContent = `${user.firstname} ${user.lastname}` || 'Guest User';
    document.getElementById('studentCourse').textContent = user.course || 'N/A';
    document.getElementById('studentYear').textContent = user.courseLevel || 'N/A';
    document.getElementById('studentEmail').textContent = user.email || 'N/A';
    document.getElementById('studentAddress').textContent = user.address || 'N/A';
    
    // Set sessions
    document.getElementById('studentSessions').textContent = user.sessions !== undefined ? user.sessions : 30;
    
    // Set profile photo if available
    if (user.photo) {
      document.getElementById('profileImage').src = user.photo;
    } else {
      document.getElementById('profileImage').src = './images/2.jpg';
    }
  } else {
    // If no user data, show placeholder
    document.getElementById('studentName').textContent = 'Guest User';
    document.getElementById('studentCourse').textContent = 'N/A';
    document.getElementById('studentYear').textContent = 'N/A';
    document.getElementById('studentEmail').textContent = 'N/A';
    document.getElementById('studentAddress').textContent = 'N/A';
    document.getElementById('studentSessions').textContent = '30';
    document.getElementById('profileImage').src = './images/2.jpg';
  }
}

// Load announcements from server
async function loadAnnouncements() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/announcements', {
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

// Display announcements on profile page
function displayAnnouncements(announcements) {
  const announcementContent = document.getElementById('announcementContainer');
  
  if (!announcementContent) return;
  
  if (announcements.length === 0) {
    announcementContent.innerHTML = '<div class="announcement-item"><div class="announcement-line">No announcements yet</div></div>';
    return;
  }
  
  let html = '';
  announcements.forEach(announcement => {
    // Format date as CCS Admin | 2026-Mar-17
    const date = new Date(announcement.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    html += `
      <div class="announcement-item">
        <div class="announcement-line">CCS Admin | ${formattedDate}</div>
        <div class="announcement-message">${escapeHtml(announcement.content)}</div>
      </div>
    `;
  });
  
  announcementContent.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Setup notification dropdown toggle
function setupNotificationDropdown() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationContent = document.getElementById('notificationContent');

  if (notificationBtn && notificationContent) {
    notificationBtn.addEventListener('click', function(e) {
      e.preventDefault();
      notificationContent.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!notificationBtn.contains(e.target) && !notificationContent.contains(e.target)) {
        notificationContent.classList.remove('show');
      }
    });
  }
}

// Setup logout button functionality
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      logout();
    });
  }
}

// Logout function
function logout() {
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Show logout message
  alert('You have been logged out successfully.');
  
  // Redirect to login page
  window.location.href = 'Login.html';
}

// Setup mobile menu toggle
function setupMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const links = document.querySelector('.links');

  if (menuToggle && links) {
    menuToggle.addEventListener('click', function() {
      links.classList.toggle('active');
    });
  }
}

// Setup change photo button - now handled by edit profile modal
function setupChangePhotoButton() {
  // Photo can only be changed in edit profile modal
}

// Setup edit profile modal
function setupEditProfileModal() {
  const editProfileLink = document.querySelector('a[href="#editprofile"]');
  const modal = document.getElementById('editProfileModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const form = document.getElementById('editProfileForm');
  const editPhotoInput = document.getElementById('editPhotoInput');

  if (!modal) return;

  // Open modal when Edit Profile is clicked
  if (editProfileLink) {
    editProfileLink.addEventListener('click', function(e) {
      e.preventDefault();
      openEditModal();
    });
  }

  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditModal);
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeEditModal();
    }
  });

  // Handle photo change
  if (editPhotoInput) {
    editPhotoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('editProfileImage').src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await saveProfile();
    });
  }
}

// Open edit profile modal and load user data
function openEditModal() {
  const modal = document.getElementById('editProfileModal');
  
  // Get current user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Populate form fields
  document.getElementById('editFirstname').value = userData.firstname || '';
  document.getElementById('editLastname').value = userData.lastname || '';
  document.getElementById('editMiddlename').value = userData.middlename || '';
  document.getElementById('editCourse').value = userData.course || 'BSIT';
  document.getElementById('editCourseLevel').value = userData.courseLevel || '1st Year';
  document.getElementById('editEmail').value = userData.email || '';
  document.getElementById('editAddress').value = userData.address || '';
  
  // Set profile photo
  const profileImage = userData.photo || './images/2.jpg';
  document.getElementById('editProfileImage').src = profileImage;
  
  // Show modal
  if (modal) {
    modal.classList.add('show');
  }
}

// Close edit profile modal
function closeEditModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Save profile changes
async function saveProfile() {
  const token = localStorage.getItem('authToken');
  
  // Get photo data
  const profileImage = document.getElementById('editProfileImage');
  const photoData = profileImage.src;
  
  const userData = {
    firstname: document.getElementById('editFirstname').value,
    lastname: document.getElementById('editLastname').value,
    middlename: document.getElementById('editMiddlename').value,
    course: document.getElementById('editCourse').value,
    courseLevel: document.getElementById('editCourseLevel').value,
    email: document.getElementById('editEmail').value,
    address: document.getElementById('editAddress').value,
    photo: photoData
  };

  console.log('Saving profile data:', userData);

  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server not responding. Please restart the server with "node server.js" and try again.');
    }

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      // Update localStorage with new user data
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUserData = { ...storedUserData, ...userData };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Update displayed user info
      document.getElementById('studentName').textContent = `${userData.firstname} ${userData.lastname}`;
      document.getElementById('studentCourse').textContent = userData.course;
      document.getElementById('studentYear').textContent = userData.courseLevel;
      document.getElementById('studentEmail').textContent = userData.email;
      document.getElementById('studentAddress').textContent = userData.address;
      document.getElementById('profileImage').src = photoData;

      alert('Profile updated successfully!');
      closeEditModal();
    } else {
      alert(data.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Unable to update profile. Please try again. Error: ' + error.message);
  }
}

// Setup navigation between sections
   function setupNavigation() {
     const navLinks = document.querySelectorAll('.nav-link');
     
     navLinks.forEach(link => {
       link.addEventListener('click', function(e) {
         e.preventDefault();
         
         const section = this.getAttribute('data-section');
         
         // Update active link
         navLinks.forEach(l => l.classList.remove('active'));
         this.classList.add('active');
         
         // Show/hide sections
         document.querySelectorAll('.dashboard-section').forEach(s => {
           s.style.display = 'none';
           s.classList.remove('active');
         });
         
         const targetSection = document.getElementById(section + 'Section');
         if (targetSection) {
           targetSection.style.display = 'block';
           targetSection.classList.add('active');
           
           // Load section data
           if (section === 'history') {
             loadHistory();
           } else if (section === 'reservation') {
             loadReservations();
           } else if (section === 'sitinsummary') {
             loadSitInSummary();
           } else if (section === 'sessions') {
             loadSessions();
           } else if (section === 'leaderboard') {
             loadLeaderboard();
           }
         }
       });
     });
   }

// Setup history section
function setupHistorySection() {
  const entriesSelect = document.getElementById('historyEntriesSelect');
  const searchInput = document.getElementById('historyTableSearch');
  
  if (entriesSelect) {
    entriesSelect.addEventListener('change', () => loadHistory());
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', () => loadHistory());
  }
}

// Load history data
async function loadHistory() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/student/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayHistory(data.history || []);
    } else {
      console.error('Error loading history:', data.message);
      displayHistory([]);
    }
  } catch (error) {
    console.error('Error loading history:', error);
    displayHistory([]);
  }
}

// Display history in table
function displayHistory(history) {
  const tableBody = document.getElementById('historyTableBody');
  const searchInput = document.getElementById('historyTableSearch');
  const entriesSelect = document.getElementById('historyEntriesSelect');
  
  if (!tableBody) return;
  
  // Filter by search
  let filteredHistory = history;
  if (searchInput && searchInput.value) {
    const searchTerm = searchInput.value.toLowerCase();
    filteredHistory = history.filter(record => {
      return (
        (record.purpose && record.purpose.toLowerCase().includes(searchTerm)) ||
        (record.lab && record.lab.toLowerCase().includes(searchTerm)) ||
        (record.timeIn && record.timeIn.toLowerCase().includes(searchTerm))
      );
    });
  }
  
  // Get entries per page
  const entriesPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Display entries
  let html = '';
  
  if (filteredHistory.length === 0) {
    html = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No history records found</td></tr>';
  } else {
    filteredHistory.forEach(record => {
      const date = new Date(record.timeIn);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const timeIn = new Date(record.timeIn).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const timeOut = record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';
      
      const feedbackButton = record.status === 'completed' && !record.hasFeedback
        ? `<button class="feedback-btn" onclick="openFeedbackModal(${record.id})">
             <i class="fa-solid fa-comment"></i> Share Feedback
           </button>`
        : record.hasFeedback
          ? '<span style="color: #28a745; font-weight: 600;">✓ Feedback Submitted</span>'
          : '<span style="color: #6c757d;">Pending</span>';
      
      html += `
        <tr>
          <td>${formattedDate}</td>
          <td>${timeIn}</td>
          <td>${timeOut}</td>
          <td>${escapeHtml(record.purpose || 'N/A')}</td>
          <td>${escapeHtml(record.lab || 'N/A')}</td>
          <td>${feedbackButton}</td>
        </tr>
      `;
    });
  }
  
  tableBody.innerHTML = html;
  
  // Update showing entries
  const showingEntries = document.getElementById('historyShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${filteredHistory.length} of ${history.length} entries`;
  }
}

// Setup reservation section
function setupReservationSection() {
  const openBtn = document.getElementById('openReservationBtn');
  const modal = document.getElementById('reservationModal');
  const closeBtn = document.getElementById('closeReservationModal');
  const cancelBtn = document.getElementById('cancelReservationBtn');
  const form = document.getElementById('reservationForm');
  
  // Set minimum date to today
  const dateInput = document.getElementById('reserveDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
  
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('show');
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitReservation();
    });
  }
  
  const reserveLab = document.getElementById('reserveLab');
  const reservePcNumber = document.getElementById('reservePcNumber');
  const labSoftwareContainer = document.getElementById('labSoftwareContainer');
  const labSoftwareList = document.getElementById('labSoftwareList');
  
  if (reserveLab && labSoftwareContainer && labSoftwareList) {
    reserveLab.addEventListener('change', async () => {
      const lab = reserveLab.value;
      if (!lab) {
        labSoftwareContainer.style.display = 'none';
        if (reservePcNumber) {
          reservePcNumber.innerHTML = '<option value="">-- Select PC --</option>';
        }
        return;
      }
      
      // Fetch software listing
      try {
        const response = await fetch(`/api/lab-software?lab=${lab}`);
        const data = await response.json();
        if (data.success && data.software.length > 0) {
          labSoftwareList.innerHTML = data.software.map(sw => `<li>${sw.software_name}</li>`).join('');
          labSoftwareContainer.style.display = 'block';
        } else {
          labSoftwareList.innerHTML = '<li>No software listed for this lab</li>';
          labSoftwareContainer.style.display = 'block';
        }
      } catch (error) {
        console.error('Error fetching software:', error);
      }

      // Fetch and filter PC numbers dynamically
      if (reservePcNumber) {
        reservePcNumber.innerHTML = '<option value="">-- Select PC --</option>';
        try {
          const pcResponse = await fetch('/api/disabled-pcs');
          const pcData = await pcResponse.json();
          if (pcData.success) {
            const disabledPCs = new Set(
              pcData.disabledPCs
                .filter(pc => String(pc.lab) === String(lab))
                .map(pc => parseInt(pc.pc_number))
            );
            for (let i = 1; i <= 49; i++) {
              if (!disabledPCs.has(i)) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `PC ${i}`;
                reservePcNumber.appendChild(option);
              }
            }
          }
        } catch (error) {
          console.error('Error filtering reservation PCs:', error);
          // Fallback to all 49 PCs
          for (let i = 1; i <= 49; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `PC ${i}`;
            reservePcNumber.appendChild(option);
          }
        }
      }
    });
  }
}

// Submit reservation
async function submitReservation() {
  const token = localStorage.getItem('authToken');
  
  const lab = document.getElementById('reserveLab').value;
  const purpose = document.getElementById('reservePurpose').value;
  const date = document.getElementById('reserveDate').value;
  const time = document.getElementById('reserveTime').value;
  const pcNumber = document.getElementById('reservePcNumber').value;
  
  try {
    const response = await fetch('/api/student/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lab, purpose, date, time, pcNumber })
    });
    
    const data = await response.json();
    
    if (response.status === 403) {
      alert(data.message || 'Reservations are currently disabled by the administrator.');
      return;
    }

    if (data.success) {
      alert('Reservation submitted successfully!');
      document.getElementById('reservationModal').classList.remove('show');
      document.getElementById('reservationForm').reset();
      document.getElementById('labSoftwareContainer').style.display = 'none';
      loadReservations();
    } else {
      alert(data.message || 'Failed to create reservation');
    }
  } catch (error) {
    console.error('Error submitting reservation:', error);
    alert('Unable to submit reservation. Please try again.');
  }
}

// Load reservations
async function loadReservations() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/student/reservations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayReservations(data.reservations || []);
    } else {
      console.error('Error loading reservations:', data.message);
      displayReservations([]);
    }
  } catch (error) {
    console.error('Error loading reservations:', error);
    displayReservations([]);
  }
}

// Display reservations
function displayReservations(reservations) {
  const container = document.getElementById('reservationsList');
  
  if (!container) return;
  
  if (reservations.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No reservations yet. Click "New Reservation" to get started!</p>';
    return;
  }
  
  let html = '';
  reservations.forEach(reservation => {
    const date = new Date(reservation.reservation_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const statusClass = `status-${reservation.status}`;
    
    const cancelButton = reservation.status === 'pending'
      ? `<button class="cancel-reservation-btn" onclick="cancelReservation(${reservation.id})">
           <i class="fa-solid fa-times"></i> Cancel Reservation
         </button>`
      : '';
    
    html += `
      <div class="reservation-card">
        <div class="reservation-card-header">
          <span class="reservation-lab">Lab ${escapeHtml(reservation.lab)}</span>
          <span class="reservation-status ${statusClass}">${reservation.status.toUpperCase()}</span>
        </div>
        <div class="reservation-details">
          <div class="reservation-detail">
            <strong>PC Number:</strong> ${reservation.pc_number || 'N/A'}
          </div>
          <div class="reservation-detail">
            <strong>Purpose:</strong> ${escapeHtml(reservation.purpose)}
          </div>
          <div class="reservation-detail">
            <strong>Date:</strong> ${date}
          </div>
          <div class="reservation-detail">
            <strong>Time:</strong> ${reservation.reservation_time}
          </div>
        </div>
        ${cancelButton}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Cancel reservation
async function cancelReservation(reservationId) {
  if (!confirm('Are you sure you want to cancel this reservation?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/student/reservations/${reservationId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Reservation cancelled successfully');
      loadReservations();
    } else {
      alert(data.message || 'Failed to cancel reservation');
    }
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    alert('Unable to cancel reservation. Please try again.');
  }
}

// Setup feedback modal
function setupFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  const closeBtn = document.getElementById('closeFeedbackModal');
  const cancelBtn = document.getElementById('cancelFeedbackBtn');
  const form = document.getElementById('feedbackForm');
  const stars = document.querySelectorAll('.star');
  
  // Star rating
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      document.getElementById('feedbackRating').value = rating;
      
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitFeedback();
    });
  }
}

// Open feedback modal
function openFeedbackModal(sitinId) {
  const modal = document.getElementById('feedbackModal');
  modal.setAttribute('data-sitin-id', sitinId);
  
  // Reset form
  document.getElementById('feedbackForm').reset();
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  
  modal.classList.add('show');
}

// Submit feedback
   async function submitFeedback() {
     const token = localStorage.getItem('authToken');
     const modal = document.getElementById('feedbackModal');
     const sitinId = parseInt(modal.getAttribute('data-sitin-id'));
     const rating = parseInt(document.getElementById('feedbackRating').value);
     const comment = document.getElementById('feedbackComment').value;
     
     if (!rating) {
       alert('Please select a rating');
       return;
     }
     
     try {
       const response = await fetch('/api/student/feedback', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({ sitinId, rating, comment })
       });
       
       const data = await response.json();
       
       if (data.success) {
         alert('Feedback submitted successfully! Thank you for your feedback.');
         modal.classList.remove('show');
         loadHistory(); // Refresh history to show feedback status
       } else {
         alert(data.message || 'Failed to submit feedback');
       }
     } catch (error) {
       console.error('Error submitting feedback:', error);
       alert('Unable to submit feedback. Please try again.');
     }
   }

   // Load Sit-In Summary
   async function loadSitInSummary() {
     try {
       const token = localStorage.getItem('authToken');
       const response = await fetch('/api/student/sessions', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       
       const data = await response.json();
       
       if (data.success && data.sessions) {
         calculateSummaryStats(data.sessions);
       } else {
         calculateSummaryStats([]);
       }
     } catch (error) {
       console.error('Error loading sessions for summary:', error);
       calculateSummaryStats([]);
     }
   }

   // Calculate summary statistics
   function calculateSummaryStats(sessions) {
     const totalHours = document.getElementById('totalHours');
     const numSessions = document.getElementById('numSessions');
     const avgDuration = document.getElementById('avgDuration');
     const longestSession = document.getElementById('longestSession');
     
     if (sessions.length === 0) {
       if (totalHours) totalHours.textContent = '0';
       if (numSessions) numSessions.textContent = '0';
       if (avgDuration) avgDuration.textContent = '0 min';
       if (longestSession) longestSession.textContent = '0 min';
       return;
     }
     
     let totalMinutes = 0;
     let longestDuration = 0;
     
     sessions.forEach(session => {
       if (session.timeIn && session.timeOut) {
         const timeIn = new Date(session.timeIn);
         const timeOut = new Date(session.timeOut);
         const durationMinutes = (timeOut - timeIn) / (1000 * 60);
         totalMinutes += durationMinutes;
         if (durationMinutes > longestDuration) {
           longestDuration = durationMinutes;
         }
       }
     });
     
     const totalHoursValue = Math.round(totalMinutes / 60 * 10) / 10;
     const avgMinutes = Math.round(totalMinutes / sessions.length);
     
     if (totalHours) totalHours.textContent = totalHoursValue;
     if (numSessions) numSessions.textContent = sessions.length;
     if (avgDuration) avgDuration.textContent = avgMinutes + ' min';
     if (longestSession) longestSession.textContent = Math.round(longestDuration) + ' min';
   }

   // Load Sessions
   async function loadSessions() {
     try {
       const token = localStorage.getItem('authToken');
       const response = await fetch('/api/student/sessions', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       
       const data = await response.json();
       
       if (data.success) {
         displaySessions(data.sessions || []);
       } else {
         console.error('Error loading sessions:', data.message);
         displaySessions([]);
       }
     } catch (error) {
       console.error('Error loading sessions:', error);
       displaySessions([]);
     }
   }

   // Display sessions in table
   function displaySessions(sessions) {
     const tableBody = document.getElementById('sessionsTableBody');
     const searchInput = document.getElementById('sessionsTableSearch');
     
     if (!tableBody) return;
     
     // Filter by search
     let filteredSessions = sessions;
     if (searchInput && searchInput.value) {
       const searchTerm = searchInput.value.toLowerCase();
       filteredSessions = sessions.filter(session => {
         return (
           (session.pcNo && session.pcNo.toLowerCase().includes(searchTerm)) ||
           (session.status && session.status.toLowerCase().includes(searchTerm)) ||
           (session.lab && session.lab.toLowerCase().includes(searchTerm))
         );
       });
     }
     
     let html = '';
     
     if (filteredSessions.length === 0) {
       html = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No sessions found</td></tr>';
     } else {
       filteredSessions.forEach(session => {
         const date = new Date(session.timeIn);
         const formattedDate = date.toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'short',
           day: 'numeric'
         });
         
         const timeIn = new Date(session.timeIn).toLocaleTimeString('en-US', {
           hour: '2-digit',
           minute: '2-digit'
         });
         
         const timeOut = session.timeOut ? new Date(session.timeOut).toLocaleTimeString('en-US', {
           hour: '2-digit',
           minute: '2-digit'
         }) : 'N/A';
         
         let duration = 'N/A';
         if (session.timeIn && session.timeOut) {
           const timeInDate = new Date(session.timeIn);
           const timeOutDate = new Date(session.timeOut);
           const durationMinutes = Math.round((timeOutDate - timeInDate) / (1000 * 60));
           const hours = Math.floor(durationMinutes / 60);
           const mins = durationMinutes % 60;
           duration = `${hours}h ${mins}m`;
         }
         
         const pcNo = session.pc_number || 'N/A';
         const status = session.status || 'Active';
         
         html += `
           <tr>
             <td>${formattedDate}</td>
             <td>${timeIn}</td>
             <td>${timeOut}</td>
             <td>${duration}</td>
             <td>${escapeHtml(pcNo)}</td>
             <td>${escapeHtml(status)}</td>
           </tr>
         `;
       });
     }
     
     tableBody.innerHTML = html;
     
     // Update showing entries
     const showingEntries = document.getElementById('sessionsShowingEntries');
     if (showingEntries) {
       showingEntries.textContent = `Showing ${filteredSessions.length} of ${sessions.length} entries`;
     }
   }

   // Setup sessions section
   function setupSessionsSection() {
     const searchInput = document.getElementById('sessionsTableSearch');
     
     if (searchInput) {
       searchInput.addEventListener('input', () => loadSessions());
     }
   }

   // Load Leaderboard
   async function loadLeaderboard() {
     try {
       const token = localStorage.getItem('authToken');
       const response = await fetch('/api/leaderboard', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       
       const data = await response.json();
       
       if (data.success) {
         displayLeaderboard(data.leaderboard || []);
       } else {
         console.error('Error loading leaderboard:', data.message);
         displayLeaderboard([]);
       }
     } catch (error) {
       console.error('Error loading leaderboard:', error);
       displayLeaderboard([]);
     }
   }

   // Display leaderboard in table
   function displayLeaderboard(leaderboard) {
     const tableBody = document.getElementById('leaderboardTableBody');
     
     if (!tableBody) return;
     
     if (leaderboard.length === 0) {
       tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No leaderboard data available</td></tr>';
       return;
     }
     
     let html = '';
     leaderboard.forEach((user, index) => {
       html += `
         <tr>
           <td>${index + 1}</td>
           <td>${escapeHtml(user.name || 'N/A')}</td>
           <td>${escapeHtml(user.course || 'N/A')}</td>
           <td>${(user.totalHours || 0)} hrs</td>
           <td>${user.sessions || 0}</td>
         </tr>
       `;
     });
     
     tableBody.innerHTML = html;
   }
