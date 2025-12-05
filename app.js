/* app.js — Plant a Tree  */
/* API endpoints used:
   - categories: https://openapi.programming-hero.com/api/categories
   - plants by category: https://openapi.programming-hero.com/api/category/${id}
   - plant detail: https://openapi.programming-hero.com/api/plant/${id}
   - all plants: https://openapi.programming-hero.com/api/plants  (not used directly but available)
*/

const categoryContainer = document.getElementById("category-container");
const plantContainer = document.getElementById("plant-container");
const spinner = document.getElementById("spinner");
const cartListEl = document.getElementById("cart-list");
const totalPriceEl = document.getElementById("total-price");

// modal elements
const detailsModal = document.getElementById("detailsModal");
const modalName = document.getElementById("modal-name");
const modalImg = document.getElementById("modal-img");
const modalDesc = document.getElementById("modal-desc");
const modalCat = document.getElementById("modal-cat");
const modalPrice = document.getElementById("modal-price");

let cart = [];
let totalPrice = 0;

/* ---------- utility: safe JSON path ---------- */
function extractListFromResponse(resp) {
  // some endpoints use { categories: [...] } or { plants: [...] } or { data: [...] }
  if (!resp) return [];
  if (Array.isArray(resp.categories)) return resp.categories;
  if (Array.isArray(resp.plants)) return resp.plants;
  if (Array.isArray(resp.data)) return resp.data;
  return [];
}

/* ================== LOAD CATEGORIES ================== */
async function loadCategories() {
  try {
    const res = await fetch(
      "https://openapi.programming-hero.com/api/categories"
    );
    const data = await res.json();

    // response sample may put categories in data.categories or data.data
    const categories = data.categories || data.data || data;
    // defensive: if it's object with key 'categories'
    const list = Array.isArray(categories)
      ? categories
      : extractListFromResponse(data);

    // clear
    categoryContainer.innerHTML = "";

    // add an "All" button to fetch all plants
    const allBtn = document.createElement("button");
    allBtn.className = "btn btn-outline w-full";
    allBtn.innerText = "All";
    allBtn.onclick = () => loadAllPlants(allBtn);
    categoryContainer.appendChild(allBtn);

    list.forEach((cat) => {
      // some responses have category_name (see sample) or category
      const label = cat.category_name || cat.category || cat.name || "Unknown";
      const id = cat.id ?? cat.category_id ?? cat.cat_id ?? null;
      const btn = document.createElement("button");
      btn.className = "btn btn-outline w-full text-sm";
      btn.innerText = label;
      // if no id, clicking does nothing
      btn.onclick = () => {
        if (id) loadPlantsByCategory(id, btn);
      };
      categoryContainer.appendChild(btn);
    });

    // Optionally load first category automatically (click first real category)
    const firstReal = categoryContainer.querySelectorAll("button")[1]; // index 0 is All
    if (firstReal) firstReal.click();
  } catch (err) {
    console.error("Failed to load categories:", err);
    categoryContainer.innerHTML =
      "<p class='text-sm text-red-600'>Failed to load categories.</p>";
  }
}

/* ========== LOAD ALL PLANTS (if All button clicked) ========== */
async function loadAllPlants(btn) {
  showSpinner(true);
  setActiveButton(btn);
  try {
    const res = await fetch("https://openapi.programming-hero.com/api/plants");
    const data = await res.json();
    // data.plants likely contains array
    const list = data.plants || data.data || extractListFromResponse(data);
    displayPlants(list || []);
  } catch (err) {
    console.error("Failed to load all plants:", err);
    plantContainer.innerHTML =
      "<p class='text-red-600'>Failed to load plants.</p>";
  } finally {
    setTimeout(() => showSpinner(false), 400);
  }
}

/* ================== LOAD PLANTS BY CATEGORY ================== */
async function loadPlantsByCategory(id, btn) {
  showSpinner(true);
  plantContainer.innerHTML = "";
  setActiveButton(btn);

  try {
    // correct endpoint per your info:
    const res = await fetch(
      `https://openapi.programming-hero.com/api/category/${id}`
    );
    const data = await res.json();

    // response sample shows { status:true, message:..., plants:[...]} or message "no plant"
    const plants =
      data.plants || data.data || data.plants || extractListFromResponse(data);
    if (!plants || plants.length === 0) {
      plantContainer.innerHTML =
        "<p class='text-gray-600'>No plants found in this category.</p>";
    } else {
      displayPlants(plants);
    }
  } catch (err) {
    console.error("Failed to load plants by category:", err);
    plantContainer.innerHTML =
      "<p class='text-red-600'>Failed to load plants.</p>";
  } finally {
    setTimeout(() => showSpinner(false), 400);
  }
}

/* helper: show/hide spinner */
function showSpinner(show) {
  if (!spinner) return;
  spinner.classList.toggle("hidden", !show);
}

