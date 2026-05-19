document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();
});

// Safe escape HTML function
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadLeaderboard() {
  try {
    const urls = ['/api/leaderboard', '/api/leaderboard'];
    let response = null;
    let errorMsg = '';

    // Attempt to fetch from absolute URL first, then relative fallback
    for (const url of urls) {
      try {
        response = await fetch(url);
        if (response.ok) break;
      } catch (err) {
        errorMsg = err.message;
      }
    }

    if (!response || !response.ok) {
      throw new Error(errorMsg || 'Failed to fetch leaderboard data');
    }

    const data = await response.json();

    if (data.success && data.leaderboard) {
      renderLeaderboard(data.leaderboard);
    } else {
      showErrorState('Failed to fetch leaderboard statistics');
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    showErrorState('Unable to load leaderboard data. Make sure the server is running.');
  }
}

function renderLeaderboard(leaderboard) {
  const restTableBody = document.getElementById('restLeaderboardBody');
  
  if (leaderboard.length === 0) {
    showEmptyState();
    return;
  }

  // Render Podium (Top 3)
  const rank1 = leaderboard[0];
  const rank2 = leaderboard[1];
  const rank3 = leaderboard[2];

  // 1st Place Card
  if (rank1) {
    document.getElementById('rank1-name').textContent = rank1.name ? capitalizeName(rank1.name) : 'No Name';
    document.getElementById('rank1-course').textContent = rank1.course || 'N/A';
    document.getElementById('rank1-hours').textContent = `${rank1.totalHours || 0} hrs`;
  } else {
    document.querySelector('.podium-card.rank-1').style.display = 'none';
  }

  // 2nd Place Card
  if (rank2) {
    document.getElementById('rank2-name').textContent = rank2.name ? capitalizeName(rank2.name) : 'No Name';
    document.getElementById('rank2-course').textContent = rank2.course || 'N/A';
    document.getElementById('rank2-hours').textContent = `${rank2.totalHours || 0} hrs`;
  } else {
    document.querySelector('.podium-card.rank-2').style.display = 'none';
  }

  // 3rd Place Card
  if (rank3) {
    document.getElementById('rank3-name').textContent = rank3.name ? capitalizeName(rank3.name) : 'No Name';
    document.getElementById('rank3-course').textContent = rank3.course || 'N/A';
    document.getElementById('rank3-hours').textContent = `${rank3.totalHours || 0} hrs`;
  } else {
    document.querySelector('.podium-card.rank-3').style.display = 'none';
  }

  // Render Ranks 4-10 in Table
  const restStudents = leaderboard.slice(3);
  if (!restTableBody) return;

  if (restStudents.length === 0) {
    restTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 25px; color: #777;">
          No additional ranks to display yet.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  restStudents.forEach((student, index) => {
    const rank = index + 4;
    html += `
      <tr class="animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.1}s">
        <td><span class="rank-badge-small">#${rank}</span></td>
        <td><strong>${escapeHtml(capitalizeName(student.name || 'N/A'))}</strong></td>
        <td><span class="course-label">${escapeHtml(student.course || 'N/A')}</span></td>
        <td><strong style="color: #6a0dad;">${student.totalHours || 0} hrs</strong></td>
        <td>${student.sessions || 0} sessions</td>
      </tr>
    `;
  });

  restTableBody.innerHTML = html;
}

function showErrorState(message) {
  const restTableBody = document.getElementById('restLeaderboardBody');
  
  // Set all podium elements to error status
  const names = ['rank1-name', 'rank2-name', 'rank3-name'];
  names.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Error';
  });

  if (restTableBody) {
    restTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 25px; color: #dc3545; font-weight: 500;">
          <i class="fa-solid fa-circle-exclamation"></i> ${message}
        </td>
      </tr>
    `;
  }
}

function showEmptyState() {
  const restTableBody = document.getElementById('restLeaderboardBody');
  
  // Set podiums to empty
  const names = ['rank1-name', 'rank2-name', 'rank3-name'];
  names.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'N/A';
  });

  if (restTableBody) {
    restTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 25px; color: #666;">
          <i class="fa-solid fa-folder-open"></i> No sit-in sessions have been recorded yet.
        </td>
      </tr>
    `;
  }
}

// Utility function to capitalize names nicely
function capitalizeName(name) {
  if (!name) return '';
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
