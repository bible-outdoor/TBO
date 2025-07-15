document.addEventListener("DOMContentLoaded", function () {
  // Navbar toggle (mobile)
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.onclick = () => links.classList.toggle("open");
  }

  // Carousel (on homepage only)
  const items = document.querySelectorAll(".carousel-item");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");
  let idx = 0;

  function showCarouselItem(i) {
    if (!items.length) return;
    items.forEach((item, j) => {
      item.style.display = j === i ? "flex" : "none";
    });
  }

  if (items.length && prevBtn && nextBtn) {
    showCarouselItem(idx);
    prevBtn.onclick = () => {
      idx = (idx - 1 + items.length) % items.length;
      showCarouselItem(idx);
    };
    nextBtn.onclick = () => {
      idx = (idx + 1) % items.length;
      showCarouselItem(idx);
    };
    setInterval(() => {
      idx = (idx + 1) % items.length;
      showCarouselItem(idx);
    }, 5000);
  }

  // Theme (dark/light mode)
  function setMode(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
    updateModeButtons();
  }

  function updateModeButtons() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    document.querySelectorAll(".mode-toggle").forEach((btn) => {
      btn.innerHTML = isDark ? "🌙" : "☀️";
      btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    });
  }

  function initMode() {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setMode((stored || (prefersDark ? "dark" : "light")) === "dark");
  }

  initMode();

  const modeToggle = document.getElementById("modeToggle");
  const footerToggle = document.getElementById("footerModeToggle");

  if (modeToggle)
    modeToggle.onclick = () =>
      setMode(document.documentElement.getAttribute("data-theme") !== "dark");
  if (footerToggle)
    footerToggle.onclick = () =>
      setMode(document.documentElement.getAttribute("data-theme") !== "dark");

  // Auth (logout + welcome) - JWT ONLY
  const logoutBtn = document.getElementById("logout-btn");
  const welcomeText = document.getElementById("welcome-name");

  // Show/hide logout and welcome based on JWT
  function updateAuthUI(member) {
    if (logoutBtn) logoutBtn.style.display = member ? "inline-block" : "none";
    if (welcomeText) welcomeText.textContent = member ? member.name : "";
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("tbo_member_jwt");
      localStorage.removeItem("tbo_member");
      updateAuthUI(null);
      window.location.href = "index.html";
    };
  }

  // On page load, check JWT and fetch member info
  function checkAuth() {
    const token = localStorage.getItem("tbo_member_jwt");
    const member = localStorage.getItem("tbo_member");
    if (token && member) {
      updateAuthUI(JSON.parse(member));
    } else {
      updateAuthUI(null);
    }
  }
  checkAuth();

  // --- DYNAMIC TESTIMONIES FOR HOMEPAGE ---
  const testimonyList = document.getElementById("testimony-list");
  if (testimonyList) {
    fetch("https://bible-outdoor-backend.onrender.com/api/testimonies/public")
      .then(res => res.json())
      .then(testimonies => {
        // Show only the 2 latest testimonies
        const latest = testimonies.slice(0, 2);
        if (!latest.length) {
          testimonyList.innerHTML = '<div style="color:gray;">No testimonies yet.</div>';
          return;
        }
        testimonyList.innerHTML = latest.map(t => `
          <blockquote>
            ${t.message}
            <span>- ${t.name}</span>
          </blockquote>
        `).join("");
      })
      .catch(() => {
        testimonyList.innerHTML = '<div style="color:gray;">Failed to load testimonies.</div>';
      });
  }
});

