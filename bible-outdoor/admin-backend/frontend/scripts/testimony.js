document.addEventListener("DOMContentLoaded", function () {
      const list = document.getElementById("testimony-list");
      if (!list) return;

      const testimonies = JSON.parse(localStorage.getItem("tbo_testimonies") || "[]")
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 2); // Show top 2 most recent

      if (testimonies.length === 0) {
        list.innerHTML = `<p style="color:gray;font-style:italic;">No testimonies shared yet.</p>`;
        return;
      }

      list.innerHTML = testimonies
        .map(t => `
          <blockquote>
            “${t.message.replace(/\n/g, "<br>")}”
            <span>– ${t.name}</span>
          </blockquote>
        `)
        .join("");
    });


    document.addEventListener("DOMContentLoaded", function () {
      const modal = document.getElementById("testimony-modal");
      const openBtn = document.getElementById("testimony-btn");
      const closeBtn = document.getElementById("close-testimony-modal");
      const form = document.getElementById("testimony-form");
      const successBox = document.getElementById("testimony-success");

      if (openBtn) {
        openBtn.addEventListener("click", function () {
          modal.style.display = "flex";
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          modal.style.display = "none";
          form.reset();
          successBox.style.display = "none";
        });
      }

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const message = document.getElementById("testimony-message").value.trim();
        const member = JSON.parse(localStorage.getItem("tbo_member"));
        if (message && member) {
          const newTestimony = {
            name: member.name,
            message,
            date: new Date().toISOString()
          };
          // Try to send to backend
          try {
            await fetch('https://tbo-c5wk.onrender.com/api/testimonies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newTestimony)
            });
          } catch (err) {
            // Fallback: save to localStorage if backend fails
            const existing = JSON.parse(localStorage.getItem("tbo_testimonies") || "[]");
            existing.push(newTestimony);
            localStorage.setItem("tbo_testimonies", JSON.stringify(existing));
          }
          form.reset();
          successBox.textContent = "🎉 Your testimony has been submitted. Thank you!";
          successBox.style.display = "block";

          setTimeout(() => {
            successBox.style.display = "none";
            modal.style.display = "none";
          }, 1000);
        }
      });

      // Close modal if clicking outside the box
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
          form.reset();
          successBox.style.display = "none";
        }
      });
    });
    document.addEventListener("DOMContentLoaded", function () {
      const section = document.getElementById("testimony-section");
      const member = JSON.parse(localStorage.getItem("tbo_member"));
      if (member) {
        section.style.display = "block";
      } else {
        section.style.display = "none";
      }
    });

    function renderGallery() {
      const filterType = document.getElementById('filter-type').value;
      const filterYear = document.getElementById('filter-year').value;
      const container = document.getElementById('galleryGrid');
      container.innerHTML = '';
  
      const filtered = galleryData
        .filter(item => (filterType === 'all' || item.type === filterType))
        .filter(item => (filterYear === 'all' || item.date.startsWith(filterYear)))
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
        div.style.width = '100%'; // will be controlled by CSS grid
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
