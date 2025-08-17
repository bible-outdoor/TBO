// =====================
// Admin Dashboard Logic
// =====================
function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem('adminUser'));
  } catch {
    return null;
  }
}


// --- User Data Access Abstraction (Backend API) ---
async function fetchUsers() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/users', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
}
async function addUser(user) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to add user');
  return await res.json();
}
async function updateUser(email, user) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/users/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
}
async function deleteUserByEmail(email) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return await res.json();
}

// --- 3. Utility: Role Checks (no change needed) ---
function isSuperAdmin() {
  const user = getAdminUser();
  return user && user.role === 'superadmin';
}
function isSuperEditor() {
  const user = getAdminUser();
  return user && user.role === 'supereditor';
}
function isSuperAdminOrSuperEditor() {
  const user = getAdminUser();
  return user && (user.role === 'superadmin' || user.role === 'supereditor');
}

// --- Activity Log Section Renderer (Super Admin Only, now uses backend API) ---
async function renderActivityLog() {
  if (!isSuperAdmin()) {
    adminMain.innerHTML = `<div class="section-title">Activity Log</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized.</p>`;
    return;
  }
  let logs = [];
  try {
    logs = await fetchActivityLog();
    logs = logs.slice().reverse(); // Show latest first
  } catch (err) {
    adminMain.innerHTML = `<div class="section-title">Activity Log</div>
      <p style="color: #c0392b;">Failed to load activity log.</p>`;
    return;
  }

  adminMain.innerHTML = `
    <div class="section-title">Activity Log</div>
    <div class="section-actions" style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:gray;">Showing ${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}.</span>
      <button onclick="clearActivityLog()" class="danger-btn" ${logs.length === 0 ? 'disabled' : ''}>Clear Log</button>
    </div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${
            logs.length === 0
              ? `<tr><td colspan="5" style="color:gray;text-align:center;">No activity yet.</td></tr>`
              : logs.map(log => `
                <tr>
                  <td>${new Date(log.timestamp).toLocaleString()}</td>
                  <td>${log.user || '-'}</td>
                  <td>${log.role || '-'}</td>
                  <td>${log.action}</td>
                  <td>${log.details || ''}</td>
                </tr>
              `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- Log Activity Utility ---
async function logActivity(action, details = '') {
  const session = getAdminSession && getAdminSession();
  await fetch('https://tbo-qyda.onrender.com/api/activitylog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      user: session?.email || 'Unknown',
      role: session?.role || '-',
      action,
      details,
    })
  });
}
// --- Clear Activity Log Utility ---
async function clearActivityLog() {
  showPopup(
    "Are you sure you want to clear the entire activity log? This cannot be undone.",
    {
      confirm: true,
      okText: "Clear All",
      cancelText: "Cancel",
      onOk: async function () {
        await fetch('https://tbo-qyda.onrender.com/api/activitylog/clear', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + getAdminToken() }
        });
        renderActivityLog();
        showNotification("Activity log cleared.");
      }
    }
  );
}

// --- 4. Popup and Notification Helpers ---
function showPopup(message, options = {}) {
  // Remove any open popup
  const existing = document.getElementById('custom-popup');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.id = 'custom-popup';

  // Modal box
  const modal = document.createElement('div');
  modal.className = 'popup-modal';

  // Content
  modal.innerHTML = `
    <div class="popup-message">${message}</div>
    <div class="popup-actions"></div>
  `;

  const actions = modal.querySelector('.popup-actions');
  if (options.confirm) {
    // Confirm dialog
    const okBtn = document.createElement('button');
    okBtn.textContent = options.okText || 'OK';
    okBtn.className = 'popup-btn';
    okBtn.onclick = () => {
      overlay.remove();
      options.onOk && options.onOk();
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = options.cancelText || 'Cancel';
    cancelBtn.className = 'popup-btn popup-cancel';
    cancelBtn.onclick = () => {
      overlay.remove();
      options.onCancel && options.onCancel();
    };
    actions.appendChild(okBtn);
    actions.appendChild(cancelBtn);
  } else {
    // Info dialog
    const closeBtn = document.createElement('button');
    closeBtn.textContent = options.okText || 'Close';
    closeBtn.className = 'popup-btn';
    closeBtn.onclick = () => overlay.remove();
    actions.appendChild(closeBtn);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on ESC
  const escListener = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener('keydown', escListener);
    }
  };
  document.addEventListener('keydown', escListener);
}

function showNotification(message, duration = 3000) {
  const notification = document.getElementById('admin-notification');
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}


// --- 5. Authentication Logic (Backend) ---
async function authenticateUser(email, password) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pass: password })
  });
  const data = await res.json();
  if (!data.success) return { success: false, message: data.message };
  setAdminSession(data.token, data.user);
  return { success: true, user: data.user, token: data.token };
}

// --- Invitation token login logic ---
document.addEventListener("DOMContentLoaded", function() {
  // ...existing code...
});
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const loginForm = document.getElementById('adminLoginForm');
  const loginMsg = document.getElementById('adminLoginMsg');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPass').value;

      // Prepare login payload
      let payload;
      let loginUrl;
      if (token) {
        // Onboarding login (invitation)
        payload = { email, password, token };
        loginUrl = 'https://tbo-qyda.onrender.com/api/users/admin/login';
      } else {
        // Normal login
        payload = { email, pass: password };
        loginUrl = 'https://tbo-qyda.onrender.com/api/auth/login';
      }

      try {
        const res = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          loginMsg.textContent = data.message || "Login failed.";
          loginMsg.style.color = "#c0392b";
          return;
        }
        setAdminSession(data.token, data.user);
        if (data.user.mustChangePassword) {
          window.location.href = "change-password.html";
        } else {
        window.location.href = "dashboard.html";
        }
      } catch (err) {
        loginMsg.textContent = "Network error. Please try again.";
        loginMsg.style.color = "#c0392b";
      }
    });
  }
});

// --- 6. Session Management ---
function setAdminSession(token, user) {
  // Store only the token for backend auth
  localStorage.setItem('adminToken', token);
  // Optionally, store user info for UI display
  localStorage.setItem('adminUser', JSON.stringify(user));
  // Show logout button immediately
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) logoutBtn.style.display = 'block';
}
function getAdminToken() {
  return localStorage.getItem('adminToken');
}
function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('adminUser'));
  } catch { return null; }
}
function clearAdminSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}

// --- 7. Require Auth for Protected Pages ---
function requireAdminAuth(redirectTo = "login.html") {
  if (!getAdminToken()) {
    window.location = redirectTo;
  }
}

// --- 8. DOMContentLoaded: Login, Sidebar, User Info, Sidebar Restriction ---
document.addEventListener("DOMContentLoaded", function() {
  // Sidebar Activity Log link: only for superadmin
  const user = getAdminUser();
  const navUl = document.querySelector('#adminSidebar nav ul');
  if (user && user.role === 'superadmin') {
    if (navUl && !navUl.querySelector('a[href="#activitylog"]')) {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#activitylog" class="nav-link">Activity Log</a>`;
      navUl.appendChild(li);
    }
  } else {
    const logLink = document.querySelector('#adminSidebar a[href="#activitylog"]');
    if (logLink) logLink.parentElement.remove();
  }

  // --- Testimonies link injection for superadmin/supereditor ---
  // Remove any existing Testimonies link to avoid duplicates
  const oldTestimonyLink = navUl && navUl.querySelector('a[href="#testimonies"]');
  if (oldTestimonyLink) oldTestimonyLink.parentElement.remove();
  if (user && (user.role === 'superadmin' || user.role === 'supereditor')) {
    // Find Contacts link to insert after
    const contactsLi = navUl && navUl.querySelector('a[href="#contacts"]');
    if (contactsLi) {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#testimonies" class="nav-link">Testimonies</a>`;
      // Insert after Contacts
      contactsLi.parentElement.insertAdjacentElement('afterend', li);
    }
  }

  // Handle login form
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.onsubmit = async function(e) {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value.trim().toLowerCase();
      const pass = document.getElementById('adminPass').value;
      const loginMsg = document.getElementById('adminLoginMsg');
      loginMsg.textContent = '';
      document.getElementById('formBtn').disabled = true;
      try {
        // --- Use backend API for authentication ---
        const res = await fetch('https://tbo-qyda.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, pass })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Invalid credentials");
        // Store token and user info for session
        setAdminSession(data.token, data.user);
        if (data.user.mustChangePassword) {
          window.location.href = "change-password.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } catch (err) {
        loginMsg.textContent = err.message || "Login failed.";
        loginMsg.style.color = "#c0392b";
        document.getElementById('formBtn').disabled = false;
      }
    };
  } else {
    // Not on login page, protect dashboard
    requireAdminAuth();
  }

  // Show logged-in admin's name and role in the UI
  if (user) {
    // Show name
    const name = user.email ? user.email.split('@')[0] : '';
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    let role = user.role === "superadmin" ? "SUPERADMIN" : 
               user.role === "supereditor" ? "SUPEREDITOR" : 
               "EDITOR";
    if (document.getElementById('adminNameLabel')) {
      document.getElementById('adminNameLabel').textContent = displayName;
    }
    if (document.getElementById('adminRoleLabel')) {
      document.getElementById('adminRoleLabel').textContent = role;
    }

    // Sidebar link restrictions
    // Only superadmin sees User Manager and Site Settings
    if (user.role !== 'superadmin') {
      document.querySelectorAll('.nav-link[href="#users"], .nav-link[href="#settings"]').forEach(el => el.style.display = "none");
    }
    // Only superadmin and supereditor see Library, Contacts, Donation, and Product Manager
    if (user.role !== 'superadmin' && user.role !== 'supereditor') {
      document.querySelectorAll(
        '.nav-link[href="#training"], .nav-link[href="#contacts"], .nav-link[href="#donation"], .nav-link[href="#products"]'
      ).forEach(el => el.style.display = "none");
    }
  }

  // Always show logout button if logged in
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    if (user) {
      logoutBtn.style.display = 'block';
    } else {
      logoutBtn.style.display = 'none';
    }
  }

  renderSection(); // Render initial
});
// --- 9. Logout Handler ---
async function logoutAdmin() {
  const user = getAdminUser();
  if (user) await logActivity("Logout", `User: ${user.email}`);
  clearAdminSession();
  window.location = "login.html";
}
window.logoutAdmin = logoutAdmin;