// --- DYNAMIC SERMON VERSES FOR SERMON PAGE (LIVE UPDATES, NO HARDCODED DEFAULTS) ---
if (
  document.body &&
  document.querySelector('.mission-belief') &&
  window.location.pathname.endsWith('sermon.html')
) {
  async function renderDynamicSermonVerses() {
    // Fetch from backend API
    try {
      const res = await fetch('https://bible-outdoor-backend.onrender.com/api/sermons');
      if (!res.ok) throw new Error('Failed to fetch verses');
      const verses = await res.json();
      const daily = verses.find(v => v.type === 'Daily');
      const weekly = verses.find(v => v.type === 'Weekly');
      const section = document.querySelector('.mission-belief');
      section.innerHTML = `
        <div>
          <h3>Daily Bible Verse</h3>
          ${
            daily
              ? `<p><strong>${daily.ref}</strong></p>
                  <blockquote>${daily.verse}</blockquote>
                  <p>${daily.teaching ? daily.teaching : ''}</p>`
              : `<div style="color:var(--primary);font-style:italic;">No daily verse available.</div>`
          }
        </div>
        <div>
          <h3>Weekly Bible Verse</h3>
          ${
            weekly
              ? `<p><strong>${weekly.ref}</strong></p>
                  <blockquote>${weekly.verse}</blockquote>
                  <p>${weekly.teaching ? weekly.teaching : ''}</p>`
              : `<div style="color:var(--primary);font-style:italic;">No weekly verse available.</div>`
          }
        </div>
      `;
    } catch (err) {
      // fallback to localStorage if offline
      const verses = JSON.parse(localStorage.getItem('sermonVerses') || '[]');
      const daily = verses.find(v => v.type === 'Daily');
      const weekly = verses.find(v => v.type === 'Weekly');
      const section = document.querySelector('.mission-belief');
      section.innerHTML = `
        <div>
          <h3>Daily Bible Verse</h3>
          ${
            daily
              ? `<p><strong>${daily.ref}</strong></p>
                  <blockquote>${daily.verse}</blockquote>
                  <p>${daily.teaching ? daily.teaching : ''}</p>`
              : `<div style="color:var(--primary);font-style:italic;">No daily verse available.</div>`
          }
        </div>
        <div>
          <h3>Weekly Bible Verse</h3>
          ${
            weekly
              ? `<p><strong>${weekly.ref}</strong></p>
                  <blockquote>${weekly.verse}</blockquote>
                  <p>${weekly.teaching ? weekly.teaching : ''}</p>`
              : `<div style="color:var(--primary);font-style:italic;">No weekly verse available.</div>`
          }
        </div>
      `;
    }
  }

  // Initial render
  renderDynamicSermonVerses();

  // Update verses when localStorage changes (even from another tab/window)
  window.addEventListener('storage', function (e) {
    if (e.key === 'sermonVerses') {
      renderDynamicSermonVerses();
    }
  });

  // OPTIONAL: Also listen for custom events in case the admin panel is in same tab (via iframe or SPA navigation)
  window.addEventListener('sermonVersesUpdated', renderDynamicSermonVerses);
}