/* helper: active button state */
function setActiveButton(btn) {
  document
    .querySelectorAll("#category-container button")
    .forEach((b) => b.classList.remove("active-btn"));
  if (btn) btn.classList.add("active-btn");
}

/* ================== DISPLAY PLANT CARDS ================== */
function displayPlants(plants) {
  plantContainer.innerHTML = "";
  if (!plants || plants.length === 0) {
    plantContainer.innerHTML =
      "<p class='text-gray-600'>No plants to display.</p>";
    return;
  }

  plants.forEach((tree) => {
    // ensure shape: some API items may use different field names
    const id = tree.id ?? tree._id ?? tree.plant_id ?? null;
    const image = tree.image ?? tree.img ?? tree.thumbnail ?? "";
    const name = tree.name ?? tree.title ?? "Unnamed";
    const desc = tree.description ?? tree.short_description ?? "";
    const category = tree.category ?? tree.category_name ?? "";
    const price = tree.price ?? tree.cost ?? 0;

    const card = document.createElement("div");
    card.className = "bg-white border rounded-lg shadow p-4 flex flex-col";

    card.innerHTML = `
      <img src="${image}" alt="${name}" class="w-full h-40 object-cover rounded-md mb-3"/>
      <h4 class="font-semibold text-lg text-green-700 cursor-pointer" ${
        id ? `onclick="showDetails(${id})"` : ""
      }>${name}</h4>
      <p class="text-sm text-gray-700 mt-2 flex-grow">${(desc || "").slice(
        0,
        120
      )}${desc && desc.length > 120 ? "..." : ""}</p>
      <div class="mt-3 text-sm text-gray-800"><strong>Category:</strong> ${category}</div>
      <div class="mt-1 text-sm text-gray-800 font-semibold">Price: $${price}</div>
      <button class="mt-4 bg-green-600 text-white py-2 rounded" onclick="addToCart('${escapeQuotes(
        name
      )}', ${Number(price)})">Add to Cart</button>
    `;
    plantContainer.appendChild(card);
  });
}

/* small helper to escape single quotes inside names when inserted into onclick string */
function escapeQuotes(s) {
  return String(s).replace(/'/g, "\\'");
}

/* ================== SHOW DETAILS (modal) ================== */
async function showDetails(id) {
  try {
    const res = await fetch(
      `https://openapi.programming-hero.com/api/plant/${id}`
    );
    const data = await res.json();
    // data.plants could be object or data.data
    const p = data.plants || data.data || data.plant || data;
    // try multiple shapes
    const plant =
      typeof p === "object" && !Array.isArray(p)
        ? p
        : Array.isArray(p) && p[0]
        ? p[0]
        : null;
    if (!plant) {
      modalName.innerText = "Details not available";
      modalDesc.innerText = "";
      modalImg.src = "";
      modalCat.innerText = "";
      modalPrice.innerText = "";
    } else {
      modalName.innerText = plant.name ?? plant.title ?? "Unnamed";
      modalImg.src = plant.image ?? plant.img ?? "";
      modalDesc.innerText = plant.description ?? plant.long_description ?? "";
      modalCat.innerText = plant.category ?? plant.category_name ?? "";
      modalPrice.innerText = plant.price ?? plant.cost ?? "0";
    }
    detailsModal.showModal();
  } catch (err) {
    console.error("Failed to fetch plant details:", err);
    alert("Failed to load details.");
  }
}

/* ================== CART ================== */
function addToCart(name, price) {
  cart.push({ name, price });
  totalPrice += Number(price);
  updateCartUI();
}

function removeFromCart(index) {
  if (index < 0 || index >= cart.length) return;
  totalPrice -= Number(cart[index].price);
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  cartListEl.innerHTML = "";
  if (cart.length === 0) {
    cartListEl.innerHTML = `<li class="text-gray-500">Cart is empty</li>`;
  } else {
    cart.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className =
        "flex justify-between items-center bg-white p-2 rounded shadow";
      li.innerHTML = `
        <div>${item.name}</div>
        <div class="flex items-center gap-3">
          <div class="font-semibold">$${item.price}</div>
          <button class="text-red-600 font-bold" onclick="removeFromCart(${idx})">❌</button>
        </div>
      `;
      cartListEl.appendChild(li);
    });
  }
  totalPriceEl.innerText = totalPrice;
}

/* ================== initialize ================== */
document.addEventListener("DOMContentLoaded", () => {
  // set year
  document.getElementById("year").innerText = new Date().getFullYear();

  loadCategories();

  // donate form handling (simple)
  document.getElementById("donationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const email = f.email.value.trim();
    const count = Number(f.count.value) || 1;
    alert(
      `Thanks ${name}! You pledged to plant ${count} tree(s). We'll contact you at ${email}.`
    );
    f.reset();
  });

  // banner CTA scroll to trees
  document.getElementById("bannerCTA").addEventListener("click", () => {
    document.getElementById("trees").scrollIntoView({ behavior: "smooth" });
  });
});
