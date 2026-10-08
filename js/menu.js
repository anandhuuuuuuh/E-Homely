/* E-HOMELY Menu Page */

"use strict";

const menus = {
  breakfast: { title: "Breakfast", items: [
    ["Puttu", "Steamed cylinders of rice flour layered with grated coconut.", 10],
    ["Appam", "Soft, lacy rice pancakes with crisp edges and a soft center.", 100],
    ["Idiyappam", "Steamed rice noodles pressed into soft, delicate strands.", 100],
    ["Dosa", "A thin, crispy fermented rice and lentil crepe.", 100],
    ["Kadala Curry", "A spicy black chickpea curry cooked in coconut and roasted spices.", 100],
    ["Chappathi", "Soft, round flatbread made from whole wheat, cooked on a griddle.", 100],
    ["Egg Roast", "Boiled eggs simmered in a thick onion-tomato masala.", 100],
    ["Boiled Egg", "A simple boiled egg, often served whole or halved.", 100]
  ]},
  lunch: { title: "Lunch", items: [
    ["Rice", "Steamed white rice, the staple base served with most Kerala meals.", 100],
    ["Sambar", "A lentil-based vegetable stew flavored with tamarind and spices.", 100],
    ["Rasam", "A thin, tangy and peppery soup made with tamarind and tomato.", 100],
    ["Avial", "Mixed vegetables cooked in coconut and yogurt gravy.", 100],
    ["Erissery", "A pumpkin and lentil curry topped with roasted coconut.", 100],
    ["Kerala Fish Curry", "A tangy, spicy curry made with fresh fish, coconut, and kudampuli.", 100],
    ["Biriyani", "Fragrant spiced rice layered and slow-cooked with meat or vegetables.", 100],
    ["Chicken Fry", "Spiced, deep-fried or pan-roasted chicken pieces with curry leaves.", 100],
    ["Boiled Egg", "A simple boiled egg, often served whole or halved.", 100]
  ]},
  dinner: { title: "Dinner", items: [
    ["Chappathi", "Soft, round flatbread made from whole wheat, cooked on a griddle.", 100],
    ["Stew", "A mild coconut-milk based curry with vegetables or chicken.", 100],
    ["Chicken Fry", "Spiced, deep-fried or pan-roasted chicken pieces with curry leaves.", 100],
    ["Egg Roast", "Boiled eggs simmered in a thick onion-tomato masala.", 100],
    ["Appam", "Soft, lacy rice pancakes with crisp edges and a soft center.", 100],
    ["Idiyappam", "Steamed rice noodles pressed into soft, delicate strands.", 100],
    ["Boiled Egg", "A simple boiled egg, often served whole or half.", 100],
    ["Chicken Curry", "A spiced Kerala-style curry with tender chicken cooked in a coconut and onion-based gravy, best enjoyed with rice or chappathi.", 100]
  ]}
};

const imageFiles = {
  "Puttu": "../assets/food/Puttu.png",
  "Appam": "../assets/food/Appam.png",
  "Idiyappam": "../assets/food/Idiyappam.png",
  "Dosa": "../assets/food/Dosa.png",
  "Kadala Curry": "../assets/food/Kadala curry.png",
  "Chappathi": "../assets/food/Chappathi.png",
  "Egg Roast": "../assets/food/Egg roast.png",
  "Boiled Egg": "../assets/food/Boiled egg.png",
  "Rice": "../assets/food/Rice.png",
  "Sambar": "../assets/food/Sambar.png",
  "Rasam": "../assets/food/Rasam.png",
  "Avial": "../assets/food/avial.png",
  "Erissery": "../assets/food/Erissery.png",
  "Kerala Fish Curry": "../assets/food/Fish curry.png",
  "Biriyani": "../assets/food/Biriyani.png",
  "Chicken Fry": "../assets/food/Chicken fry.png",
  "Stew": "../assets/food/Stew.png",
  "Chicken Curry": "../assets/food/Chicken curry.png"
};

const schedule = {
  breakfast: { open: 7 * 60, close: 11 * 60 },
  lunch: { open: 12 * 60, close: 14 * 60 + 30 },
  dinner: { open: 7 * 60, close: 22 * 60 }
};

const category = new URLSearchParams(window.location.search).get("category") || "breakfast";
const menu = menus[category] || menus.breakfast;
const now = new Date();
const currentMinutes = now.getHours() * 60 + now.getMinutes();
const slot = schedule[category] || schedule.breakfast;
const categoryOpen = currentMinutes >= slot.open && currentMinutes < slot.close;

const heading = document.getElementById("heading");
const description = document.getElementById("description");
const menuList = document.getElementById("menuList");

