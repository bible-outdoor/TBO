document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("training-library");
    const filter = document.getElementById("filter-select");

    async function fetchLibraryItems() {
      try {
        const res = await fetch('https://bible-outdoor-backend.onrender.com/api/library');
        if (!res.ok) throw new Error('API error');
        return await res.json();
      } catch {
        // fallback to localStorage (legacy, optional)
        return JSON.parse(localStorage.getItem('libraryItems') || '[]');
      }
    }

    async function renderLibrary(selectedType = 'all') {
      const filterType = selectedType || document.getElementById('filter-select')?.value || 'all';
      const container = document.getElementById('training-library');
      if (!container) return;
      container.innerHTML = '';

      const items = await fetchLibraryItems();
      // Sort items by date (assuming item.date exists and is ISO or comparable)
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      const filtered = items.filter(
        item => filterType === 'all' || item.type === filterType
      );

      if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:2em;color:var(--primary);font-weight:bold;">No resources found for selected filter.</div>`;
        return;
      }

      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';

        let fileUrl = item.file;
        // For videos and audio, we insert a transformation into the URL (`q_auto`)
        // to ensure the browser plays them inline instead of forcing a download.
        if ((item.type === 'video' || item.type === 'audio') && item.file) {
          const uploadMarker = '/upload/';
          const uploadIndex = fileUrl.indexOf(uploadMarker);

          if (uploadIndex !== -1) {
            const urlPrefix = fileUrl.substring(0, uploadIndex + uploadMarker.length);
            const urlSuffix = fileUrl.substring(uploadIndex + uploadMarker.length);
            // A URL without transformations has a version number (e.g., v12345)
            // immediately after /upload/. If it's not there, a transformation
            // is likely already present, so we don't add another one.
            if (/^v\d+\//.test(urlSuffix)) {
              fileUrl = `${urlPrefix}q_auto/${urlSuffix}`;
            }
          }
        }

        card.innerHTML = `
          <img src="${item.cover}" alt="${item.title}" class="library-cover-img" />
          <div class="media-info">
            <span class="media-title">${item.title}</span>
            <p class="media-caption">${item.description}</p>
            <button class="media-download-btn" onclick="openPublicLibraryFileModal('${fileUrl}','${item.type}','${item.title.replace(/'/g, "&#39;") || ''}')">View / Download</button>
          </div>
        `;
        container.appendChild(card);
      });
    }

    renderLibrary();

    if (filter) {
      filter.onchange = function () {
        renderLibrary(this.value);
      };
    }

    // Update in real-time if admin updates resources (from another tab)
    window.addEventListener('storage', function(e) {
      if (e.key === 'trainingLibrary') renderLibrary(filter ? filter.value : "all");
    });
    window.addEventListener('trainingLibraryUpdated', function() {
      renderLibrary(filter ? filter.value : "all");
    });
  });
    // Later: You’ll dynamically load resources here

// Add modal preview logic for public library
function openPublicLibraryFileModal(fileUrl, type, title) {
  // Remove any existing modal
  const existing = document.getElementById('public-library-file-modal');
  if (existing) existing.remove();

  function isPdf(url) {
    return url && url.toLowerCase().endsWith('.pdf');
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  overlay.id = 'public-library-file-modal';

  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.style.maxWidth = '90vw';
  modal.style.width = 'min(600px, 98vw)';

  let previewHtml = '';
  if (type === 'pdf' || isPdf(fileUrl)) {
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
    <button class="close-btn" onclick="document.getElementById('public-library-file-modal').remove()">×</button>
    <h3 style="margin-bottom:1em;">${title || 'Preview'}</h3>
    <div style="text-align:center; margin-bottom:1.2em;">
      ${previewHtml}
    </div>
    <a href="${fileUrl}" download class="media-btn" style="margin-top:1em;">Download</a>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
window.openPublicLibraryFileModal = openPublicLibraryFileModal;