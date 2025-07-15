// Script to dynamically apply global site settings (title, favicon, colors, socials, footer, location, etc.)

function renderSiteSettings() {
  const site = JSON.parse(localStorage.getItem('siteSettings') || '{}');
  // Site title
  if (site.title) document.title = site.title;

  // Favicon
  if (site.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = site.favicon;
  }


  // Footer text
  const footerContact = document.querySelector('footer .footer-contact');
  if (site.footer && footerContact) {
    // Last div is copyright by structure; so select the penultimate div for footer text
    const divs = footerContact.querySelectorAll('div');
    if (divs.length > 2) {
      divs[2].innerHTML = site.footer;
    }
  }

  // Location
  if (site.location && footerContact) {
    const divs = footerContact.querySelectorAll('div');
    if (divs.length > 0) {
      divs[0].textContent = site.location;
    }
  }

  // Social media links
  if (site.tiktok) {
    document.querySelectorAll('a[aria-label="Tiktok"]').forEach(a => a.href = site.tiktok);
  }
  if (site.facebook) {
    document.querySelectorAll('a[aria-label="Facebook"]').forEach(a => a.href = site.facebook);
  }
  if (site.youtube) {
    document.querySelectorAll('a[aria-label="Youtube"]').forEach(a => a.href = site.youtube);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', renderSiteSettings);
// Live update on localStorage or custom event
window.addEventListener('siteSettingsUpdated', renderSiteSettings);
window.addEventListener('storage', function (e) {
  if (e.key === 'siteSettings') renderSiteSettings();
});