if (heading) heading.innerHTML = `${menu.title} <em>menu</em>`;
if (description) {
  description.textContent =
    `${menu.title} prices are editable in the menu item list below. ` +
    `${menu.title} is ${categoryOpen ? "available now" : "currently unavailable"}.`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (menuList) {
  menuList.innerHTML = menu.items.map((item, index) => {
    const name = escapeHTML(item[0]);
    const descriptionText = escapeHTML(item[1]);
    const price = Number(item[2]);

    return `
      <article class="item ${categoryOpen ? "is-available" : "is-unavailable"}">
        <span class="number">${String(index + 1).padStart(2, "0")}</span>
        <div class="details">
          <div class="menu-image-slot">
            <img src="${imageFiles[item[0]] || "../assets/food/food-placeholder.jpg"}"
                 alt="${name}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="image-placeholder" style="display:none;">ADD IMAGE</div>
          </div>
          <div class="title">
            <h2>${name}</h2>
            <strong class="price">₹${price}</strong>
          </div>
          <div class="food-status ${categoryOpen ? "available" : "unavailable"}">
            ${categoryOpen ? "Available now" : "Currently unavailable"}
          </div>
          <p>${descriptionText}</p>
          <button class="preorder add-cart" type="button"
                  data-food-name="${name}"
                  data-food-price="${price}">
            Add to Cart <span>+</span>
          </button>
        </div>
      </article>
    `;
  }).join("");
}

let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("ehomelyCart") || "[]");
    if (!Array.isArray(saved)) return {};

    return saved.reduce((result, item) => {
      if (!item || !item.name) return result;

      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      if (quantity > 0) {
        result[item.name] = {
          name: String(item.name),
          price,
          quantity,
          category: item.category || category
        };
      }
      return result;
    }, {});
  } catch (error) {
    console.warn("Unable to load cart:", error);
    return {};
  }
}

function saveCart() {
  const items = Object.values(cart);
  localStorage.setItem("ehomelyCart", JSON.stringify(items));
  localStorage.setItem(
    "ehomelyCartTotal",
    String(getCartTotal())
  );
}

function getCartTotal() {
  return Object.values(cart).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
}

function addToCart(name, price, itemCategory = category) {
  const itemName = String(name || "").trim();
  const itemPrice = Number(price);

  if (!itemName || !Number.isFinite(itemPrice) || itemPrice < 0) {
    console.warn("Invalid cart item:", { name, price });
    return;
  }

  if (!cart[itemName]) {
    cart[itemName] = {
      name: itemName,
      price: itemPrice,
      quantity: 0,
      category: itemCategory
    };
  }

  cart[itemName].quantity += 1;
  saveCart();
  updateCart();

  const button = [...document.querySelectorAll(".add-cart")]
    .find((element) => element.dataset.foodName === itemName);

  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = "Added ✓";
    button.disabled = true;

    window.setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 700);
  }
}

function updateCart() {
  const items = Object.values(cart);
  const count = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const total = getCartTotal();

  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const continueCart = document.getElementById("continueCart");
  const cartBar = document.getElementById("cartBar");

  if (cartItems) {
    cartItems.textContent = `${count} item${count === 1 ? "" : "s"}`;
  }

  if (cartTotal) cartTotal.textContent = `₹${total.toFixed(2)}`;
  if (continueCart) continueCart.disabled = count === 0;
  if (cartBar) cartBar.classList.toggle("has-items", count > 0);
}

function continueToCheckout() {
  if (Object.keys(cart).length === 0) {
    updateCart();
    return;
  }

  saveCart();
  window.location.href = "checkout.html";
}

document.querySelectorAll(".add-cart").forEach((button) => {
  button.addEventListener("click", () => {
    addToCart(
      button.dataset.foodName,
      button.dataset.foodPrice,
      category
    );
  });
});

window.addToCart = addToCart;
window.continueToCheckout = continueToCheckout;
window.updateCart = updateCart;

updateCart();

(function () {
  function animateText(root) {
    if (!window.gsap || !window.SplitText) return;

    const elements = (root || document).querySelectorAll(
      "h1:not([data-text-transition]), h2:not([data-text-transition]), h3:not([data-text-transition])"
    );

    elements.forEach((element) => {
      element.dataset.textTransition = "true";
      element.classList.add("text-transition");

      const split = SplitText.create(element, { type: "chars", charsClass: "char" });

      gsap.from(split.chars, {
        y: 40,
        color: "#00FF66",
        opacity: 0,
        stagger: { each: 0.04, from: "start" },
        duration: 0.6,
        ease: "sine.out"
      });
    });
  }

  function startTextTransition() {
    animateText(document);

    // Menu headings can be created dynamically after the page loads.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) animateText(node);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTextTransition);
  } else {
    startTextTransition();
  }
})();