function getYouTubeEmbedLink(url, liveMode=false) {
  if (!url) return "";

  // Remove whitespace
  url = url.trim();

  // 1. If already a full embed link, just use it
  if (url.includes('/embed/')) return url;

  // 2. If it's a "watch" link, extract video ID
  let match = url.match(/v=([\w-]{11})/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  }

  // 3. If it's a youtu.be short link
  match = url.match(/youtu\.be\/([\w-]{11})/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  }

  // 4. If it's a channel link and liveMode is true
  if (liveMode) {
    // Allow for both /channel/ID or /c/NAME
    let channelMatch = url.match(/channel\/([\w-]+)/);
    if (channelMatch) {
      return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}&autoplay=1`;
    }
    let customMatch = url.match(/youtube\.com\/c\/([A-Za-z0-9]+)/);
    if (customMatch) {
      // YouTube doesn't support live_stream?c= custom URLs directly; needs channel ID.
      // If you use custom URLs, consider storing the real channel ID instead!
      // Fallback to original link
      return url;
    }
  }

  // 5. If it's a full live_stream embed link
  if (url.includes('embed/live_stream?channel=')) return url;

  // 6. Fallback: return as is (may be playlist, etc)
  return url;
}

// --- DYNAMIC SUNDAY SERMON VIDEO LINK (LIVE UPDATING & SMART EMBED) ---
if (
  document.body &&
  document.getElementById('sermon-video-container') &&
  window.location.pathname.endsWith('sermon.html')
) {
  async function renderSermonVideo() {
    const container = document.getElementById('sermon-video-container');
    container.innerHTML = "";

    // Fetch latest Sunday Service settings from backend
    let svc = { youtube: '', live: false };
    try {
      const res = await fetch('https://bible-outdoor-backend.onrender.com/api/settings/sunday');
      if (res.ok) svc = await res.json();
    } catch (e) {}
    const link = svc.youtube && svc.youtube.trim() ? svc.youtube.trim() : "";

    // If live, try to generate a live embed; otherwise, show video embed
    const embedLink = getYouTubeEmbedLink(link, svc.live);

    if (svc.live && embedLink) {
      container.innerHTML = `
        <iframe width="100%" height="350" src="${embedLink}" title="Sunday Service Live" frameborder="0" allowfullscreen></iframe>
        <a href="${link}" target="_blank" style="margin:1em auto;display:block;max-width:180px;background:#e53935;color:#fff;text-align:center;border:none;padding:0.7em 1.5em;font-size:1em;border-radius:2em;font-weight:bold;cursor:pointer;text-decoration:none;">Watch Live</a>
      `;
    } else if (embedLink) {
      // Not live, just video
      // Extract video ID for thumbnail
      let videoId = "";
      let match = embedLink.match(/embed\/([\w-]{11})/);
      if (match) videoId = match[1];
      container.innerHTML = `
        <a href="${link}" target="_blank" style="display:inline-block;text-decoration:none;">
          <div style="position:relative;max-width:600px;margin:auto;border-radius:1rem;overflow:hidden;box-shadow:0 1px 8px #0002;">
            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Sermon Thumbnail" style="width:100%;display:block;">
            <img src="assets/play-button.png" alt="Play" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;">
          </div>
        </a>
        <a href="${link}" target="_blank" style="margin:1.2em auto 0 auto;display:block;max-width:240px;background:green;color:#fff;text-align:center;border:none;padding:0.7em 1.5em;font-size:1em;border-radius:2em;font-weight:bold;cursor:pointer;text-decoration:none;">Watch That Sermon</a>
      `;
    } else {
      container.innerHTML = `
        <div style="margin:2em 0;font-size:1.2em;color:var(--primary);">No recorded sermon is available.</div>
      `;
    }
  }

  // Initial render
  renderSermonVideo();

  // Optionally, update if localStorage changes (for admin preview)
  window.addEventListener('storage', function (e) {
    if (e.key === 'sundayService') renderSermonVideo();
  });

  // Optional: custom event for SPA/iframe usage
  window.addEventListener('sundayServiceUpdated', renderSermonVideo);
}

// --- DYNAMIC UPCOMING EVENTS NOTIFICATIONS (LIVE UPDATES, FLEXIBLE FIELDS) ---
if (
  document.body &&
  document.getElementById('notifications-section') &&
  window.location.pathname.endsWith('notifications.html')
) {
  function getEventList() {
    // Returns [] if not set
    return JSON.parse(localStorage.getItem('upcomingEvents') || '[]');
  }

  function renderNotifications() {
    const container = document.getElementById("notifications-section");
    const events = getEventList().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = "";

    if (!events.length) {
      container.innerHTML = `<div style="margin:2em auto;max-width:620px;text-align:center;color:var(--primary);font-size:1.1em;">No upcoming events at this time.</div>`;
      return;
    }

    events.forEach((event, i) => {
      const card = document.createElement("div");
      card.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1em;
        background: var(--white);
        border-radius: 1em;
        box-shadow: 0 1px 8px #0001;
        padding: 1em;
        margin: 1em auto;
        max-width: 760px;
        cursor: pointer;
        transition: background 0.2s;
      `;
      card.innerHTML = `
        <img src="${event.img || event.image || 'assets/event.png'}" alt="${event.host || event.speaker || ''}" style="width:70px;height:70px;border-radius:1em;object-fit:cover;">
        <div>
          <h3 style="margin:0;">${event.title || 'Untitled Event'}</h3>
          <div style="color:var(--gold);font-weight:bold;">${event.host || event.speaker || ''}</div>
          <div style="font-size:0.95em;color:gray;">${event.date ? event.date : ''}</div>
          <p style="margin:0.4em 0 0 0;">${event.desc || event.message || ''}</p>
        </div>
      `;
      card.addEventListener("click", () => showModal(event));
      container.appendChild(card);
    });
  }

  function showModal(event) {
    const modal = document.getElementById("notification-modal");
    const modalContent = document.getElementById("modal-content");
    modalContent.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:1.5em;">
        <img src="${event.img || event.image || 'assets/event.png'}" alt="${event.host || event.speaker || ''}" style="width:140px;height:140px;border-radius:1em;object-fit:cover;box-shadow:0 2px 12px #0002;">
        <div style="flex:1;min-width:200px;">
          <h2 style="margin:0 0 0.5em 0; color: var(--primary);">${event.title || 'Untitled Event'}</h2>
          <div style="font-weight:bold; color: var(--gold); font-size: 1.1em;">${event.host || event.speaker || ''}</div>
          <div style="font-size:0.95em;color:gray;margin:0.4em 0;">${event.date ? event.date : ''}</div>
          <p style="margin-top:0.5em; color: var(--dark);">${event.desc || event.message || ''}</p>
        </div>
      </div>
      <button onclick="hideModal()" style="margin-top:1.5em;background:var(--primary);color:#fff;border:none;padding:0.6em 1.5em;border-radius:2em;cursor:pointer;">Close</button>
    `;
    modal.style.display = "flex";
  }

  window.hideModal = function() {
    document.getElementById("notification-modal").style.display = "none";
  };

  renderNotifications();

  window.addEventListener('storage', function (e) {
    if (e.key === 'upcomingEvents') renderNotifications();
  });

  window.addEventListener('upcomingEventsUpdated', renderNotifications);

  document.getElementById("notification-modal").addEventListener("click", (e) => {
    if (e.target.id === "notification-modal") hideModal();
  });
}

// --- DYNAMIC CONTACT INFO FOR CONTACTS PAGE (LIVE UPDATES) ---
if (
  document.body &&
  document.getElementById('contact-content') &&
  window.location.pathname.endsWith('contacts.html')
) {
  function renderContactInfo() {
    const container = document.getElementById("contact-content");
    const info = JSON.parse(localStorage.getItem("contactInfo") || "null");

    // If not set, show default or "not available" message
    if (!info) {
      container.innerHTML = `
        <div style="color:var(--primary);margin:2em auto;font-style:italic;">
          Contact information is not available at this time.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="margin:2em auto;text-align:center;max-width:480px;">
        <div style="font-size:1.2em;font-weight:bold;margin-bottom:0.7em;">
          ${info.pastor || "Pastor"}
        </div>
        <div style="margin:0.5em 0;">
          <span style="font-weight:bold;">Phone:</span>
          <a href="tel:${info.phone || ''}" style="color:var(--primary);">${info.phone || 'N/A'}</a>
        </div>
        <div style="margin:0.5em 0;">
          <span style="font-weight:bold;">Email:</span>
          <a href="mailto:${info.email || ''}" style="color:var(--gold);">${info.email || 'N/A'}</a>
        </div>
        <div style="margin:0.5em 0;">
          <span style="font-weight:bold;">Address:</span>
          <span>${info.address || 'N/A'}</span>
        </div>
        <div style="margin:0.7em 0 0 0;">
          ${info.tiktok ? `<a href="${info.tiktok}" aria-label="Tiktok" target="_blank"><img src="assets/tiktok2.png" alt="Tiktok" style="width:36px;margin:0 6px;"></a>` : ""}
          ${info.facebook ? `<a href="${info.facebook}" aria-label="Facebook" target="_blank"><img src="assets/facebook2.png" alt="Facebook" style="width:36px;margin:0 6px;"></a>` : ""}
          ${info.youtube ? `<a href="${info.youtube}" aria-label="Youtube" target="_blank"><img src="assets/youtube.png" alt="Youtube" style="width:36px;margin:0 6px;"></a>` : ""}
        </div>
      </div>
    `;
  }

  // Initial render
  renderContactInfo();

  // Live update on localStorage change
  window.addEventListener('storage', function (e) {
    if (e.key === 'contactInfo') renderContactInfo();
  });

  // Optional: custom event for SPA/iframe admin updates
  window.addEventListener('contactInfoUpdated', renderContactInfo);
}


// --- DYNAMIC DONATION SETTINGS (PayPal, MPESA, Message) ---
if (
  document.body &&
  document.querySelector('.donation-container') &&
  window.location.pathname.endsWith('donation.html')
) {
  function renderDonationSettings() {
    const settings = JSON.parse(localStorage.getItem("donationSettings") || "{}");
    // Elements
    const donationSections = document.querySelectorAll('.donation-section');
    const container = document.querySelector('.donation-container');
    // Message (optional)
    if (settings.message && document.querySelector('.hero > p')) {
      document.querySelector('.hero > p').textContent = settings.message;
    }
    // PayPal
    if (donationSections[0]) {
      const paypalEmail = settings.paypal || "not set";
      const paypalLink = paypalEmail && paypalEmail !== "not set"
        ? `https://www.paypal.com/paypalme/${paypalEmail.replace(/@.*$/, '')}`
        : "#";
      donationSections[0].innerHTML = `
        <h3>Donate via PayPal</h3>
        <a href="${paypalLink}"
           target="_blank"
           rel="noopener"
           ${paypalEmail === "not set" ? 'onclick="return false;" style="pointer-events:none;opacity:0.5;"' : ''}>
          Donate with PayPal
        </a>
        <div class="donation-note">PayPal Email: ${paypalEmail}</div>
      `;
    }
    // MPESA
    if (donationSections[1]) {
      // Try to extract paybill/account from settings.mpesa
      let paybill = "400200", account = "01109098319900";
      if (settings.mpesa) {
        const pbMatch = settings.mpesa.match(/Paybill:\s*([0-9]+)/i);
        const acMatch = settings.mpesa.match(/Account:\s*([0-9]+)/i);
        paybill = pbMatch ? pbMatch[1] : paybill;
        account = acMatch ? acMatch[1] : account;
      }
      donationSections[1].innerHTML = `
        <h3>Donate via M-PESA</h3>
        <form id="mpesa-form">
          <input type="number" min="1" required placeholder="Amount (KES)" />
          <button type="submit">Send</button>
        </form>
        <div class="mpesa-instructions">
          M-PESA Paybill: <strong>${paybill}</strong> &nbsp;|&nbsp; Account: <strong>${account}</strong>
        </div>
      `;
    }
  }

  // Initial render
  renderDonationSettings();

  // Live update on settings change
  window.addEventListener('storage', function (e) {
    if (e.key === 'donationSettings') renderDonationSettings();
  });
  window.addEventListener('donationSettingsUpdated', renderDonationSettings);
}



