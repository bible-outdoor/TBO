document.addEventListener("DOMContentLoaded", async function () {
      const track = document.getElementById("carousel-track");
      const prevBtn = document.querySelector(".carousel-btn.prev");
      const nextBtn = document.querySelector(".carousel-btn.next");
      if (!track || typeof getGalleryData !== "function") return;

      // Use the function to get the latest media data
      const galleryData = await getGalleryData();
      const top3 = [...galleryData]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);

      // Clear previous items
      track.innerHTML = "";

      top3.forEach(item => {
        const link = document.createElement("a");
        link.href = "archives.html";
        link.className = "carousel-item";
        link.style.textDecoration = "none";
        link.style.color = "inherit";

        const media =
          item.type === "video"
            ? `<div style="aspect-ratio:1/1;width:110px;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:1em;background:#000;">
                <video style="width:100%;height:100%;object-fit:cover;" muted autoplay loop>
                  <source src="${item.src}" type="video/mp4">
                  Your browser does not support video.
                </video>
              </div>`
            : `<div style="aspect-ratio:1/1;width:110px;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:1em;background:#000;">
                <img src="${item.src}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;">
              </div>`;

        link.innerHTML = `
          ${media}
          <div>
            <strong>${item.title}</strong>
            <span>${item.date}</span>
            <p>${item.type === 'video' ? 'Video' : 'Photo'} event</p>
          </div>
        `;
        track.appendChild(link);
      });

      // Carousel sliding logic
      const items = track.querySelectorAll('.carousel-item');
      let idx = 0;
      function showCarouselItem(i) {
        items.forEach((item, j) => {
          item.style.display = j === i ? "flex" : "none";
        });
      }
      if (items.length) {
        showCarouselItem(idx);
        if (prevBtn && nextBtn) {
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
      }
    });
