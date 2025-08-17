document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("training-library");
    const filter = document.getElementById("filter-select");

    async function fetchLibraryItems() {
      try {
        const res = await fetch('https://tbo-c5wk.onrender.com/api/library');
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
  modal.style.maxWidth = '95vw';
  modal.style.width = 'min(800px, 98vw)';
  modal.style.maxHeight = '90vh';
  modal.style.overflow = 'auto';

  let previewHtml = '';
  let downloadText = 'Download';
  
  if (type === 'pdf' || isPdf(fileUrl)) {
    // Enhanced PDF viewing with multiple options
    previewHtml = `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="switchPdfView('google')" class="media-btn pdf-view-btn active" id="google-view-btn">Google Docs View</button>
          <button onclick="switchPdfView('direct')" class="media-btn pdf-view-btn" id="direct-view-btn">Direct View</button>
          <button onclick="switchPdfView('download')" class="media-btn pdf-view-btn" id="download-view-btn">Download Only</button>
        </div>
        <div id="pdf-content">
          <iframe src="https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true" 
                  style="width:100%;height:60vh;border:none;border-radius:8px;" 
                  id="google-pdf-viewer"></iframe>
        </div>
      </div>
    `;
    downloadText = 'Download PDF';
  } else if (type === 'video') {
    previewHtml = `
      <video src="${fileUrl}" controls style="width:100%;max-height:60vh;border-radius:8px;" preload="metadata">
        Your browser does not support the video tag.
      </video>
    `;
    downloadText = 'Download Video';
  } else if (type === 'audio') {
    previewHtml = `
      <div style="background: var(--sky); padding: 2rem; border-radius: 8px; text-align: center;">
        <h4 style="margin-bottom: 1rem; color: var(--primary);">🎵 Audio File</h4>
        <audio src="${fileUrl}" controls style="width:100%;max-width:400px;">
          Your browser does not support the audio tag.
        </audio>
      </div>
    `;
    downloadText = 'Download Audio';
  } else if (type === 'img' || type === 'image') {
    previewHtml = `
      <div style="text-align: center;">
        <img src="${fileUrl}" alt="${title}" style="max-width:100%;max-height:60vh;border-radius:8px;box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
      </div>
    `;
    downloadText = 'Download Image';
  } else {
    // For other file types, show file info and download option
    const fileExtension = fileUrl.split('.').pop()?.toUpperCase() || 'FILE';
    previewHtml = `
      <div style="background: var(--sky); padding: 2rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
        <h4 style="margin-bottom: 0.5rem; color: var(--primary);">${fileExtension} File</h4>
        <p style="color: var(--text-alt); margin-bottom: 1rem;">Click download to save this file to your device</p>
      </div>
    `;
    downloadText = `Download ${fileExtension}`;
  }

  modal.innerHTML = `
    <button class="close-btn" onclick="document.getElementById('public-library-file-modal').remove()">×</button>
    <h3 style="margin-bottom:1em;color:var(--primary);text-align:center;">${title || 'Document Preview'}</h3>
    <div style="margin-bottom:1.2em;">
      ${previewHtml}
    </div>
    <div style="text-align:center;">
      <a href="${fileUrl}" download class="media-btn" style="margin-top:1em;display:inline-block;">
        📥 ${downloadText}
      </a>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add click outside to close functionality
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// Function to switch between different PDF viewing options
function switchPdfView(viewType) {
  const pdfContent = document.getElementById('pdf-content');
  const googleBtn = document.getElementById('google-view-btn');
  const directBtn = document.getElementById('direct-view-btn');
  const downloadBtn = document.getElementById('download-view-btn');
  
  // Remove active class from all buttons
  [googleBtn, directBtn, downloadBtn].forEach(btn => btn.classList.remove('active'));
  
  if (viewType === 'google') {
    googleBtn.classList.add('active');
    pdfContent.innerHTML = `
      <iframe src="https://docs.google.com/gview?url=${encodeURIComponent(currentPdfUrl)}&embedded=true" 
              style="width:100%;height:60vh;border:none;border-radius:8px;" 
              id="google-pdf-viewer"></iframe>
    `;
  } else if (viewType === 'direct') {
    directBtn.classList.add('active');
    pdfContent.innerHTML = `
      <iframe src="${currentPdfUrl}" 
              style="width:100%;height:60vh;border:none;border-radius:8px;" 
              id="direct-pdf-viewer"></iframe>
    `;
  } else if (viewType === 'download') {
    downloadBtn.classList.add('active');
    pdfContent.innerHTML = `
      <div style="background: var(--sky); padding: 2rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
        <h4 style="margin-bottom: 0.5rem; color: var(--primary);">PDF Document</h4>
        <p style="color: var(--text-alt); margin-bottom: 1rem;">Click the download button below to save this PDF to your device</p>
      </div>
    `;
  }
}

// Store current PDF URL for view switching
let currentPdfUrl = '';

// Update the openPublicLibraryFileModal to store the current PDF URL
function openPublicLibraryFileModal(fileUrl, type, title) {
  // Store current PDF URL for view switching
  if (type === 'pdf' || (fileUrl && fileUrl.toLowerCase().endsWith('.pdf'))) {
    currentPdfUrl = fileUrl;
  }
  
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
  modal.style.maxWidth = '95vw';
  modal.style.width = 'min(800px, 98vw)';
  modal.style.maxHeight = '90vh';
  modal.style.overflow = 'auto';

  let previewHtml = '';
  let downloadText = 'Download';
  
  if (type === 'pdf' || isPdf(fileUrl)) {
    // Enhanced PDF viewing with multiple options
    previewHtml = `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="switchPdfView('google')" class="media-btn pdf-view-btn active" id="google-view-btn">Google Docs View</button>
          <button onclick="switchPdfView('direct')" class="media-btn pdf-view-btn" id="direct-view-btn">Direct View</button>
          <button onclick="switchPdfView('download')" class="media-btn pdf-view-btn" id="download-view-btn">Download Only</button>
        </div>
        <div id="pdf-content">
          <iframe src="https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true" 
                  style="width:100%;height:60vh;border:none;border-radius:8px;" 
                  id="google-pdf-viewer"></iframe>
        </div>
      </div>
    `;
    downloadText = 'Download PDF';
  } else if (type === 'video') {
    previewHtml = `
      <video src="${fileUrl}" controls style="width:100%;max-height:60vh;border-radius:8px;" preload="metadata">
        Your browser does not support the video tag.
      </video>
    `;
    downloadText = 'Download Video';
  } else if (type === 'audio') {
    previewHtml = `
      <div style="background: var(--sky); padding: 2rem; border-radius: 8px; text-align: center;">
        <h4 style="margin-bottom: 1rem; color: var(--primary);">🎵 Audio File</h4>
        <audio src="${fileUrl}" controls style="width:100%;max-width:400px;">
          Your browser does not support the audio tag.
        </audio>
      </div>
    `;
    downloadText = 'Download Audio';
  } else if (type === 'img' || type === 'image') {
    previewHtml = `
      <div style="text-align: center;">
        <img src="${fileUrl}" alt="${title}" style="max-width:100%;max-height:60vh;border-radius:8px;box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
      </div>
    `;
    downloadText = 'Download Image';
  } else {
    // For other file types, show file info and download option
    const fileExtension = fileUrl.split('.').pop()?.toUpperCase() || 'FILE';
    previewHtml = `
      <div style="background: var(--sky); padding: 2rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
        <h4 style="margin-bottom: 0.5rem; color: var(--primary);">${fileExtension} File</h4>
        <p style="color: var(--text-alt); margin-bottom: 1rem;">Click download to save this file to your device</p>
      </div>
    `;
    downloadText = `Download ${fileExtension}`;
  }

  modal.innerHTML = `
    <button class="close-btn" onclick="document.getElementById('public-library-file-modal').remove()">×</button>
    <h3 style="margin-bottom:1em;color:var(--primary);text-align:center;">${title || 'Document Preview'}</h3>
    <div style="margin-bottom:1.2em;">
      ${previewHtml}
    </div>
    <div style="text-align:center;">
      <a href="${fileUrl}" download class="media-btn" style="margin-top:1em;display:inline-block;">
        📥 ${downloadText}
      </a>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add click outside to close functionality
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

window.openPublicLibraryFileModal = openPublicLibraryFileModal;
window.switchPdfView = switchPdfView;