function renderSiteSettings() {
  const site = JSON.parse(localStorage.getItem('siteSettings') || '{}');
  // Title: preserve page-specific prefix, update only the main site title
  if(site.title) {
    // Split current title on the last '|' or '-' (common separators)
    let current = document.title;
    let newTitle = site.title;
    let sepMatch = current.match(/^(.*?)([\-|\|])\s*([^\-|\|]*)$/);
    if (sepMatch) {
      // Keep the prefix and separator, replace the main title
      document.title = `${sepMatch[1].trim()}${sepMatch[2]} ${site.title}`;
    } else {
      // If no separator, just use the new title
      document.title = site.title;
    }
  }
  // Favicon
  if(site.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = site.favicon;
  }
  // Footer text
  const footerText = document.querySelector('footer .footer-contact div:last-child');
  if(site.footer && footerText) footerText.innerHTML = site.footer;
  // Social links
  if(site.youtube) {
    document.querySelectorAll('a[aria-label="Youtube"]').forEach(a => a.href = site.youtube);
  }
  if(site.facebook) {
    document.querySelectorAll('a[aria-label="Facebook"]').forEach(a => a.href = site.facebook);
  }
  if(site.tiktok) {
    document.querySelectorAll('a[aria-label="Tiktok"]').forEach(a => a.href = site.tiktok);
  }
}
document.addEventListener('DOMContentLoaded', renderSiteSettings);
window.addEventListener('siteSettingsUpdated', renderSiteSettings);
window.addEventListener('storage', function(e){
  if(e.key === 'siteSettings') renderSiteSettings();
});

async function fetchAndApplySiteSettings() {
  try {
    const res = await fetch('https://bible-outdoor-backend.onrender.com/api/settings/site');
    if (res.ok) {
      const site = await res.json();
      localStorage.setItem('siteSettings', JSON.stringify(site));
      window.dispatchEvent(new Event('siteSettingsUpdated'));
    }
  } catch (e) {
    // Optionally handle error (offline fallback)
  }
}

document.addEventListener('DOMContentLoaded', fetchAndApplySiteSettings);