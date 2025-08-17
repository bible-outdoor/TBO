// --- PATCH: Restore all product and review logic from inline script ---
// --- Modal logic ---
function openModal(id){ document.getElementById(id).classList.add('active'); }
function closeModal(id){ document.getElementById(id).classList.remove('active'); }

// --- Fetch order contact info from backend ---
let ORDER_EMAIL = "";
let ORDER_WHATSAPP = "";

async function fetchOrderContacts() {
  try {
    const res = await fetch('https://tbo-qyda.onrender.com/api/settings/site');
    if (!res.ok) throw new Error('Failed to fetch site settings');
    const data = await res.json();
    ORDER_EMAIL = data.email || "";
    ORDER_WHATSAPP = (data.phone || "").replace(/^\+/, "").replace(/\D/g, "");
  } catch {
    ORDER_EMAIL = "";
    ORDER_WHATSAPP = "";
  }
}

// Button interactions
function setupContactButtons() {
  document.getElementById('scan-email').onclick = () => {
    const body = encodeURIComponent("I need a full scan.");
    const subject = encodeURIComponent("Health Scan Request");
    if (ORDER_EMAIL)
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${ORDER_EMAIL}&su=${subject}&body=${body}`, "_blank");
  };
  document.getElementById('scan-whatsapp').onclick = ()=>{
    if (ORDER_WHATSAPP)
      window.open(`https://wa.me/${ORDER_WHATSAPP}?text=I%20need%20a%20full%20scan`, "_blank");
  };
  document.getElementById('therapy-email').onclick = () => {
    const body = encodeURIComponent("I need a therapy.");
    const subject = encodeURIComponent("Therapy Request");
    if (ORDER_EMAIL)
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${ORDER_EMAIL}&su=${subject}&body=${body}`, "_blank");
  };
  document.getElementById('therapy-whatsapp').onclick = ()=>{
    if (ORDER_WHATSAPP)
      window.open(`https://wa.me/${ORDER_WHATSAPP}?text=I%20need%20a%20therapy`, "_blank");
  };
}

// --- PRODUCTS: Fetch from backend API ---
const perPage = 12;
let prodSort = 'date-desc', prodPage = 1, prodView = [], allProducts = [];
let productSearchTerm = '';

async function fetchProducts() {
  try {
    const res = await fetch('https://tbo-qyda.onrender.com/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (e) {
    return [];
  }
}

function renderProducts() {
  prodView = allProducts.slice();
  // Filter by search term
  if (productSearchTerm.trim()) {
    const term = productSearchTerm.trim().toLowerCase();
    prodView = prodView.filter(prod =>
      (prod.name && prod.name.toLowerCase().includes(term)) ||
      (prod.desc && prod.desc.toLowerCase().includes(term))
    );
  }
  if (prodSort === 'date-desc') prodView.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (prodSort === 'price-low') prodView.sort((a, b) => a.price - b.price);
  else if (prodSort === 'price-high') prodView.sort((a, b) => b.price - a.price);

  const start = (prodPage - 1) * perPage, end = start + perPage;
  const pageItems = prodView.slice(start, end);

  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  pageItems.forEach(prod => {
    let div = document.createElement('div');
    div.className = 'product-thumb';
    div.innerHTML = `<img src="${prod.img}" alt="${prod.name}" /><p class="prod-name">${prod.name}</p><p class="prod-price">KSH ${prod.price.toLocaleString()}</p>`;
    div.onclick = () => showProductModal(prod);
    grid.appendChild(div);
  });

  const nPages = Math.ceil(prodView.length / perPage);
  let pag = '';
  if (nPages > 1) {
    pag = `Page ${prodPage} of ${nPages} `;
    pag += `<button onclick="prodPrev()" ${prodPage === 1 ? 'disabled' : ''}>Previous</button>`;
    pag += `<button onclick="prodNext()" ${prodPage === nPages ? 'disabled' : ''}>Next</button>`;
  }
  document.getElementById('prod-pagination').innerHTML = pag;
}

function prodPrev() { if (prodPage > 1) { prodPage--; renderProducts(); } }
function prodNext() { if (prodPage < Math.ceil(prodView.length / perPage)) { prodPage++; renderProducts(); } }

document.getElementById('filter-select').onchange = function () {
  prodSort = this.value;
  prodPage = 1;
  renderProducts();
};

function showProductModal(prod) {
  const box = document.getElementById('modal-product');
  box.innerHTML = `<button class="close-modal" onclick="closeModal('modal-product-bg')">&times;</button>
    <img src="${prod.img}" alt="${prod.name}" class="prod-modal-img" />
    <h2>${prod.name}</h2>
    <p class="prod-modal-price">KSH ${prod.price.toLocaleString()}</p>
    <div class="prod-modal-desc">${prod.desc}</div>
    <button class="make-order-btn">Make Order</button>
  `;
  box.querySelector('.make-order-btn').onclick = function () {
    openOrderModal(prod);
  };
  openModal('modal-product-bg');
}

function openOrderModal(prod){
  openModal('modal-order-bg');
  const orderMsg = `Can I get ${prod.name}`;
  document.getElementById('order-msg').value = orderMsg;

  document.getElementById('order-email').onclick = function () {
    const body = encodeURIComponent(orderMsg);
    const subject = encodeURIComponent("Product Order");
    if (ORDER_EMAIL)
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${ORDER_EMAIL}&su=${subject}&body=${body}`, "_blank");
  };

  document.getElementById('order-whatsapp').onclick = function(){
    const encodedMsg = encodeURIComponent(orderMsg);
    if (ORDER_WHATSAPP)
      window.open(`https://wa.me/${ORDER_WHATSAPP}?text=${encodedMsg}`, "_blank");
  };
}

// On load, if hash, scroll to products
window.onload = async function () {
  await fetchOrderContacts();
  setupContactButtons();
  if (window.location.hash === '#products-section') {
    document.getElementById('products-section').style.display = 'block';
  }
  allProducts = (await fetchProducts()).map(prod => ({
    ...prod,
    img: prod.imageUrl || "" // Map imageUrl to img for compatibility
  }));
  renderProducts();
  // Add search event
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      productSearchTerm = this.value;
      prodPage = 1;
      renderProducts();
    });
  }
};
window.prodPrev = prodPrev;
window.prodNext = prodNext;

