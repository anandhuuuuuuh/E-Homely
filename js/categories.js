/* E-HOMELY View Menu: browsing only, independent from the cart and checkout. */
(() => {
  "use strict";

  const dishes = [
    { name: "Puttu", category: "Breakfast", price: 10, description: "Steamed rice flour layered with fresh grated coconut.", image: "Puttu.png", tags: ["Vegetarian"] },
    { name: "Appam", category: "Breakfast", price: 100, description: "Soft, lacy rice pancakes with delicate crisp edges.", image: "Appam.png", tags: ["Vegetarian"] },
    { name: "Idiyappam", category: "Breakfast", price: 100, description: "Soft steamed rice noodles, pressed into fine strands.", image: "Idiyappam.png", tags: ["Vegetarian"] },
    { name: "Dosa", category: "Breakfast", price: 100, description: "A golden, crisp fermented rice and lentil crepe.", image: "Dosa.png", tags: ["Vegetarian"] },
    { name: "Kadala Curry", category: "Breakfast", price: 100, description: "Black chickpeas simmered with coconut and roasted spices.", image: "Kadala curry.png", tags: ["Vegetarian"] },
    { name: "Chappathi", category: "Breakfast", price: 100, description: "Soft whole-wheat flatbread, freshly cooked on a griddle.", image: "Chappathi.png", tags: ["Vegetarian", "Dinner"] },
    { name: "Egg Roast", category: "Breakfast", price: 100, description: "Boiled eggs in a rich onion and tomato masala.", image: "Egg roast.png", tags: ["Non-vegetarian", "Dinner"] },
    { name: "Boiled Egg", category: "Breakfast", price: 100, description: "A simple, protein-rich classic served whole or halved.", image: "Boiled egg.png", tags: ["Non-vegetarian", "Lunch", "Dinner"] },
    { name: "Rice", category: "Lunch", price: 100, description: "Steamed rice, a comforting base for a Kerala meal.", image: "Rice.png", tags: ["Vegetarian", "Rice & Biriyani"] },
    { name: "Sambar", category: "Lunch", price: 100, description: "Lentils and vegetables simmered with tamarind and spices.", image: "Sambar.png", tags: ["Vegetarian"] },
    { name: "Rasam", category: "Lunch", price: 100, description: "A light, tangy and peppery soup with tomato and tamarind.", image: "Rasam.png", tags: ["Vegetarian"] },
    { name: "Avial", category: "Lunch", price: 100, description: "Mixed vegetables in a gently spiced coconut-yogurt sauce.", image: "avial.png", tags: ["Vegetarian"] },
    { name: "Erissery", category: "Lunch", price: 100, description: "A traditional pumpkin and lentil curry with roasted coconut.", image: "Erissery.png", tags: ["Vegetarian"] },
    { name: "Kerala Fish Curry", category: "Lunch", price: 100, description: "A bold Kerala-style fish curry with tangy spices.", image: "Fish curry.png", tags: ["Non-vegetarian"] },
    { name: "Biriyani", category: "Lunch", price: 100, description: "Fragrant spiced rice layered with rich, aromatic flavours.", image: "Biriyani.png", tags: ["Non-vegetarian", "Rice & Biriyani"] },
    { name: "Chicken Fry", category: "Lunch", price: 100, description: "Spiced chicken pieces roasted or fried with curry leaves.", image: "Chicken fry.png", tags: ["Non-vegetarian", "Dinner"] },
    { name: "Stew", category: "Dinner", price: 100, description: "A mild, comforting stew with coconut-milk flavours.", image: "Stew.png", tags: ["Vegetarian"] },
    { name: "Chicken Curry", category: "Dinner", price: 100, description: "Kerala-style chicken curry with aromatic spices and gravy.", image: "Chicken curry.png", tags: ["Non-vegetarian"] }
  ];

  const schedule = {
    Breakfast: { open: 7 * 60, close: 11 * 60 },
    Lunch: { open: 12 * 60, close: 14 * 60 + 30 },
    Dinner: { open: 19 * 60, close: 22 * 60 }
  };

  const grid = document.getElementById("dishGrid");
  const search = document.getElementById("menuSearch");
  const count = document.getElementById("dishCount");
  const resultLabel = document.getElementById("resultLabel");
  const emptyState = document.getElementById("emptyState");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  let activeFilter = "All";

  function isMealOpen(category) {
    const slot = schedule[category];
    if (!slot) return false;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes >= slot.open && minutes < slot.close;
  }

  function statusFor(dish) {
    const mealCategory = ["Breakfast", "Lunch", "Dinner"].includes(dish.category)
      ? dish.category
      : (dish.tags.find(tag => schedule[tag]) || dish.category);
    return isMealOpen(mealCategory);
  }

  function matchesFilter(dish) {
    if (activeFilter === "All") return true;
    if (activeFilter === "Breakfast" || activeFilter === "Lunch" || activeFilter === "Dinner") {
      return dish.category === activeFilter || dish.tags.includes(activeFilter);
    }
    return dish.tags.includes(activeFilter);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function render() {
    const query = (search?.value || "").trim().toLowerCase();
    const visibleDishes = dishes.filter(dish => matchesFilter(dish) &&
      `${dish.name} ${dish.description} ${dish.category} ${dish.tags.join(" ")}`.toLowerCase().includes(query));

    grid.innerHTML = visibleDishes.map(dish => {
      const open = statusFor(dish);
      const imagePath = `../assets/food/${dish.image}`;
      return `<article class="dish-card">
        <div class="dish-photo-wrap">
          <img class="dish-photo" src="${imagePath}" alt="${escapeHTML(dish.name)}" loading="lazy" onerror="this.onerror=null;this.src='../assets/food/food-placeholder.jpg'">
          <span class="dish-category">${escapeHTML(dish.category)}</span>
        </div>
        <div class="dish-info">
          <div class="dish-title-row"><h3>${escapeHTML(dish.name)}</h3><span class="dish-price">₹${dish.price}</span></div>
          <p class="dish-description">${escapeHTML(dish.description)}</p>
          <div class="dish-status ${open ? "open" : "closed"}"><span class="status-dot"></span>${open ? "Available now" : "Not serving now · View anytime"}</div>
        </div>
      </article>`;
    }).join("");

    count.textContent = String(visibleDishes.length);
    resultLabel.textContent = query || activeFilter !== "All"
      ? `Showing ${visibleDishes.length} ${visibleDishes.length === 1 ? "dish" : "dishes"}`
      : "Showing all dishes";
    emptyState.hidden = visibleDishes.length !== 0;
    grid.hidden = visibleDishes.length === 0;
  }

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "All";
      filterButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      render();
    });
  });
  search?.addEventListener("input", render);
  render();
})();
