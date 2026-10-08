/* E-HOMELY Home Page */

"use strict";

const schedule = {
  breakfast: { open: 7 * 60, close: 11 * 60, openLabel: "7:00 AM", label: "Breakfast" },
  lunch: { open: 12 * 60, close: 14 * 60 + 30, openLabel: "12:00 PM", label: "Lunch" },
  dinner: { open: 19 * 60, close: 22 * 60, openLabel: "7:00 PM", label: "Dinner" }
};

if (typeof document === "undefined") {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openCategory = Object.keys(schedule).find((key) => {
    const slot = schedule[key];
    return currentMinutes >= slot.open && currentMinutes < slot.close;
  });

  console.log(`E-Homely availability — ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
  Object.entries(schedule).forEach(([key, slot]) => {
    const isOpen = currentMinutes >= slot.open && currentMinutes < slot.close;
    let message;
    if (isOpen) {
      message = "Open now";
    } else if (currentMinutes < slot.open) {
      message = `Opens at ${slot.openLabel}`;
    } else if (key === "breakfast") {
      message = "Next: Lunch at 12:00 PM";
    } else if (key === "lunch") {
      message = "Next: Dinner at 7:00 PM";
    } else {
      message = "Opens tomorrow at 7:00 AM";
    }
    console.log(`${slot.label}: ${message}`);
  });
  console.log(`Overall: ${openCategory ? `${schedule[openCategory].label} is open now` : "Currently closed"}`);
} else {

/* ---------- Nav / toast (Phase 1 behaviour, unchanged) ---------- */
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const toast = document.getElementById("toast");
const availabilityButton = document.getElementById("availabilityButton");

function showComingSoon(event) {
  event.preventDefault();
  toast.textContent = "This will be updated soon.";
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  navLinks.classList.remove("show");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("show");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".coming-soon").forEach((item) => {
  item.addEventListener("click", showComingSoon);
});

document.querySelectorAll(".nav-links a[href^='#']").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

availabilityButton.addEventListener("click", () => {
  document.getElementById("availability").scrollIntoView({ behavior: "smooth" });
});

/* ---------- Availability schedule (shared logic for hero note + panel) ---------- */
function nextOpeningMessage(key, currentMinutes) {
  const slot = schedule[key];
  if (currentMinutes < slot.open) return `Opens at ${slot.openLabel}`;
  if (key === "breakfast") return "Next: Lunch at 12:00 PM";
  if (key === "lunch") return "Next: Dinner at 7:00 PM";
  return "Opens tomorrow at 7:00 AM";
}

function updateAvailability() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const keys = ["breakfast", "lunch", "dinner"];
  let activeCategory = null;

  keys.forEach((key) => {
    const slot = schedule[key];
    const isOpen = currentMinutes >= slot.open && currentMinutes < slot.close;
    const remaining = slot.close - currentMinutes;
    const message = document.getElementById(`${key}Message`);
    const status = document.getElementById(`${key}Status`);
    if (!status || !message) return;

    if (isOpen) {
      activeCategory = key;
      status.textContent = "Open now";
      status.className = "category-status open";
      status.href = `pages/menu.html?category=${key}`;
      status.removeAttribute("aria-disabled");
      message.textContent = remaining <= 15
        ? `Closes in ${remaining} minute${remaining === 1 ? "" : "s"}`
        : "Available now";
    } else {
      status.textContent = "Closed";
      status.className = "category-status closed";
      status.removeAttribute("href");
      status.setAttribute("aria-disabled", "true");
      message.textContent = nextOpeningMessage(key, currentMinutes);
    }
  });

  const overallOpen = activeCategory !== null;

  // Hero note (Phase 1)
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const statusSubtext = document.getElementById("statusSubtext");
  if (statusDot) statusDot.className = `status-dot ${overallOpen ? "open" : "closed"}`;
  if (statusText) statusText.textContent = overallOpen
    ? `${activeCategory[0].toUpperCase() + activeCategory.slice(1)} is open now`
    : "Currently closed";
  if (statusSubtext) statusSubtext.textContent = overallOpen
    ? "Scroll down to see today's availability"
    : "Check today's slots below";

  // Availability panel (Phase 2)
  const overallDot = document.getElementById("overallDot");
  const overallText = document.getElementById("overallText");
  const overallSubtext = document.getElementById("overallSubtext");
  const overallPill = document.getElementById("overallPill");
  const pillText = document.getElementById("pillText");
  const updatedText = document.getElementById("updatedText");
  const panelTip = document.getElementById("panelTip");

  if (overallDot) overallDot.className = `status-dot ${overallOpen ? "open" : "closed"}`;
  if (overallText) overallText.textContent = overallOpen
    ? `Our ${activeCategory} section is open`
    : "All food sections are currently closed";

  if (overallOpen) {
    const remaining = schedule[activeCategory].close - currentMinutes;
    if (overallSubtext) overallSubtext.textContent = remaining <= 15
      ? `Closes in ${remaining} minute${remaining === 1 ? "" : "s"}`
      : "Check dishes before you visit";
  } else if (overallSubtext) {
    if (currentMinutes < schedule.breakfast.open) overallSubtext.textContent = "Breakfast opens from 7:00 AM";
    else if (currentMinutes < schedule.lunch.open) overallSubtext.textContent = "Lunch opens from 12:00 PM";
    else if (currentMinutes < schedule.dinner.open) overallSubtext.textContent = "Dinner opens from 7:00 PM";
    else overallSubtext.textContent = "Breakfast opens tomorrow from 7:00 AM";
  }

  if (overallPill) overallPill.className = `open-pill ${overallOpen ? "open" : "closed"}`;
  if (pillText) pillText.textContent = overallOpen ? "Open" : "Closed";
  if (updatedText) updatedText.textContent = `Updated automatically · ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (panelTip) panelTip.textContent = overallOpen
    ? `Tip: ${activeCategory[0].toUpperCase() + activeCategory.slice(1)} is available right now.`
    : "Tip: The next food category will open automatically according to the schedule.";
}

updateAvailability();
setInterval(updateAvailability, 60000);

/* ---------- Scroll-reveal: fires as the user scrolls with their mouse/trackpad ---------- */
const revealTargets = document.querySelectorAll(".reveal, .reveal-panel, .reveal-row, .reveal-card");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

revealTargets.forEach((el) => revealObserver.observe(el));

/* ---------- Scroll progress bar + passive section dots ---------- */
const scrollProgress = document.getElementById("scrollProgress");
const dots = document.querySelectorAll("#scrollDots span");
const availabilitySection = document.getElementById("availability");

function onScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = `${percent}%`;

  const availabilityTop = availabilitySection.getBoundingClientRect().top;
  const inAvailability = availabilityTop <= window.innerHeight * 0.4;
  dots.forEach((dot) => dot.classList.remove("active"));
  dots[inAvailability ? 1 : 0]?.classList.add("active");
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

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

document.addEventListener("DOMContentLoaded", function () {
  const availabilityButton = document.getElementById("availabilityButton");
  if (availabilityButton) {
    availabilityButton.addEventListener("click", function () {
      window.location.href = "pages/categories.html";
    });
  }
});
}