window.addEventListener('productsUpdated', async function() {
  allProducts = await fetchProducts();
  renderProducts();
});

// --- Only logged-in users can submit reviews ---
function renderReviewForm() {
  const wrapper = document.getElementById("review-form-wrapper");
  let member = null;
  let token = null;
  try {
    member = JSON.parse(localStorage.getItem("tbo_member"));
  } catch {}
  token = localStorage.getItem("tbo_member_jwt");
  if (token && member && typeof member === 'object' && member.name && member.email) {
    wrapper.innerHTML = `
      <form id="review-form">
        <textarea id="review-message" placeholder="Write your feedback here..." required></textarea>
        <select id="review-rating" required>
          <option value="">Rate us</option>
          <option value="5">★★★★★ (Excellent)</option>
          <option value="4">★★★★☆ (Good)</option>
          <option value="3">★★★☆☆ (Average)</option>
          <option value="2">★★☆☆☆ (Poor)</option>
          <option value="1">★☆☆☆☆ (Terrible)</option>
        </select>
        <button type="submit">Submit Review</button>
      </form>
    `;
  } else {
    wrapper.innerHTML = `
      <p style="color: var(--primary); font-weight: bold; margin-top: 1em;">
        Please <a href="index.html#login" style="color: var(--gold); text-decoration: underline;">log in</a> to submit a review.
      </p>
    `;
  }
  const form = document.getElementById("review-form");
  if (form) {
    form.onsubmit = function (e) {
      e.preventDefault();
      let member = null;
      let token = null;
      try {
        member = JSON.parse(localStorage.getItem("tbo_member"));
      } catch {}
      token = localStorage.getItem("tbo_member_jwt");
      if (!(token && member && member.name && member.email)) {
        alert("You must be logged in to submit a review.");
        return;
      }
      const newReview = {
        name: member.name,
        email: member.email,
        message: document.getElementById("review-message").value.trim(),
        rating: parseInt(document.getElementById("review-rating").value),
        date: new Date().toISOString()
      };
      const allReviews = JSON.parse(localStorage.getItem("tbo_reviews") || "[]");
      allReviews.push(newReview);
      localStorage.setItem("tbo_reviews", JSON.stringify(allReviews));
      form.reset();
      renderReviews();
    };
  }
}

document.addEventListener("DOMContentLoaded", renderReviewForm);
window.addEventListener("storage", function(e) {
  if (e.key === "tbo_logged_user" || e.key === "tbo_users") renderReviewForm();
});

