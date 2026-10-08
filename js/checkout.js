/* E-HOMELY Checkout / Token Page */

"use strict";

let cart = loadCart();
const list = document.getElementById("orderList");
const grandTotal = document.getElementById("grandTotal");
const confirmBtn = document.getElementById("confirmBtn");

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("ehomelyCart") || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter(item => item && item.name && Number(item.quantity) > 0)
      .map(item => ({
        name: String(item.name),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        category: item.category || "general"
      }));
  } catch (error) {
    console.warn("Unable to load cart:", error);
    return [];
  }
}

function saveCart() {
  localStorage.setItem("ehomelyCart", JSON.stringify(cart));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderOrder() {
  if (!cart.length) {
    list.innerHTML = '<p>Your cart is empty. Please return to the menu.</p>';
    grandTotal.textContent = "₹0";
    confirmBtn.disabled = true;
    return;
  }

  list.innerHTML = cart.map((item, index) => {
    const subtotal = item.price * item.quantity;
    return `
      <div class="order-line" data-index="${index}">
        <div class="order-product">
          <strong>${escapeHTML(item.name)}</strong>
          <span class="qty">₹${item.price.toFixed(2)} each</span>
          <div class="quantity-controls" aria-label="Quantity controls for ${escapeHTML(item.name)}">
            <button type="button" class="quantity-button minus" data-action="decrease" data-index="${index}" aria-label="Decrease ${escapeHTML(item.name)} quantity">−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button type="button" class="quantity-button plus" data-action="increase" data-index="${index}" aria-label="Increase ${escapeHTML(item.name)} quantity">+</button>
          </div>
        </div>
        <strong>₹${subtotal.toFixed(2)}</strong>
      </div>
    `;
  }).join("");

  grandTotal.textContent = `₹${getTotal().toFixed(2)}`;
  confirmBtn.disabled = !document.querySelector('input[name="service"]:checked');
}

function changeQuantity(index, amount) {
  if (!cart[index]) return;

  cart[index].quantity += amount;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  renderOrder();
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const amount = button.dataset.action === "increase" ? 1 : -1;
  changeQuantity(index, amount);
});

const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const phoneValidation = document.getElementById("phoneValidation");

function isValidPhoneNumber() {
  return /^\d{10}$/.test(customerPhone.value.trim());
}

function updateConfirmVisibility() {
  const serviceSelected = Boolean(document.querySelector('input[name="service"]:checked'));
  const nameValid = customerName.value.trim().length > 0;
  const phoneValid = isValidPhoneNumber();
  const formValid = Boolean(cart.length && serviceSelected && nameValid && phoneValid);

  confirmBtn.disabled = !formValid;
  confirmBtn.hidden = !formValid;

  if (!customerPhone.value.trim()) {
    phoneValidation.textContent = "";
  } else if (!phoneValid) {
    phoneValidation.textContent = "Enter an exact 10-digit phone number.";
  } else {
    phoneValidation.textContent = "";
  }
}

document.querySelectorAll('input[name="service"]').forEach(input => {
  input.addEventListener("change", updateConfirmVisibility);
});

customerName.addEventListener("input", updateConfirmVisibility);
customerPhone.addEventListener("input", () => {
  customerPhone.value = customerPhone.value.replace(/\D/g, "").slice(0, 10);
  updateConfirmVisibility();
});

function confirmOrder() {
  const service = document.querySelector('input[name="service"]:checked');
  if (!service || !cart.length || !customerName.value.trim() || !isValidPhoneNumber()) {
    updateConfirmVisibility();
    return;
  }

  const tokenNumber = String(Math.floor(Math.random() * 900) + 100);
  document.getElementById("tokenId").textContent = `${service.value}-${tokenNumber}`;
  document.getElementById("orderModeText").textContent = service.value === "EAT" ? "Eat Here" : "Collect";
  document.getElementById("tokenModal").classList.add("show");

  let remaining = 1200;
  const timer = document.getElementById("timer");

  const tick = () => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (remaining > 0) {
      remaining -= 1;
      window.setTimeout(tick, 1000);
    }
  };

  tick();
  localStorage.setItem("ehomelyOrderStatus", "Confirmed");
  localStorage.setItem("ehomelyToken", document.getElementById("tokenId").textContent);
}

function printToken() {
  window.print();
}

