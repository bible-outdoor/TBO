    // Lightbox modal logic
    document.addEventListener('DOMContentLoaded', function() {
      var modal = document.getElementById('lightbox-modal');
      var modalImg = document.getElementById('lightbox-img');
      var closeBtn = document.getElementById('lightbox-close');
  
      // Attach click event to all images with 'enlarge-on-click'
      function addLightboxHandlers() {
        document.querySelectorAll('img.enlarge-on-click').forEach(function(img) {
          img.style.cursor = 'zoom-in';
          img.onclick = function(e) {
            modalImg.src = this.src;
            modalImg.alt = this.alt || '';
            modal.style.display = 'flex';
          };
        });
      }
      addLightboxHandlers();
  
      closeBtn.onclick = function() { modal.style.display = 'none'; modalImg.src = ''; };
      modal.onclick = function(e) { if(e.target === modal) { modal.style.display = 'none'; modalImg.src = ''; } };
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') { modal.style.display = 'none'; modalImg.src = ''; } });
  
      // For dynamic images, call window.addLightboxHandlers() after render.
      window.addLightboxHandlers = addLightboxHandlers;
    });

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  const mediaElements = Array.from(document.querySelectorAll('#galleryGrid img, #galleryGrid video'));
  let currentIndex = 0;

  function showMedia(index) {
    if (index < 0) index = mediaElements.length - 1;
    if (index >= mediaElements.length) index = 0;
    currentIndex = index;

    const el = mediaElements[index];
    content.innerHTML = el.tagName === 'VIDEO'
      ? `<video controls autoplay style="max-width:100%;max-height:90vh;border-radius:1rem;">
           <source src="${el.currentSrc}" type="video/mp4">
         </video>`
      : `<img src="${el.src}" alt="" style="max-width:100%;max-height:90vh;border-radius:1rem;">`;

    modal.style.display = 'flex';
  }

  mediaElements.forEach((el, index) => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {
      showMedia(index);
    });
  });

  closeBtn.onclick = () => { modal.style.display = 'none'; content.innerHTML = ''; };
  prevBtn.onclick = () => showMedia(currentIndex - 1);
  nextBtn.onclick = () => showMedia(currentIndex + 1);

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      content.innerHTML = '';
    }
  };

  document.addEventListener('keydown', function (e) {
    if (modal.style.display !== 'flex') return;
    if (e.key === 'Escape') {
      modal.style.display = 'none';
      content.innerHTML = '';
    } else if (e.key === 'ArrowRight') {
      showMedia(currentIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      showMedia(currentIndex - 1);
    }
  });
}