// --- 10. Section Routing Logic ---
let currentSection = window.location.hash.replace('#','') || 'overview';
const sidebarLinks = document.querySelectorAll('.nav-link');
const adminMain = document.getElementById('adminMain');

function setActiveNav() {
  // Re-query all nav links, including dynamically injected ones
  const allSidebarLinks = document.querySelectorAll('.nav-link');
  allSidebarLinks.forEach(link => {
    let linkHash = link.getAttribute('href').replace('#','').toLowerCase();
    link.classList.toggle('active', linkHash === currentSection.toLowerCase());
  });
}

window.onhashchange = () => {
  currentSection = location.hash.replace('#','') || 'overview';
  renderSection();
};
setActiveNav();

// --- 11. Dark/Light Mode ---
function setMode(dark, log = false) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  updateModeBtn();
  if (log) logActivity("Toggled Theme", dark ? "Dark mode" : "Light mode");
}
function updateModeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('modeToggle').innerHTML = isDark ? '🌙' : '☀️';
}
function initMode() {
  const mode = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setMode(mode === 'dark');
}
document.getElementById('modeToggle').onclick = () =>
  setMode(document.documentElement.getAttribute('data-theme') !== 'dark', true); // Only log on user click
initMode();

// --- 12. Sidebar Responsive Toggle ---
document.getElementById('sidebarToggle').onclick = function() {
  document.getElementById('adminSidebar').classList.toggle('show');
};

// --- 13. Section Renderers ---
// (All section renderers from renderOverview to renderSettings, with access control where required)
// 1. Dashboard Overview
async function renderOverview() {
  showLoader();
  try {
  let userCount = "-";
  let users = [];
  try {
    if (isSuperAdmin()) {
      users = await fetchUsers();
      userCount = Array.isArray(users) ? users.length : Object.keys(users).length;
    }
  } catch {
    userCount = "-";
  }
  let verses = [];
    try { verses = await fetchSermonVerses(); } catch { verses = []; }
  let products = [];
    try { products = await fetchProducts(); } catch { products = []; }
  let media = [];
    try { media = await fetchMediaArchive(); } catch { media = []; }
  let logs = [];
    try { logs = await fetchDonationLogs(); } catch { logs = []; }
  const totalDonations = logs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
  const user = getAdminUser();
  const showDonationCard = user && (user.role === "superadmin" || user.role === "supereditor");
  adminMain.innerHTML = `
    <div class="section-title">Dashboard Overview</div>
    <div class="admin-stats">
      <div class="admin-stat" title="Registered Users">
        <span class="stat-icon">👥</span>
        <div class="stat-label">Registered Users</div>
        <div class="stat-value">${userCount}</div>
      </div>
      <div class="admin-stat" title="Products">
        <span class="stat-icon">🛒</span>
        <div class="stat-label">Products</div>
        <div class="stat-value">${products.length}</div>
      </div>
      <div class="admin-stat" title="Sermon Verses">
        <span class="stat-icon">📖</span>
        <div class="stat-label">Sermon Verses</div>
        <div class="stat-value">${verses.length}</div>
      </div>
      <div class="admin-stat" title="Archived Media">
        <span class="stat-icon">🎬</span>
        <div class="stat-label">Archived Media</div>
        <div class="stat-value">${media.length}</div>
      </div>
      ${showDonationCard ? `
      <div class="admin-stat" title="Total Donations">
        <span class="stat-icon">💰</span>
        <div class="stat-label">Total Donations</div>
        <div class="stat-value">Ksh ${totalDonations.toLocaleString()}</div>
      </div>
      ` : ""}
    </div>
    <div class="section-actions">
      <a href="#sermons" class="btn">Manage Sermons</a>
      <a href="#products" class="btn">Manage Products</a>
      <a href="#media" class="btn">Media Archive</a>
      <a href="#events" class="btn">Events</a>
      <a href="#users" class="btn">Users</a>
      <a href="#settings" class="btn">Site Settings</a>
    </div>
  `;
  } finally {
    hideLoader();
  }
}
// ...rest of your render* functions here (refactor each to use async data access)...

// --- Sermon Data Access Abstraction ---
async function fetchSermonVerses() {
  // Later: Replace with backend API call
  return getLS('sermonVerses', []);
}
async function saveSermonVerses(verses) {
  // Later: Replace with backend API call
  setLS('sermonVerses', verses);
}

// --- Sermon Data Access Abstraction (Backend API) ---
async function fetchSermonVerses() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/sermons', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch sermons');
  return await res.json();
}
async function saveSermonVerses(verses) {
  // Not used anymore; use add, update, and delete functions below
}

// Add a new sermon
async function addSermon(sermon) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/sermons', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(sermon)
  });
  if (!res.ok) throw new Error('Failed to add sermon');
  return await res.json();
}

// Update a sermon by ID
async function updateSermon(id, sermon) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/sermons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(sermon)
  });
  if (!res.ok) throw new Error('Failed to update sermon');
  return await res.json();
}

// Delete a sermon by ID
async function deleteSermonById(id) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/sermons/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete sermon');
  return await res.json();
}

// 2. Sermon Manager
async function renderSermons() {
  showLoader();
  try {
  const verses = await fetchSermonVerses();
  adminMain.innerHTML = `
    <div class="section-title">Sermon Verses</div>
    <div class="section-actions">
      <button onclick="showVerseForm()">Add New Verse</button>
    </div>
    <div id="verseFormWrap"></div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead><tr>
          <th>Type</th><th>Title</th><th>Reference</th><th>Verse</th><th>Teaching</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${verses.map((v,i)=>`
            <tr>
              <td>${v.type}</td>
              <td>${v.title}</td>
              <td>${v.ref}</td>
              <td>${v.verse}</td>
              <td>${v.teaching}</td>
              <td class="admin-table-actions">
                <button onclick="showVerseForm('${v._id}')">Edit</button>
                <button onclick="deleteSermon('${v._id}')" class="danger-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  } finally {
    hideLoader();
  }
}

async function showVerseForm(id) {
  showLoader();
  try {
  const verses = await fetchSermonVerses();
  const v = id ? verses.find(s => s._id === id) : { type: 'Daily', title: '', ref: '', verse: '', teaching: '' };

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  formModal = document.createElement('div');
  formModal.className = 'form-modal';

  formModal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="verseForm">
      <h3 id="formTitle">${id ? 'Edit' : 'Add'} Verse</h3>
      <div class="form-row">
        <label>Type:</label>
        <select name="type">
          <option value="Daily" ${v.type === 'Daily' ? 'selected' : ''}>Daily</option>
          <option value="Weekly" ${v.type === 'Weekly' ? 'selected' : ''}>Weekly</option>
        </select>
      </div>
      <div class="form-row"><label>Title:</label><input name="title" required value="${v.title}"></div>
      <div class="form-row"><label>Reference:</label><input name="ref" required value="${v.ref}"></div>
      <div class="form-row"><label>Verse:</label><textarea name="verse" required>${v.verse}</textarea></div>
      <div class="form-row"><label>Teaching:</label><textarea name="teaching">${v.teaching || ''}</textarea></div>
      <button type="submit">${id ? 'Update' : 'Add'}</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;

  overlay.appendChild(formModal);
  document.body.appendChild(overlay);

  document.getElementById('verseForm').onsubmit = async function (e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const nv = {
      type: f.type.value,
      title: f.title.value,
      ref: f.ref.value,
      verse: f.verse.value,
      teaching: f.teaching.value
    };
      if (id) {
        await updateSermon(id, nv);
        await logActivity("Edited Sermon", `Title: ${nv.title}`);
      } else {
        await addSermon(nv);
        await logActivity("Added Sermon", `Title: ${nv.title}`);
      }
      closeForm();
      renderSermons();
      } finally {
        hideLoader();
    }
  };
  } finally {
    hideLoader();
  }
}

async function deleteSermon(id) {
  showLoader();
  try {
  const verses = await fetchSermonVerses();
  const sermon = verses.find(s => s._id === id);
  if (!sermon) return;
  showPopup(`Delete this sermon: <b>${sermon.title || 'Untitled Sermon'}</b>? This cannot be undone.`, {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function() {
      try {
        await deleteSermonById(id);
        await logActivity("Deleted Sermon", `Title: ${sermon.title}`);
        closeForm();
        renderSermons();
        showNotification("Sermon deleted.");
      } catch (err) {
        showNotification("Failed to delete sermon.");
      }
    }
  });
  } finally {
    hideLoader();
  }
}

// 3. Sunday Service Control (Backend API)
async function fetchSundayService() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/settings/sunday', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch Sunday Service settings');
  return await res.json();
}
async function saveSundayService(data) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/settings/sunday', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to save Sunday Service settings');
  return await res.json();
}

async function renderSunday() {
  const svc = await fetchSundayService();
  adminMain.innerHTML = `
    <div class="section-title">Sunday Service Control</div>
    <form id="sundayForm" style="background:var(--surface);padding:1em 1.2em;border-radius:10px;max-width:400px;">
      <div class="form-row"><label>YouTube Link:</label>
        <input name="youtube" value="${svc.youtube || ''}" style="width:100%;">
      </div>
      <div class="form-row"><label>Status:</label>
        <select name="live">
          <option value="true"${svc.live ? ' selected' : ''}>Live</option>
          <option value="false"${!svc.live ? ' selected' : ''}>Ended</option>
        </select>
      </div>
      <button type="submit">Save</button>
    </form>
  `;
  document.getElementById('sundayForm').onsubmit = async function(e){
    e.preventDefault();
    const f = e.target;
    const data = {youtube: f.youtube.value, live: f.live.value === 'true'};
    await saveSundayService(data);
    window.dispatchEvent(new Event('sundayServiceUpdated'));
    renderSunday();
    showPopup("Sunday Service settings saved!");
  };
}