function renderReviews() {
  const all = JSON.parse(localStorage.getItem("tbo_reviews") || "[]");
  const reviews = [...all].reverse();
  const container = document.getElementById("review-list");
  const toggleBtn = document.getElementById("toggle-reviews-btn");
  let member = null;
  try {
    member = JSON.parse(localStorage.getItem("tbo_member"));
  } catch {}
  const currentUser = member && member.name ? member : null;

  function formatStars(rating) {
    return "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);
  }

  container.innerHTML = '';
  const top3 = reviews.slice(0, 3);

  function createReviewHTML(r, index) {
    const isOwner = currentUser && currentUser.name === r.name && currentUser.email === r.email;
    return `
      <div class="review" data-index="${index}">
        <p class="review-text">“${r.message}”</p>
        <span class="review-author">– ${r.name} ${formatStars(r.rating)}</span>
        <span class="review-date">${new Date(r.date).toLocaleDateString()}</span>
        ${isOwner ? `
          <div style="margin-top:0.5em;">
            <button class="edit-review-btn" data-index="${index}" style="margin-right:0.5em;">Edit</button>
            <button class="delete-review-btn" data-index="${index}">Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderList(list) {
    container.innerHTML = list.map(createReviewHTML).join("");
    attachReviewActions();
  }

  function attachReviewActions() {
    document.querySelectorAll(".delete-review-btn").forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.index);
        all.splice(all.length - 1 - index, 1);
        localStorage.setItem("tbo_reviews", JSON.stringify(all));
        renderReviews();
      };
    });

    document.querySelectorAll(".edit-review-btn").forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.index);
        const rev = reviews[index];
        const div = btn.closest(".review");
        const textP = div.querySelector(".review-text");
        const oldText = rev.message;
        const oldRating = rev.rating;

        textP.innerHTML = `
          <textarea style="width:100%;margin-bottom:0.5em;">${oldText}</textarea>
          <select style="margin-bottom:0.5em;">
            <option value="5" ${oldRating==5?"selected":""}>★★★★★</option>
            <option value="4" ${oldRating==4?"selected":""}>★★★★☆</option>
            <option value="3" ${oldRating==3?"selected":""}>★★★☆☆</option>
            <option value="2" ${oldRating==2?"selected":""}>★★☆☆☆</option>
            <option value="1" ${oldRating==1?"selected":""}>★☆☆☆☆</option>
          </select><br>
          <button class="save-edit-btn">Save</button>
        `;

        div.querySelector(".save-edit-btn").onclick = () => {
          const newMsg = div.querySelector("textarea").value.trim();
          const newRating = parseInt(div.querySelector("select").value);
          if (newMsg && newRating) {
            const realIndex = all.length - 1 - index;
            all[realIndex].message = newMsg;
            all[realIndex].rating = newRating;
            localStorage.setItem("tbo_reviews", JSON.stringify(all));
            renderReviews();
          }
        };
      };
    });
  }

  renderList(top3);

  if (reviews.length > 3) {
    toggleBtn.style.display = "inline-block";
    let expanded = false;
    toggleBtn.onclick = () => {
      expanded = !expanded;
      renderList(expanded ? reviews : top3);
      toggleBtn.textContent = expanded ? "Show Less" : "View More Reviews";
    };
  } else {
    toggleBtn.style.display = "none";
  }

  // Average rating
  const total = reviews.length;
  const avg = total ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total) : 0;
  const stars = "★★★★★☆☆☆☆☆".slice(5 - Math.round(avg), 10 - Math.round(avg));
  document.getElementById("avg-stars").textContent = stars;
  document.getElementById("avg-score").textContent = avg.toFixed(1) + "/5";
  document.getElementById("review-count").textContent = `Based on ${total} review${total !== 1 ? "s" : ""}`;
}
document.addEventListener("DOMContentLoaded", renderReviews);
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('btn-scan').onclick = ()=> openModal('modal-scan-bg');
  document.getElementById('btn-therapy').onclick = ()=> openModal('modal-therapy-bg');
  document.getElementById('btn-products').onclick = () => {
    const section = document.getElementById('products-section');
    if (section.style.display === 'block') {
      section.style.display = 'none';
      history.replaceState(null, null, ' ');
    } else {
      section.style.display = 'block';
      window.location.hash = '#products-section';
    }
  };
});