function saveToken() {
  const token = document.getElementById("tokenId").textContent.trim();
  const mode = document.getElementById("orderModeText").textContent.trim();
  const escapeXML = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

  // Create an image of the token card only. The page background is not included.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1120" viewBox="0 0 900 1120">
    <defs>
      <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fbfff6"/>
        <stop offset="100%" stop-color="#e4f7df"/>
      </linearGradient>
      <radialGradient id="coin" cx="28%" cy="22%" r="80%">
        <stop offset="0%" stop-color="#f0fff1"/>
        <stop offset="28%" stop-color="#b7f0bf"/>
        <stop offset="60%" stop-color="#54bd76"/>
        <stop offset="100%" stop-color="#0c5b31"/>
      </radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#244d32" flood-opacity=".22"/>
      </filter>
    </defs>
    <rect x="18" y="18" width="864" height="1084" rx="42" fill="url(#card)" stroke="#ffffff" stroke-width="4" filter="url(#shadow)"/>
    <circle cx="450" cy="105" r="43" fill="#baf5c3" stroke="#ffffff" stroke-width="4"/>
    <text x="450" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="700" fill="#075b2b">✓</text>
    <text x="450" y="205" text-anchor="middle" font-family="Georgia,serif" font-size="56" font-weight="700" fill="#101512">Order <tspan fill="#16813f">Confirmed!</tspan></text>
    <text x="450" y="248" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#25352a">Thank you for choosing E-HOMELY</text>
    <text x="450" y="278" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="#657367">Homely food, near you!</text>
    <circle cx="450" cy="515" r="190" fill="url(#coin)" stroke="#d9f8df" stroke-width="12"/>
    <circle cx="450" cy="515" r="169" fill="none" stroke="#16733f" stroke-width="3"/>
    <text x="450" y="430" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#073c20">⌂</text>
    <text x="450" y="475" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#073c20">E-HOMELY</text>
    <line x1="330" y1="500" x2="570" y2="500" stroke="#073c20" stroke-width="2" opacity=".65"/>
    <text x="450" y="555" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="900" fill="#063d1d">${escapeXML(token)}</text>
    <line x1="330" y1="580" x2="570" y2="580" stroke="#073c20" stroke-width="2" opacity=".65"/>
    <text x="450" y="615" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#073c20">Homely food, near you!</text>
    <g font-family="Arial,sans-serif" text-anchor="middle">
      <rect x="55" y="750" width="250" height="125" rx="22" fill="#f9fff7" stroke="#d5ead6" stroke-width="2"/>
      <rect x="325" y="750" width="250" height="125" rx="22" fill="#f9fff7" stroke="#d5ead6" stroke-width="2"/>
      <rect x="595" y="750" width="250" height="125" rx="22" fill="#f9fff7" stroke="#d5ead6" stroke-width="2"/>
      <text x="180" y="790" font-size="18" fill="#247346">Order Mode</text>
      <text x="180" y="833" font-size="24" font-weight="700" fill="#247346">${escapeXML(mode)}</text>
      <text x="450" y="790" font-size="18" fill="#247346">Payment</text>
      <text x="450" y="833" font-size="24" font-weight="700" fill="#247346">At Counter</text>
      <text x="720" y="790" font-size="18" fill="#247346">Order Status</text>
      <text x="720" y="833" font-size="24" font-weight="700" fill="#247346">Confirmed</text>
    </g>
    <text x="450" y="935" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#101512">Show this token at the counter</text>
    <text x="450" y="970" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#657367">We&apos;ll prepare your food with care ♥</text>
    <text x="450" y="1038" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="8" fill="#237346">THANK YOU</text>
  </svg>`;

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1120;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(svgUrl);

    canvas.toBlob((blob) => {
      if (!blob) {
        showTokenSaveMessage("Unable to create token image.");
        return;
      }
      const imageUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${token}-E-HOMELY.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(imageUrl);
    }, "image/png");
  };

  image.onerror = () => {
    URL.revokeObjectURL(svgUrl);
    showTokenSaveMessage("Unable to save the token image on this device.");
  };

  image.src = svgUrl;
}

function showTokenSaveMessage(message) {
  const note = document.querySelector(".counter-note");
  if (note) note.textContent = message;
}

function closeModal() {
  window.location.href = "../index.html";
}

window.confirmOrder = confirmOrder;
window.closeModal = closeModal;
renderOrder();
updateConfirmVisibility();

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