// --- Library Data Access Abstraction (Backend API) ---
async function fetchLibraryItems() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/library', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch library items');
  return await res.json();
}
// ...existing code...

// Add new library item (with file/cover upload)
async function addLibraryItem(item, file, cover) {
  const formData = new FormData();
  formData.append('title', item.title);
  formData.append('description', item.description);
  formData.append('type', item.type);
  formData.append('date', item.date);
  if (file) formData.append('file', file);
  if (cover) formData.append('cover', cover);

  const res = await fetch('https://tbo-qyda.onrender.com/api/library/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getAdminToken() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to add library item');
  return await res.json();
}

// Update library item (with file/cover upload)
async function updateLibraryItem(id, item, file, cover) {
  const formData = new FormData();
  formData.append('title', item.title);
  formData.append('description', item.description);
  formData.append('type', item.type);
  formData.append('date', item.date);
  if (file) formData.append('file', file);
  if (cover) formData.append('cover', cover);

  const res = await fetch(`https://tbo-qyda.onrender.com/api/library/${id}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + getAdminToken() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to update library item');
  return await res.json();
}
// ...existing code...

async function deleteLibraryItemById(id) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/library/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete library item');
  return await res.json();
}

// Add this helper to open a preview modal for library files
function openLibraryFileModal(fileUrl, type, title) {
  // Remove any existing modal
  const existing = document.getElementById('library-file-modal');
  if (existing) existing.remove();

  // Helper to detect if file is a PDF
  function isPdf(url) {
    return url && url.toLowerCase().endsWith('.pdf');
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  overlay.id = 'library-file-modal';

  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.style.maxWidth = '90vw';
  modal.style.width = 'min(600px, 98vw)';

  let previewHtml = '';
  if (type === 'pdf' || isPdf(fileUrl)) {
    // Try Google Docs Viewer for PDF preview
    previewHtml = `<iframe src="https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true" style="width:100%;height:60vh;border:none;"></iframe>`;
  } else if (type === 'video') {
    previewHtml = `<video src="${fileUrl}" controls style="width:100%;max-height:60vh;"></video>`;
  } else if (type === 'audio') {
    previewHtml = `<audio src="${fileUrl}" controls style="width:100%;"></audio>`;
  } else if (type === 'img' || type === 'image') {
    previewHtml = `<img src="${fileUrl}" alt="${title}" style="max-width:100%;max-height:60vh;" />`;
  } else {
    previewHtml = `<a href="${fileUrl}" target="_blank">Open File</a>`;
  }

  modal.innerHTML = `
    <button class="close-btn" onclick="document.getElementById('library-file-modal').remove()">×</button>
    <h3 style="margin-bottom:1em;">${title || 'Preview'}</h3>
    <div style="text-align:center; margin-bottom:1.2em;">
      ${previewHtml}
    </div>
    <a href="${fileUrl}" download class="media-btn" style="margin-top:1em;">Download</a>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// Patch renderLibrary to use the modal for View/Download
async function renderLibrary() {
  showLoader();
  try {
  if (!isSuperAdminOrSuperEditor()) {
    adminMain.innerHTML = `<div class="section-title">Training & Learning Library</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized. Only Super Admin and Super Editor can access this section.</p>`;
    return;
  }
  const items = await fetchLibraryItems();
  adminMain.innerHTML = `
    <div class="section-title">Training & Learning Library</div>
    <div class="section-actions">
      <button onclick="showLibraryForm()">Add Resource</button>
    </div>
    <div style="margin-bottom:1.2em;">
      <label><b>Filter by:</b></label>
      <div id="libraryFormWrap"></div>
      <select id="library-filter" style="padding:0.5em 1em;border-radius:1em;">
        <option value="all">All</option>
        <option value="pdf">PDFs</option>
        <option value="video">Videos</option>
        <option value="audio">Audios</option>
      </select>
    </div>
    <div class="media-grid" id="library-grid"></div>
  `;

  function renderLibGrid(type = "all") {
    let libGrid = document.getElementById('library-grid');
    libGrid.innerHTML = "";
    let filtered = items.filter(
      i => type === "all" || i.type === type
    );
    if (filtered.length === 0) {
      libGrid.innerHTML = `<p style="color:gray;text-align:center;">No items found for this filter.</p>`;
      return;
    }
    filtered.forEach((it) => {
      const card = document.createElement("div");
      card.className = "media-card";
      card.innerHTML = `
        <img src="${it.cover}" alt="${it.title}" class="media-img">
        <h4>${it.title}</h4>
        <p class="media-desc">${it.description}</p>
        <div class="media-meta">${it.type.toUpperCase()} | <span style="color:gray;">${it.date||""}</span></div>
          <button class="media-btn" onclick="openLibraryFileModal('${it.file}','${it.type}','${it.title.replace(/'/g, "&#39;") || ''}')">View / Download</button>
        <div style="margin-top:.4em;">
          <button onclick="showLibraryForm('${it._id}')">Edit</button>
          <button onclick="deleteLibraryItem('${it._id}')" class="danger-btn">Delete</button>
        </div>
      `;
      libGrid.appendChild(card);
    });
  }

  renderLibGrid();

  document.getElementById('library-filter').onchange = function() {
    renderLibGrid(this.value);
  };
  } finally {
    hideLoader();
  }
}

async function showLibraryForm(id) {
  showLoader();
  try {
  const items = await fetchLibraryItems();
  const it = id ? items.find(x => x._id === id) : {
    title: "", description: "", type: "pdf", cover: "", file: "", date: new Date().toISOString().slice(0, 10)
  };

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  formModal = document.createElement('div');
  formModal.className = 'form-modal';

  formModal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="libraryForm">
      <h3 id="formTitle">${id ? 'Edit' : 'Add'} Resource</h3>
      <div class="form-row"><label>Title:</label><input name="title" required value="${it.title}"></div>
      <div class="form-row"><label>Description:</label><textarea name="description" required>${it.description}</textarea></div>
      <div class="form-row">
        <label>Type:</label>
        <select name="type">
          <option value="pdf" ${it.type === 'pdf' ? 'selected' : ''}>PDF</option>
          <option value="video" ${it.type === 'video' ? 'selected' : ''}>Video</option>
          <option value="audio" ${it.type === 'audio' ? 'selected' : ''}>Audio</option>
        </select>
      </div>
      <div class="form-row"><label>Date:</label><input name="date" type="date" required value="${it.date}"></div>
      <div class="form-row"><label>Cover Image:</label><input type="file" name="cover"${id == null ? ' required' : ''}></div>
      ${it.cover ? `<div class="form-row"><img src="${it.cover}" class="img-preview"></div>` : ""}
      <div class="form-row"><label>File (URL or Upload):</label><input name="fileUrl" value="${it.file || ''}" placeholder="Paste URL or upload file below"></div>
      <div class="form-row"><input type="file" name="file"></div>
      <button type="submit">${id ? 'Update' : 'Add'}</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;

  overlay.appendChild(formModal);
  document.body.appendChild(overlay);

  // ...inside showLibraryForm...
  document.getElementById('libraryForm').onsubmit = async function (e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const item = {
      title: f.title.value,
      description: f.description.value,
      type: f.type.value,
      date: f.date.value
    };
    const file = f.file.files[0];
    const cover = f.cover.files[0];

      if (id) {
        await updateLibraryItem(id, item, file, cover);
        logActivity("Edited Resource", `Title: ${item.title}`);
      } else {
        await addLibraryItem(item, file, cover);
        logActivity("Added Resource", `Title: ${item.title}`);
      }
      closeForm();
      renderLibrary();
      } finally {
        hideLoader();
    }
  };
  // ...existing code...
  } finally {
    hideLoader();
  }
}

async function deleteLibraryItem(id) {
  showLoader();
  try {
  const items = await fetchLibraryItems();
  const item = items.find(x => x._id === id);
  if (!item) return;
  showPopup(`Delete this resource: <b>${item.title || 'Untitled Resource'}</b>? This cannot be undone.`, {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function() {
      await deleteLibraryItemById(id);
      closeForm();
      renderLibrary();
      showNotification("Resource deleted.");
      logActivity("Deleted Resource", `Title: ${item.title}`);
    }
  });
  } finally {
    hideLoader();
  }
}

// --- Media Archive Data Access Abstraction (Backend API) ---
async function fetchMediaArchive() {
  const token = getAdminToken();
  if (!token) {
    console.error("No admin token found in localStorage.");
    throw new Error('Not authenticated');
  }
  // Debug: Log token and headers
  console.log("fetchMediaArchive: Using token:", token);
  const res = await fetch('https://tbo-qyda.onrender.com/api/media', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) {
    console.error("fetchMediaArchive: Response not OK", res.status, await res.text());
    throw new Error('Failed to fetch media archive');
  }
  return await res.json();
}
async function addMediaItem(item) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to add media item');
  return await res.json();
}
async function updateMediaItem(id, item) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/media/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to update media item');
  return await res.json();
}
async function deleteMediaItemById(id) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/media/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete media item');
  return await res.json();
}

// 4. Media Archive Manager (Backend API)
async function renderMedia() {
  showLoader();
  try {
  const media = await fetchMediaArchive();
  adminMain.innerHTML = `
    <div class="section-title">Media Archive</div>
    <div class="section-actions">
      <button onclick="showMediaForm()">Add New Media</button>
    </div>
    <div id="mediaFormWrap"></div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Type</th><th>Preview</th><th>Title</th><th>Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${media.map(m => `
            <tr>
              <td>${m.type}</td>
              <td>${m.type === 'img' ? `<img src="${m.data}" class="img-preview">` : `<video src="${m.data}" class="video-preview" controls></video>`}</td>
              <td>${m.title}</td>
              <td>${m.date}</td>
              <td class="admin-table-actions">
                <button onclick="showMediaForm('${m._id}')">Edit</button>
                <button onclick="deleteMedia('${m._id}')" class="danger-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  } finally {
    hideLoader();
  }
}

