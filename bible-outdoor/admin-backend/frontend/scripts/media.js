// Fetch gallery data from backend API, fallback to localStorage if offline
async function getGalleryData() {
  try {
    const res = await fetch('https://bible-outdoor-backend.onrender.com/api/media');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    // Normalize for frontend: type: 'img'|'video' -> 'image'|'video', src: data
    return data.map(item => ({
      ...item,
      type: item.type === 'img' ? 'image' : item.type,
      src: item.data,
    }));
  } catch {
    // fallback to localStorage (legacy)
    return JSON.parse(localStorage.getItem('mediaArchive') || '[]')
      .map(item => ({
        ...item,
        type: item.type === 'img' ? 'image' : item.type,
        src: item.data,
      }));
  }
}

async function renderGallery() {
  const filterType = document.getElementById('filter-type').value;
  const filterYear = document.getElementById('filter-year').value;
  const container = document.getElementById('galleryGrid');
  container.innerHTML = '';

  // Always fetch latest gallery data
  window.galleryData = await getGalleryData();

  const filtered = window.galleryData
    .filter(item => (filterType === 'all' || item.type === filterType))
    .filter(item => (filterYear === 'all' || (item.date && item.date.startsWith(filterYear))))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    const msg = document.createElement('div');
    msg.textContent = "No media found for selected filters.";
    msg.style.textAlign = "center";
    msg.style.padding = "2em";
    msg.style.color = "var(--primary)";
    msg.style.fontWeight = "bold";
    container.appendChild(msg);
    return;
  }

  filtered.forEach(item => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.innerHTML =
      item.type === 'video'
        ? `<video controls preload="none" style="width:100%;height:120px;border-radius:0.6em;cursor:zoom-in;">
             <source src="${item.src}" type="video/mp4">
             Your browser does not support video.
           </video>`
        : `<img src="${item.src}" alt="${item.title}" style="width:100%;max-height:120px;object-fit:contain;border-radius:0.6em;background:#f8f8f8;cursor:zoom-in;">`;

    div.innerHTML += `
      <h4 style="margin:0.5em 0 0.2em 0;">${item.title}</h4>
      <div style="font-size:0.9em;color:gray;">${item.date}</div>
    `;

    container.appendChild(div);
  });

  // Reattach lightbox click handlers
  if (typeof initLightbox === 'function') initLightbox();
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('filter-type').onchange = renderGallery;
  document.getElementById('filter-year').onchange = renderGallery;
  renderGallery();
});

// Listen for custom event to re-render on admin update
window.addEventListener('mediaArchiveUpdated', renderGallery);