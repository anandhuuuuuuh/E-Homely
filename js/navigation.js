// E-HOMELY — Navigation and notification helpers

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const toast = document.getElementById("toast");

function showComingSoon(event) {
    event.preventDefault();
    if (!toast || !navLinks || !menuToggle) return;

    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    navLinks.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
}

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const open = navLinks.classList.toggle("show");
        menuToggle.setAttribute("aria-expanded", String(open));
    });
}

document.querySelectorAll(".coming-soon").forEach((item) => {
    item.addEventListener("click", showComingSoon);
});