async function showMediaForm(id) {
  showLoader();
  try {
  const media = await fetchMediaArchive();
  const m = id ? media.find(x => x._id === id) : { type: 'img', title: '', date: '', data: '' };

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  formModal = document.createElement('div');
  formModal.className = 'form-modal';

  formModal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="mediaForm" enctype="multipart/form-data">
      <h3 id="formTitle">${id ? 'Edit' : 'Add'} Media</h3>
      <div class="form-row">
        <label>Type:</label>
        <select name="type">
          <option value="img" ${m.type === 'img' ? 'selected' : ''}>Image</option>
          <option value="video" ${m.type === 'video' ? 'selected' : ''}>Video</option>
          <option value="audio" ${m.type === 'audio' ? 'selected' : ''}>Audio</option>
        </select>
      </div>
      <div class="form-row"><label>Title:</label><input name="title" required value="${m.title}"></div>
      <div class="form-row"><label>Date:</label><input name="date" required type="date" value="${m.date}"></div>
      <div class="form-row"><label>Upload:</label><input type="file" name="file"${id == null ? ' required' : ''} accept="image/*,video/*,audio/*"></div>
      <div id="mediaPreviewRow" class="form-row">
        ${
          m.data
            ? (m.type === 'img'
                ? `<img src="${m.data}" class="img-preview">`
                : m.type === 'audio'
                  ? `<audio src="${m.data}" class="audio-preview" controls></audio>`
                  : `<video src="${m.data}" class="video-preview" controls></video>`)
            : ''
        }
      </div>
      <button type="submit">${id ? 'Update' : 'Add'}</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;

  overlay.appendChild(formModal);
  document.body.appendChild(overlay);

  // Preview and crop selected image
  const fileInput = formModal.querySelector('input[name="file"]');
  const typeInput = formModal.querySelector('select[name="type"]');
  const previewRow = formModal.querySelector('#mediaPreviewRow');
  let croppedImageBlob = null;
  if (fileInput) {
    fileInput.onchange = function () {
      previewRow.innerHTML = '';
      if (fileInput.files.length) {
        const file = fileInput.files[0];
        const type = typeInput.value;
        if (type === 'img') {
          showCropperModal(file, function(croppedBlob) {
            croppedImageBlob = croppedBlob;
            previewRow.innerHTML = `<img src="${URL.createObjectURL(croppedBlob)}" class="img-preview">`;
          });
        } else if (type === 'audio') {
          previewRow.innerHTML = `<audio src="${URL.createObjectURL(file)}" class="audio-preview" controls></audio>`;
        } else {
          previewRow.innerHTML = `<video src="${URL.createObjectURL(file)}" class="video-preview" controls></video>`;
        }
      }
    };
  }
  document.getElementById('mediaForm').onsubmit = async function (e) {
    e.preventDefault();
    showLoader();
    try {
      const f = e.target;
      const type = f.type.value, title = f.title.value, date = f.date.value;
      let fileToUpload = null;
      if (fileInput.files.length && typeInput.value === 'img' && croppedImageBlob) {
        fileToUpload = croppedImageBlob;
      } else if (fileInput.files.length) {
        fileToUpload = fileInput.files[0];
      }
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', type);
        formData.append('title', title);
        formData.append('date', date);
        const url = id
          ? `https://tbo-qyda.onrender.com/api/media/${id}`
          : 'https://tbo-qyda.onrender.com/api/media/upload';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { Authorization: 'Bearer ' + getAdminToken() },
          body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
        logActivity(id ? "Edited Media" : "Added Media", `Title: ${title}`);
        closeForm();
        renderMedia();
        window.dispatchEvent(new Event('mediaArchiveUpdated'));
      } else if (id) {
        // No file change, just update metadata
        await updateMediaItem(id, { type, title, date, data: m.data, public_id: m.public_id });
        logActivity("Edited Media", `Title: ${title}`);
        closeForm();
        renderMedia();
        window.dispatchEvent(new Event('mediaArchiveUpdated'));
      }
    } finally {
      hideLoader();
    }
  };
  } finally {
    hideLoader();
  }
}

async function deleteMedia(id) {
  showLoader();
  try {
    const media = await fetchMediaArchive();
    const m = media.find(x => x._id === id);
    if (!m) return;

    showPopup(`Delete media: <b>${m.title || 'Untitled Media'}</b>? This cannot be undone.`, {
      confirm: true,
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async function () {
        await deleteMediaItemById(id);
        logActivity("Deleted Media", `Title: ${m.title}`);
        renderMedia();
        showNotification("Media deleted.");
      }
    });
  } finally {
    hideLoader();
  }
}

