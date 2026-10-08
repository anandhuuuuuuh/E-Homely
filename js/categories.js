/* E-HOMELY Categories Page */

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