// --- Event Data Access Abstraction (Backend API) ---
async function fetchEvents() {
  showLoader();
  try {
  const res = await fetch('https://tbo-qyda.onrender.com/api/events', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return await res.json();
  } finally {
    hideLoader();
}
}
async function addEvent(event, file) {
  showLoader();
  try {
  const formData = new FormData();
  for (const key in event) {
    if (event[key] !== undefined) formData.append(key, event[key]);
  }
  if (file) formData.append('image', file);
  const res = await fetch('https://tbo-qyda.onrender.com/api/events', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getAdminToken() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to add event');
  return await res.json();
  } finally {
    hideLoader();
}
}
async function updateEvent(id, event, file) {
  showLoader();
  try {
  const formData = new FormData();
  for (const key in event) {
    if (event[key] !== undefined) formData.append(key, event[key]);
  }
  if (file) formData.append('image', file);
  const res = await fetch(`https://tbo-qyda.onrender.com/api/events/${id}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + getAdminToken() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to update event');
  return await res.json();
  } finally {
    hideLoader();
}
}
async function deleteEventById(id) {
  showLoader();
  try {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete event');
  return await res.json();
  } finally {
    hideLoader();
  }
}

// 5. Event Notification Manager
async function renderEvents() {
  showLoader();
  try {
  const events = await fetchEvents();
  adminMain.innerHTML = `
    <div class="section-title">Event Notifications</div>
    <div class="section-actions"><button onclick="showEventForm()">Add Event</button></div>
    <div id="eventFormWrap"></div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead><tr><th>Title</th><th>Date</th><th>Host</th><th>Img</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>
          ${events.map(e => `
            <tr>
              <td>${e.title}</td>
              <td>${e.date}</td>
              <td>${e.host}</td>
              <td>${e.img ? `<img src="${e.img}" class="img-preview">` : ""}</td>
              <td>${e.desc}</td>
              <td class="admin-table-actions">
                <button onclick="showEventForm('${e._id}')">Edit</button>
                <button onclick="deleteEvent('${e._id}')" class="danger-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  } finally {
    hideLoader();
  }
}

async function showEventForm(id) {
  const events = await fetchEvents();
  const e = id ? events.find(ev => ev._id === id) : { title: '', date: '', host: '', img: '', desc: '' };

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  formModal = document.createElement('div');
  formModal.className = 'form-modal';

  formModal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="eventForm">
      <h3 id="formTitle">${id ? 'Edit' : 'Add'} Event</h3>
      <div class="form-row"><label>Title:</label><input name="title" required value="${e.title}"></div>
      <div class="form-row"><label>Date:</label><input name="date" required type="date" value="${e.date}"></div>
      <div class="form-row"><label>Host Name:</label><input name="host" required value="${e.host}"></div>
      <div class="form-row"><label>Event Image:</label><input type="file" name="image" accept="image/*"></div>
      <div class="form-row"><label>Description:</label><textarea name="desc" required>${e.desc}</textarea></div>
      ${e.imageUrl ? `<div class="form-row"><img src="${e.imageUrl}" class="img-preview" id="imgPreview"></div>` : ''}
      <button type="submit">${id ? 'Update' : 'Add'}</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;

  overlay.appendChild(formModal);
  document.body.appendChild(overlay);

  // ...inside showEventForm...
  document.getElementById('eventForm').onsubmit = function (ev) {
    ev.preventDefault();
    const f = ev.target;
    const item = {
      title: f.title.value,
      date: f.date.value,
      host: f.host.value,
      desc: f.desc.value
    };
    const file = f.image.files[0];

    if (id) {
      updateEvent(id, item, file).then(() => {
        logActivity("Edited Event", `Title: ${item.title}`);
        closeForm();
        renderEvents();
      });
    } else {
      addEvent(item, file).then(() => {
        logActivity("Added Event", `Title: ${item.title}`);
        closeForm();
        renderEvents();
      });
    }
  };
  // ...existing code...
}

async function deleteEvent(id) {
  const events = await fetchEvents();
  const deleted = events.find(ev => ev._id === id);
  if (!deleted) return;
  showPopup(`Delete event: <b>${deleted.title || 'Untitled Event'}</b>? This cannot be undone.`, {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function() {
      await deleteEventById(id);
      closeForm();
      renderEvents();
      showNotification("Event deleted.");
      logActivity("Deleted Event", `Title: ${deleted.title}`);
    }
  });
}

// --- Contact Data Access Abstraction (Backend API) ---
async function fetchContactMessages() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/contacts', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch contact messages');
  return await res.json();
}
async function fetchPastorMsgs() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/pastorMsgs', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch pastor messages');
  return await res.json();
}
async function fetchContactReplies() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/contactReplies', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch contact replies');
  return await res.json();
}
async function addContactReply(reply) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/contactReplies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(reply)
  });
  if (!res.ok) throw new Error('Failed to add reply');
  return await res.json();
}
async function deleteContactMessageById(type, id) {
  // type: 'contacts', 'pastorMsgs'
  const url = type === 'contacts'
    ? `https://tbo-qyda.onrender.com/api/contacts/${id}`
    : `https://tbo-qyda.onrender.com/api/pastorMsgs/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete message');
  return await res.json();
}

// 3. Contacts -- restricted
async function renderContacts() {
  showLoader();
  try {
  if (!isSuperAdminOrSuperEditor()) {
    adminMain.innerHTML = `<div class="section-title">Contact Messages</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized. Only Super Admin and Super Editor can access this section.</p>`;
    return;
  }
  // Combine user messages and legacy messages
  const contactMsgs = (await fetchContactMessages()).map(msg => ({
    ...msg,
    source: 'contacts'
  }));

  const legacyMsgs = (await fetchPastorMsgs()).map(m => ({
    ...m,
    source: 'pastorMsgs'
  }));

  const msgs = [...contactMsgs, ...legacyMsgs];
  const replies = await fetchContactReplies();

  adminMain.innerHTML = `
    <div class="section-title">Contact Messages</div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Sender</th>
            <th>Email</th>
            <th>Date</th>
            <th>Message</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${msgs.map((m) => {
            const hasReply = replies.some(r => r.source === m.source && r.msgId === m._id);
            return `
              <tr>
                <td>${m.name || m.from}</td>
                <td>${m.email || 'N/A'}</td>
                <td>${m.date ? new Date(m.date).toLocaleString() : ''}</td>
                <td>${(m.subject ? `<b>${m.subject}:</b> ` : "") + (m.message || m.msg || '')}</td>
                <td>
                  <span class="status-tag ${hasReply ? 'replied' : 'unreplied'}">
                    ${hasReply ? 'Replied' : 'Unreplied'}
                  </span>
                </td>
                <td class="admin-table-actions">
                  <button onclick="viewMessage('${m.source}', '${m._id}')">View</button>
                  <button onclick="replyToMessage('${m.source}', '${m._id}')" class="btn">Reply</button>
                  <button onclick="deleteContactMessage('${m.source}', '${m._id}')" class="danger-btn">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  } finally {
    hideLoader();
  }
}

async function viewMessage(source, id) {
  showLoader();
  try {
  let msg;
  if (source === 'contacts') {
    const arr = await fetchContactMessages();
    msg = arr.find(m => m._id === id);
    msg = {
      from: msg.name,
      email: msg.email,
      date: (msg.date ? new Date(msg.date).toLocaleString() : ''),
      msg: (msg.subject ? `<b>${msg.subject}:</b> ` : "") + msg.message
    };
  } else { // 'pastorMsgs'
    msg = (await fetchPastorMsgs()).find(m => m._id === id);
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <h3>Contact Message</h3>
    <div class="form-row">
      <label>From:</label>
      <span>${msg.from} (${msg.email || 'No email'})</span>
    </div>
    <div class="form-row">
      <label>Date:</label>
      <span>${msg.date}</span>
    </div>
    <div class="form-row">
      <label>Message:</label>
      <pre style="white-space: pre-wrap; word-break: break-word;">${msg.msg}</pre>
    </div>
    <button onclick="closeForm()">Close</button>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  } finally {
    hideLoader();
  }
}

async function replyToMessage(source, id) {
  showLoader();
  try {
  let msg;
  if (source === 'contacts') {
    const arr = await fetchContactMessages();
    const m = arr.find(x => x._id === id);
    msg = {
      from: m.name,
      email: m.email,
      subject: m.subject,
      date: (m.date ? new Date(m.date).toLocaleString() : ''),
      msg: (m.subject ? `<b>${m.subject}:</b> ` : "") + m.message
    };
  } else { // 'pastorMsgs'
    const m = (await fetchPastorMsgs()).find(x => x._id === id);
    msg = m;
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="replyForm">
      <h3 id="formTitle">Reply to ${msg.from}</h3>
      <div class="form-row">
        <label>From:</label>
        <span>${msg.email || 'No email provided'}</span>
      </div>
      <div class="form-row">
        <label>Message:</label>
        <textarea name="replyText" required placeholder="Type your response here..." style="min-height: 100px;"></textarea>
      </div>
      <div class="form-row" style="display: flex; gap: 0.8em;">
        <button type="submit">Send Reply</button>
        <button type="button" onclick="closeForm()">Cancel</button>
      </div>
    </form>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('replyForm').onsubmit = async function(e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const replyText = f.replyText.value.trim();
    if (!replyText) {
      showPopup("Please enter a reply message.");
      return;
    }
    // Store reply in backend
    await addContactReply({
      timestamp: new Date().toISOString(),
      source,
      msgId: id,
      from: getAdminUser().email,
      reply: replyText
    });

    // --- Open Gmail compose with recipient, subject, and message ---
    if (msg.email) {
      const subject = encodeURIComponent(msg.subject ? "Re: " + msg.subject : "Reply from The Bible Outdoor");
      const body = encodeURIComponent(replyText + "\n\n--- Original message ---\n" + (msg.msg || ""));
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.email}&su=${subject}&body=${body}`, "_blank");
    }

    closeForm();
    showPopup("Reply sent!");
    logActivity("Replied to Contact", `To: ${msg.email || msg.from}`);
      } finally {
        hideLoader();
      }
  };
  } finally {
    hideLoader();
  }
}

async function deleteContactMessage(source, id) {
  showLoader();
  try {
      await deleteContactMessageById(source, id);
      renderContacts();
      showPopup("Message deleted.");
      logActivity("Deleted Contact Message", `Source: ${source}, ID: ${id}`);
  } finally {
    hideLoader();
    }
}

// --- Donation Data Access Abstraction (Backend API) ---
async function fetchDonationSettings() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/settings/donation', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch donation settings');
  return await res.json();
}
async function saveDonationSettings(settings) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/settings/donation', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save donation settings');
  return await res.json();
}
async function fetchDonationLogs() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/donations', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch donation logs');
  return await res.json();
}
async function addDonationLog(log) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/donations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(log)
  });
  if (!res.ok) throw new Error('Failed to add donation log');
  return await res.json();
}
async function deleteDonationLogById(id) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/donations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete donation log');
  return await res.json();
}

// 4. Donation Settings -- restricted
async function renderDonation() {
  showLoader();
  try {
  if (!isSuperAdminOrSuperEditor()) {
    adminMain.innerHTML = `<div class="section-title">Donation Settings</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized. Only Super Admin and Super Editor can access this section.</p>`;
    return;
  }
  const donation = await fetchDonationSettings();
  const logs = await fetchDonationLogs();

  adminMain.innerHTML = `
    <div class="section-title">Donation Settings</div>
    <form id="donationForm" style="background:var(--surface);padding:1em 1.2em;border-radius:10px;max-width:400px;">
      <div class="form-row"><label>PayPal Email:</label>
        <input name="paypal" value="${donation.paypal || ''}" style="width:100%;" placeholder="PayPal email">
      </div>
      <div class="form-row"><label>M-PESA Number:</label>
        <input name="mpesa" value="${donation.mpesa || ''}" style="width:100%;" placeholder="e.g. Paybill: 400200 | Account: 01109098319900">
      </div>
      <div class="form-row"><label>Donation Message:</label>
        <textarea name="message" placeholder="Donation message to show on the site">${donation.message || ''}</textarea>
      </div>
      <button type="submit">Save</button>
    </form>
    <!-- Donation Logs Section -->
    <div class="section-title" style="margin-top: 2em;">Donation Logs</div>
    <div class="section-actions">
      <button onclick="showAddMpesaForm()" style="background: linear-gradient(90deg, #2ecc71 60%, #27ae60 130%); color: white;">Add M-PESA</button>
      <button onclick="exportLogs()" style="background: linear-gradient(90deg, var(--primary) 60%, var(--accent) 130%);">Export</button>
    </div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>From</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map((log) => `
            <tr>
              <td>${log.date ? new Date(log.date).toLocaleString() : 'undefined'}</td>
              <td>${log.type || 'undefined'}</td>
              <td>${log.amount !== undefined && log.amount !== "" ? `Ksh ${log.amount}` : 'undefined'}</td>
              <td>${log.from && log.from !== "" ? log.from : 'undefined'}</td>
              <td>
                <button onclick="deleteLog('${log._id}')" class="danger-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // --- Dynamic Save Handler for Donation Settings ---
  document.getElementById('donationForm').onsubmit = async function(e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const newSettings = {
      paypal: f.paypal.value.trim(),
      mpesa: f.mpesa.value.trim(),
      message: f.message.value.trim()
    };
    await saveDonationSettings(newSettings);
    window.dispatchEvent(new Event('donationSettingsUpdated'));
    showPopup("Donation settings saved!");
    logActivity("Updated Donation Settings");
    renderDonation();
      } finally {
        hideLoader();
      }
  };
  } finally {
    hideLoader();
  }
}

function showAddMpesaForm() {
  showLoader();
  try {
  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="mpesaForm">
      <h3>Add M-PESA Donation</h3>
      <div class="form-row">
        <label>Date:</label>
        <input name="date" type="datetime-local" required>
      </div>
      <div class="form-row">
        <label>Amount:</label>
        <input name="amount" type="number" min="1" required>
      </div>
      <div class="form-row">
        <label>From:</label>
        <input name="from" placeholder="Phone number/name">
      </div>
      <div class="form-row">
        <label>Purpose:</label>
        <select name="purpose">
          <option value="general">General Contribution</option>
          <option value="events">Event Support</option>
          <option value="ministry">Ministry Operations</option>
        </select>
      </div>
      <button type="submit">Add</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('mpesaForm').onsubmit = async function(e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const log = {
      date: f.date.value,
      type: 'M-PESA',
      amount: f.amount.value,
      from: f.from.value || '',
      purpose: f.purpose.value
    };
    await addDonationLog(log);
    closeForm();
    renderDonation();
    logActivity("Added M-PESA Donation", `Amount: Ksh ${log.amount}, From: ${log.from}`);
      } finally {
        hideLoader();
      }
  };
  } finally {
    hideLoader();
  }
}

async function exportLogs() {
  showLoader();
  try {
  const logs = await fetchDonationLogs();
  if (logs.length === 0) {
    showNotification("No logs to export.");
    return;
  }

  // Create CSV content
  const csvContent = [
    ['Date', 'Type', 'Amount', 'From', 'Purpose'].join(','),
    ...logs.map(l => [l.date, l.type, l.amount, l.from, l.purpose].join(','))
  ].join('\n');

  // Download as CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'donation_logs.csv');
  link.click();
  } finally {
    hideLoader();
  }
}

async function deleteLog(id) {
  showLoader();
  try {
  showPopup("Delete this donation log?", {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function() {
      await deleteDonationLogById(id);
      renderDonation();
      showPopup("Donation log deleted.");
      logActivity("Deleted Donation Log", `ID: ${id}`);
    }
  });
  } finally {
    hideLoader();
  }
}

// --- Product Data Access Abstraction (Backend API) ---
async function fetchProducts() {
  showLoader();
  try {
  const res = await fetch('https://tbo-qyda.onrender.com/api/products', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function addProduct(product, file) {
  showLoader();
  try {
  const formData = new FormData();
  for (const key in product) {
    if (product[key] !== undefined) formData.append(key, product[key]);
  }
  if (file) formData.append('image', file);
  const res = await fetch('https://tbo-qyda.onrender.com/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getAdminToken() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to add product');
  return await res.json();
  } finally {
    hideLoader();
  }
}

async function updateProduct(id, product, file) {
  showLoader();
  try {
  const formData = new FormData();
  for (const key in product) {
    if (product[key] !== undefined) formData.append(key, product[key]);
  }
  if (file) formData.append('image', file);
  const res = await fetch(`https://tbo-qyda.onrender.com/api/products/${id}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + getAdminToken() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to update product');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function deleteProductById(id) {
  showLoader();
  try {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return await res.json();
  } finally {
    hideLoader();
  }
}

// 5. Product Manager -- restricted
async function renderProducts() {
  showLoader();
  try {
  if (!isSuperAdminOrSuperEditor()) {
    adminMain.innerHTML = `<div class="section-title">Product Manager</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized. Only Super Admin and Super Editor can access this section.</p>`;
    return;
  }
  const products = await fetchProducts();
  let sort = window.prodSort || 'date-desc';
  let page = window.prodPage || 1;
  const pageSize = 9;
  let arr = [...products];
  if (sort === 'date-asc') arr.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sort === 'date-desc') arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
  const totalPages = Math.ceil(arr.length / pageSize);
  arr = arr.slice((page - 1) * pageSize, page * pageSize);
  adminMain.innerHTML = `
    <div class="section-title">Product Manager</div>
    <div class="section-actions">
      <button onclick="showProductForm()">Add Product</button>
      <span style="margin-left:1.5em;">
        Sort:
        <select id="prodSort" onchange="window.prodSort=this.value; window.prodPage=1; renderProducts()">
          <option value="date-desc"${sort === 'date-desc' ? ' selected' : ''}>Newest</option>
          <option value="date-asc"${sort === 'date-asc' ? ' selected' : ''}>Oldest</option>
          <option value="price-asc"${sort === 'price-asc' ? ' selected' : ''}>Price Low→High</option>
          <option value="price-desc"${sort === 'price-desc' ? ' selected' : ''}>Price High→Low</option>
        </select>
      </span>
    </div>
    <div id="productFormWrap"></div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead><tr><th>Img</th><th>Name</th><th>Price</th><th>Description</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${arr.map((p) => `
              <tr>
                <td>${p.imageUrl ? `<img src="${p.imageUrl}" class="img-preview">` : ""}</td>
                <td>${p.name}</td>
                <td>Ksh ${p.price}</td>
                <td>${p.desc}</td>
                <td>${p.date}</td>
                <td class="admin-table-actions">
                  <button onclick="showProductForm('${p._id}')">Edit</button>
                  <button onclick="deleteProduct('${p._id}')" class="danger-btn">Delete</button>
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin:1em 0; text-align:center;">
      ${Array.from({ length: totalPages }, (_, i) =>
        `<button ${page === i + 1 ? 'disabled' : ''} onclick="window.prodPage=${i + 1};renderProducts()">${i + 1}</button>`
      ).join(' ')}
    </div>
  `;
  } finally {
    hideLoader();
  }
}

async function showProductForm(id) {
  const products = await fetchProducts();
  const p = id ? products.find(x => x._id === id) : {
    imageUrl: '',
    name: '',
    price: '',
    desc: '',
    date: new Date().toISOString().slice(0, 10)
  };

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  formModal = document.createElement('div');
  formModal.className = 'form-modal';

  formModal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="productForm">
      <div class="form-row"><label>Name:</label><input name="name" required value="${p.name}"></div>
      <div class="form-row"><label>Price (Ksh):</label><input name="price" required type="number" min="1" value="${p.price}"></div>
      <div class="form-row"><label>Description:</label><textarea name="desc" required>${p.desc}</textarea></div>
      <div class="form-row"><label>Date:</label><input name="date" required type="date" value="${p.date}"></div>
      <div class="form-row"><label>Image:</label><input type="file" name="image" accept="image/*"></div>
      ${p.imageUrl ? `<div class="form-row"><img src="${p.imageUrl}" class="img-preview" id="imgPreview"></div>` : ''}
      <button type="submit">${id ? 'Update' : 'Add'}</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;

  overlay.appendChild(formModal);
  document.body.appendChild(overlay);

  formModal.querySelector('#productForm').onsubmit = function (e) {
    e.preventDefault();
    const f = e.target;
    const item = {
      name: f.name.value,
      price: +f.price.value,
      desc: f.desc.value,
      date: f.date.value
    };
    const file = f.image.files[0];
    if (id) {
      updateProduct(id, item, file).then(() => {
        logActivity("Edited Product", `Name: ${item.name}`);
        closeForm();
        renderProducts();
        window.dispatchEvent(new Event('productsUpdated'));
      });
    } else {
      addProduct(item, file).then(() => {
        logActivity("Added Product", `Name: ${item.name}`);
        closeForm();
        renderProducts();
        window.dispatchEvent(new Event('productsUpdated'));
      });
    }
  };
  // Preview and crop selected image
  if (typeof formModal !== 'undefined' && formModal) {
    const imgInput = formModal.querySelector('input[name="image"]');
    let croppedImageBlob = null;
    if (imgInput) {
      imgInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
          showCropperModal(file, function(croppedBlob) {
            croppedImageBlob = croppedBlob;
            // Show preview
            let imgPrev = formModal.querySelector('#imgPreview');
            if (!imgPrev) {
              imgPrev = document.createElement('img');
              imgPrev.className = 'img-preview';
              imgPrev.id = 'imgPreview';
              imgInput.parentNode.parentNode.appendChild(imgPrev);
            }
            imgPrev.src = URL.createObjectURL(croppedBlob);
          });
        }
      });
    }
  }
}

async function deleteProduct(id) {
  showLoader();
  try {
    const products = await fetchProducts();
    const deleted = products.find(x => x._id === id);
    if (!deleted) return;

    showPopup(`Delete product: <b>${deleted.name}</b>? This cannot be undone.`, {
      confirm: true,
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async function () {
        await deleteProductById(id);
        logActivity("Deleted Product", `Name: ${deleted.name}`);
        renderProducts();
        showNotification("Product deleted.");
      }
    });
  } finally {
    hideLoader();
  }
}

// --- User Data Access Abstraction (Backend API) ---
async function fetchUsers() {
  showLoader();
  try {
  const res = await fetch('https://tbo-qyda.onrender.com/api/users', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function addUser(user) {
  showLoader();
  try {
  const res = await fetch('https://tbo-qyda.onrender.com/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to add user');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function updateUser(email, user) {
  showLoader();
  try {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/users/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function deleteUserByEmail(email) {
  showLoader();
  try {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function fetchSentEmails() {
  showLoader();
  try {
  const res = await fetch('https://tbo-qyda.onrender.com/api/sentEmails', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch sent emails');
  return await res.json();
  } finally {
    hideLoader();
  }
}
async function saveSentEmails(emails) {
  // Not needed if backend handles sending/storing emails
}

// --- User Manager (restricted to superadmin only) ---
async function renderUsers() {
  showLoader();
  try {
  if (!isSuperAdmin()) {
    adminMain.innerHTML = `<div class="section-title">User Management</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized. Only Super Admin can access this section.</p>`;
    return;
  }
  const users = await fetchUsers();
  let userList = users.map(user => ({
    email: user.email,
    name: user.name || user.email.split('@')[0].replace(/\./g, ' ').split('').map(c => c.toUpperCase()).join(''),
    role: user.role || 'user',
    status: user.status || 'Active'
  }));

  adminMain.innerHTML = `
    <div class="section-title">User Management</div>
    <div class="section-actions">
      <button class="btn" style="background: #e8f1fa; color: var(--primary);" onclick="bulkEmailUsers()">Bulk Email</button>
      <button class="btn" style="background: linear-gradient(90deg, var(--primary) 60%, var(--accent) 130%);" onclick="showUserForm()">+ Add User</button>
      <button class="btn" style="background: #ffd700; color: #222;" onclick="exportUsers()">Export</button>
    </div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${userList.map((user, i) => `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td><span class="status-tag ${user.status.toLowerCase()}">${user.status}</span></td>
              <td>
                ${user.role === 'superadmin' ? 'Super Admin' : 
                  user.role === 'supereditor' ? 'Super Editor' : 
                  user.role}
              </td>
              <td>
                <button onclick="showUserForm('${user.email}')">Edit</button>
                <button onclick="deleteUser('${user.email}')" class="danger-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="admin-table"></div>
  `;
  } finally {
    hideLoader();
  }
}

// Show User Form for Add or Edit
async function showUserForm(email) {
  showLoader();
  try {
  const users = await fetchUsers();
  let u;

  // If email is given, edit mode; otherwise, add mode
  if (email) {
    const user = users.find(u => u.email === email);
    u = {
      email: user.email,
      name: user.name || '',
      role: user.role || 'editor',
      status: user.status || 'Active'
    };
  } else {
    u = {
      email: "",
      name: "",
      role: "editor",
      status: "Active"
    };
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  formModal = document.createElement('div');
  formModal.className = 'form-modal';
  formModal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="userForm">
      <h3 id="formTitle">${email ? 'Edit' : 'Add'} User</h3>
      <div class="form-row">
        <label>Name:</label>
        <input name="name" value="${u.name}" required>
      </div>
      <div class="form-row">
        <label>Email:</label>
        <input name="email" type="email" value="${u.email}" required ${email ? "readonly" : ""}>
      </div>
      <div class="form-row">
        <label>Role:</label>
        <select name="role">
          <option value="superadmin"${u.role === 'superadmin' ? ' selected' : ''}>Super Admin</option>
          <option value="supereditor"${u.role === 'supereditor' ? ' selected' : ''}>Super Editor</option>
          <option value="editor"${u.role === 'editor' ? ' selected' : ''}>Editor</option>
          <option value="user"${u.role === 'user' ? ' selected' : ''}>User</option>
        </select>
      </div>
      <div class="form-row">
        <label>Status:</label>
        <select name="status">
          <option value="Active"${u.status === 'Active' ? ' selected' : ''}>Active</option>
          <option value="Inactive"${u.status === 'Inactive' ? ' selected' : ''}>Inactive</option>
        </select>
      </div>
      <div class="form-row" id="passwordRow" style="${email ? "display:none;" : ""}">
        <label>Password:</label>
        <input name="pass" type="text" placeholder="Set password" ${email ? "" : "required"}>
      </div>
      <button type="submit">${email ? 'Update' : 'Add'}</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;
  overlay.appendChild(formModal);
  document.body.appendChild(overlay);

  document.getElementById('userForm').onsubmit = async function(e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const emailVal = f.email.value.trim().toLowerCase();
    const name = f.name.value.trim();
    const role = f.role.value;
    const status = f.status.value;
    const pass = f.pass ? f.pass.value : "";

    if (!emailVal.endsWith('@gmail.com')) {
      showPopup("Email must be a valid Gmail address (ends with @gmail.com)");
      return;
    }
    if (!name) {
      showPopup("Name is required.");
      return;
    }
    if (!email && (!pass || pass.length < 3)) {
      showPopup("Password is required and must be at least 3 characters.");
      return;
    }

    // Add or update user
    if (email) {
      await updateUser(emailVal, { name, role, status });
      logActivity("Edited User", `Email: ${emailVal}`);
      closeForm();
      renderUsers();
      showNotification("User updated.");
    } else {
      // Use addUserAndShowInvite so invitation dialog is shown
      await addUserAndShowInvite({ email: emailVal, name, role, status, pass });
      closeForm();
      renderUsers();
      // No need for showNotification here, handled in addUserAndShowInvite
        }
      } finally {
        hideLoader();
    }
  };
  } finally {
    hideLoader();
  }
}

// Delete User
async function deleteUser(email) {
  showLoader();
  try {
  const users = await fetchUsers();
  const user = users.find(u => u.email === email);
  if (!user) return;

  if (user.role === 'superadmin') {
    showPopup("You cannot delete the Super Admin account!");
    return;
  }
  showPopup(`Delete user <b>${user.name || email}</b>? This cannot be undone.`, {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function() {
      await deleteUserByEmail(email);
      closeForm();
      renderUsers();
      showNotification("User deleted.");
      logActivity("Deleted User", `Email: ${email}`);
    }
  });
  } finally {
    hideLoader();
  }
}

// --- Bulk Email Modal and Handler ---
async function bulkEmailUsers() {
  showLoader();
  try {
  const users = await fetchUsers();
  let roles = Array.from(new Set(users.map(u => u.role || 'user')));
  roles.unshift('All');

  // Modal form for bulk email
  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.innerHTML = `
    <button class="close-btn" onclick="closeForm()">×</button>
    <form id="bulkEmailForm">
      <h3>Send Bulk Email</h3>
      <div class="form-row">
        <label>To:</label>
        <select name="role" style="max-width:200px;">
          ${roles.map(role => `<option value="${role}">${role[0].toUpperCase() + role.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label>Subject:</label>
        <input name="subject" required>
      </div>
      <div class="form-row">
        <label>Message:</label>
        <textarea name="message" required rows="5"></textarea>
      </div>
      <button type="submit">Send</button>
      <button type="button" onclick="closeForm()">Cancel</button>
    </form>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('bulkEmailForm').onsubmit = async function(e) {
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    const role = f.role.value;
    const subject = f.subject.value.trim();
    const message = f.message.value.trim();
    const users = await fetchUsers();
    // Determine recipients
    let recipients = users.filter(user => {
      if (role === "All") return true;
      return (user.role || 'user') === role;
    });

    if (recipients.length === 0) {
      showPopup("No users found for the selected role.");
      return;
    }

    // Simulate sending email: Save to backend (or localStorage if demo)
    // Here, you would POST to /api/sendBulkEmail or similar endpoint
    // For demo, just show a popup
    closeForm();
    showPopup(`Bulk email queued:<br>
      <b>Subject:</b> ${subject}<br>
      <b>Recipients:</b> ${recipients.length} (${role})`, {okText: "OK"});
      } finally {
        hideLoader();
      }
  };
  } finally {
    hideLoader();
  }
}

// --- Site Settings Data Access Abstraction (Backend API) ---
async function fetchSiteSettings() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/settings/site', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch site settings');
  return await res.json();
}
async function saveSiteSettings(settings) {
  const res = await fetch('https://tbo-qyda.onrender.com/api/settings/site', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getAdminToken()
    },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save site settings');
  return await res.json();
}

// 7. Global Site Settings (restricted to superadmin only)
async function renderSettings() {
  showLoader();
  try {
  if (!isSuperAdmin()) {
    adminMain.innerHTML = `<div class="section-title">Site Settings</div>
      <p style="color: #c0392b; font-size: 1.15em;">Not authorized. Only Super Admin can access this section.</p>`;
    return;
  }
  const site = await fetchSiteSettings();
  adminMain.innerHTML = `
    <div class="section-title">Site Settings</div>
    <form id="siteForm" style="background:var(--surface);padding:1em 1.2em;border-radius:10px;max-width:400px;">
      <div class="form-row"><label>Site Title:</label>
        <input name="title" value="${site.title || ''}" style="width:100%;">
      </div>
      <div class="form-row"><label>Location:</label>
        <input name="location" value="${site.location || ''}" style="width:100%;">
      </div>
      <div class="form-row"><label>Footer Text:</label>
        <input name="footer" value="${site.footer || ''}" style="width:100%;">
      </div>
      <div class="form-row"><label>Favicon URL:</label>
        <input name="favicon" value="${site.favicon || ''}" style="width:100%;">
      </div>
      <div class="form-row"><label>YouTube Link:</label>
        <input name="youtube" value="${site.youtube || ''}" style="width:100%;" placeholder="https://youtube.com/yourchannel">
      </div>
      <div class="form-row"><label>Facebook Link:</label>
        <input name="facebook" value="${site.facebook || ''}" style="width:100%;" placeholder="https://facebook.com/yourpage">
      </div>
      <div class="form-row"><label>TikTok Link:</label>
        <input name="tiktok" value="${site.tiktok || ''}" style="width:100%;" placeholder="https://tiktok.com/@yourprofile">
      </div>
      <!-- Add contact info fields below -->
      <div class="form-row"><label>Pastor Name:</label>
        <input name="pastor" value="${site.pastor || ''}" style="width:100%;" placeholder="e.g. Rev. Justine Ngewe">
      </div>
      <div class="form-row"><label>Phone:</label>
        <input name="phone" value="${site.phone || ''}" style="width:100%;" placeholder="e.g. +254719321445">
      </div>
      <div class="form-row"><label>Email:</label>
        <input name="email" value="${site.email || ''}" style="width:100%;" placeholder="e.g. justinebiceptrainer@gmail.com">
      </div>
      <div class="form-row"><label>Address:</label>
        <input name="address" value="${site.address || ''}" style="width:100%;" placeholder="e.g. Sigalagala along Kisumu-Kakamega Highway">
      </div>
      <button type="submit">Save</button>
    </form>
    <div style="margin-top:1em;">
      <label>Dark/Light Mode:</label>
      <button onclick="setMode(false)">Light</button>
      <button onclick="setMode(true)">Dark</button>
    </div>
  `;
  document.getElementById('siteForm').onsubmit = async function(e){
    e.preventDefault();
      showLoader();
      try {
    const f = e.target;
    await saveSiteSettings({
      title: f.title.value,
      location: f.location.value,
      footer: f.footer.value,
      favicon: f.favicon.value,
      youtube: f.youtube.value,
      facebook: f.facebook.value,
      tiktok: f.tiktok.value,
      pastor: f.pastor.value,
      phone: f.phone.value,
      email: f.email.value,
      address: f.address.value
    });
    window.dispatchEvent(new Event('siteSettingsUpdated'));
    logActivity("Updated Site Settings");
    showPopup("Site settings saved!");
    renderSettings();
      } finally {
        hideLoader();
      }
  };
  } finally {
    hideLoader();
  }
}

// --- 14. Modal Form Closer and ESC Support ---
function closeForm() {
  const overlay = document.querySelector('.form-overlay');
  if (overlay) {
    overlay.remove();
    document.body.style.overflow = '';
  }
}
document.addEventListener('keydown', function (e) {
  if (e.key === "Escape") closeForm();
});

// --- 15. Section Router ---
// --- In your router: ---
function renderSection() {
  setActiveNav();
  switch(currentSection) {
    case 'overview': renderOverview(); break;
    case 'sermons': renderSermons(); break;
    case 'training': renderLibrary(); break;
    case 'sunday': renderSunday(); break;
    case 'media': renderMedia(); break;
    case 'events': renderEvents(); break;
    case 'contacts': renderContacts(); break;
    case 'donation': renderDonation(); break;
    case 'products': renderProducts(); break;
    case 'users': renderUsers(); break;
    case 'settings': renderSettings(); break;
    case 'activitylog': renderActivityLog(); break;
    case 'testimonies': renderTestimonies(); break;
    default: renderOverview();
  }
}
window.renderSection = renderSection;

// --- Ensure router is called on hash change and initial load ---
window.onhashchange = () => {
  currentSection = location.hash.replace('#','') || 'overview';
  renderSection();
};
renderSection(); // Initial render

// --- 16. Redirect to login if not authenticated (outside login page) ---
// Remove reference to 'adminSession' in localStorage
if (
  !window.location.pathname.endsWith("index.html") && 
  !window.location.pathname.endsWith("/") &&
  !localStorage.getItem('adminToken')
) {
  window.location = "login.html";
}

// --- END OF FILE ---

// (You should add logActivity calls to all other admin action handlers, following the above pattern.)
// For brevity, not all code is shown here. 
// Insert the logActivity("Action", "Details") calls in every add, edit, and delete block for:
// - Users: showUserForm, deleteUser
// - Products: showProductForm, deleteProduct
// - Donations: showAddMpesaForm, deleteLog, donation settings save
// - Sermons: showVerseForm, deleteSermon
// - Media: showMediaForm, deleteMedia
// - Events: showEventForm, deleteEvent
// - Contacts: viewMessage, replyToMessage, deleteContact
// --- END OF FILE ---

// --- Testimony Data Access Abstraction (Backend API) ---
async function fetchTestimonies() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/testimonies', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch testimonies');
  return await res.json();
}
async function approveTestimony(id) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/testimonies/${id}/approve`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to approve testimony');
  return await res.json();
}
async function deleteTestimony(id) {
  const res = await fetch(`https://tbo-qyda.onrender.com/api/testimonies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to delete testimony');
  return await res.json();
}

// --- Testimony Manager UI ---
async function renderTestimonies() {
  showLoader();
  try {
  let testimonies = [];
  try {
    testimonies = await fetchTestimonies();
  } catch {
    adminMain.innerHTML = '<div class="section-title">Testimonies</div><div style="color:#c0392b;">Failed to load testimonies.</div>';
    return;
  }
  adminMain.innerHTML = `
    <div class="section-title">Testimonies</div>
    <div class="section-actions">
      <span style="color:gray;">${testimonies.length} testimon${testimonies.length === 1 ? 'y' : 'ies'}.</span>
    </div>
    <div class="admin-table-responsive">
      <table class="admin-table">
        <thead><tr>
          <th>Name</th><th>Message</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${testimonies.map(t => `
            <tr>
              <td>${t.name}</td>
              <td style="max-width:320px;white-space:pre-line;">${t.message}</td>
              <td>${t.approved ? '<span style="color:green;font-weight:bold;">Approved</span>' : '<span style="color:#e67e22;font-weight:bold;">Pending</span>'}</td>
              <td class="admin-table-actions">
                ${!t.approved ? `<button onclick="approveTestimonyUI('${t._id}')" class="btn" style="background:var(--primary);color:#fff;">Approve</button>` : ''}
                <button onclick="deleteTestimonyUI('${t._id}')" class="danger-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  } finally {
    hideLoader();
  }
}
window.renderTestimonies = renderTestimonies;

async function approveTestimonyUI(id) {
  showLoader();
  try {
    await approveTestimony(id);
    closeForm();
    showPopup('Testimony approved successfully!');
    await renderTestimonies();
  } finally {
    hideLoader();
  }
}
window.approveTestimonyUI = approveTestimonyUI;

async function deleteTestimonyUI(id) {
  showLoader();
  try {
  showPopup("Delete this testimony? This cannot be undone.", {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function() {
      try {
        await deleteTestimony(id);
        closeForm();
        showNotification('Testimony deleted.');
        await renderTestimonies();
      } catch {
        showNotification('Failed to delete testimony.');
      }
    }
  });
  } finally {
    hideLoader();
  }
}
window.deleteTestimonyUI = deleteTestimonyUI;

// --- Show Invitation Link and Gmail Compose Helper ---
function showUserInvitationDialog(email, link, defaultPassword) {
  const gmailSubject = encodeURIComponent('Your Admin Account Invitation');
  const gmailBody = encodeURIComponent(
    `Hello,\n\nYou have been invited to join as an admin/editor for The Bible Outdoor.\n\nLogin link (valid 30 minutes): ${link}\nDefault password: ${defaultPassword}\n\nPlease use the link and password to log in within 30 minutes. You will be prompted to set a new password.\n\nIf you did not expect this, please ignore this email.`
  );
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${gmailSubject}&body=${gmailBody}`;

  showPopup(
    `<div style='text-align:center;max-width:400px;margin:auto;'>
      <b>Admin Invitation Ready</b><br><br>
      <div style='margin-bottom:1.2em;'>
        <span style='font-size:1.08em;'>Click the button below to send the invitation via Gmail.<br></span>
        <span style='color:var(--text-alt);font-size:0.98em;display:block;margin-top:0.7em;'>The invitation link and default password will be included in the email. The link expires in <b>30 minutes</b> for security.</span>
    </div>
      <button onclick=\"window.open('${gmailUrl}','_blank')\" class='btn' style='margin-bottom:1.1em;'>Send via Gmail</button>
      <div style='color:var(--text-alt);font-size:0.97em;margin-top:0.7em;'>
        <b>Note:</b> The invited user will be required to change their password on first login.
      </div>
    </div>`,
    { okText: 'Close' }
  );
}

// --- Patch addUser logic to show invitation dialog ---
async function addUserAndShowInvite(user) {
  try {
    const res = await addUser(user);
    if (res && res.success && res.oneTimeLink && res.defaultPassword) {
      showUserInvitationDialog(user.email, res.oneTimeLink, res.defaultPassword);
      logActivity('Added User', `Email: ${user.email}, Role: ${user.role}`);
    } else {
      showNotification('User added, but no invitation link returned.');
    }
  } catch (err) {
    showNotification('Failed to add user: ' + (err.message || err));
  }
}

// --- Expose deleteMedia as a global function ---
async function deleteMedia(id) {
  const media = await fetchMediaArchive();
  const m = media.find(x => x._id === id);
  if (!m) return;

  showPopup(`Delete media: <b>${m.title || 'Untitled Media'}</b>? This cannot be undone.`, {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function () {
      await deleteMediaItemById(id);
      logActivity("Deleted Media", `Title: ${m.title}`);
      renderMedia();
      showNotification("Media deleted.");
    }
  });
}
window.deleteMedia = deleteMedia;

async function deleteProduct(id) {
  const products = await fetchProducts();
  const deleted = products.find(x => x._id === id);
  if (!deleted) return;

  showPopup(`Delete product: <b>${deleted.name}</b>? This cannot be undone.`, {
    confirm: true,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async function () {
      await deleteProductById(id);
      logActivity("Deleted Product", `Name: ${deleted.name}`);
      renderProducts();
      showNotification("Product deleted.");
    }
  });
}
window.deleteProduct = deleteProduct;

// Loader Overlay Helpers
function showLoader() {
  const overlay = document.getElementById('loaderOverlay');
  if (overlay) overlay.style.display = 'flex';
}
function hideLoader() {
  const overlay = document.getElementById('loaderOverlay');
  if (overlay) overlay.style.display = 'none';
}

// --- Activity Log Data Access Abstraction (Backend API) ---
async function fetchActivityLog() {
  const res = await fetch('https://tbo-qyda.onrender.com/api/activitylog', {
    headers: { Authorization: 'Bearer ' + getAdminToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch activity log');
  return await res.json();
}

// --- Add Cropper.js cropping for product image upload ---
let cropperInstance = null;
let cropperModal = null;
let formModal = null;

function showCropperModal(file, onCrop) {
  if (cropperModal) cropperModal.remove();
  cropperModal = document.createElement('div');
  cropperModal.className = 'form-overlay';
  cropperModal.innerHTML = `
    <div class="form-modal" style="max-width:420px;">
      <button class="close-btn" onclick="closeCropperModal()">&times;</button>
      <h3 style="margin-top:0;color:var(--primary);">Crop Product Image</h3>
      <img id="cropper-img" style="max-width:100%;max-height:320px;border-radius:8px;" />
      <div style="margin-top:1em;text-align:center;">
        <button id="crop-btn" class="btn" style="background:var(--primary);color:white;">Crop & Use</button>
      </div>
    </div>
  `;
  document.body.appendChild(cropperModal);
  const img = cropperModal.querySelector('#cropper-img');
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
    if (cropperInstance) cropperInstance.destroy();
    cropperInstance = new Cropper(img, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
      background: false,
      movable: true,
      zoomable: true,
      rotatable: false,
      scalable: false
    });
  };
  reader.readAsDataURL(file);
  cropperModal.querySelector('#crop-btn').onclick = function() {
    if (cropperInstance) {
      cropperInstance.getCroppedCanvas({ width: 400, height: 400 }).toBlob(blob => {
        onCrop(blob);
        closeCropperModal();
      }, 'image/jpeg', 0.92);
    }
  };
}
function closeCropperModal() {
  if (cropperInstance) cropperInstance.destroy();
  cropperInstance = null;
  if (cropperModal) cropperModal.remove();
  cropperModal = null;
}
// ... inside showProductForm ...
  // Preview and crop selected image
  const imgInput = formModal.querySelector('input[name="image"]');
  let croppedImageBlob = null;
  if (imgInput) {
    imgInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        showCropperModal(file, function(croppedBlob) {
          croppedImageBlob = croppedBlob;
          // Show preview
          let imgPrev = formModal.querySelector('#imgPreview');
          if (!imgPrev) {
            imgPrev = document.createElement('img');
            imgPrev.className = 'img-preview';
            imgPrev.id = 'imgPreview';
            imgInput.parentNode.parentNode.appendChild(imgPrev);
          }
          imgPrev.src = URL.createObjectURL(croppedBlob);
        });
      }
    });
  }
  // ... inside productForm onsubmit ...
    const file = croppedImageBlob || f.image.files[0];