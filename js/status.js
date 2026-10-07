// E-HOMELY Phase 1 — dynamic opening status
const schedule = {
  breakfast: { open: 7 * 60, close: 11 * 60, openLabel: '7:00 AM' },
  lunch: { open: 12 * 60, close: 14 * 60 + 30, openLabel: '12:00 PM' },
  dinner: { open: 19 * 60, close: 23 * 60, openLabel: '7:00 PM' }
};

function updateOpeningStatus() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const statusSubtext = document.getElementById('statusSubtext');
  const exploreButton = document.querySelector('.hero-actions .btn-primary');
  const dishesLink = document.querySelector('.nav-links a[href="phase2/index.html"]');

  const keys = ['breakfast', 'lunch', 'dinner'];
  const activeCategory = keys.find(key => {
    const slot = schedule[key];
    return currentMinutes >= slot.open && currentMinutes < slot.close;
  });

  const isOpen = Boolean(activeCategory);

  if (statusDot && statusText && statusSubtext) {
    statusDot.classList.toggle('open', isOpen);
    statusDot.classList.toggle('closed', !isOpen);

    if (isOpen) {
      const closingMinutes = schedule[activeCategory].close;
      const minutesUntilClosing = closingMinutes - currentMinutes;

      statusText.textContent = 'Our door is officially open';
      statusSubtext.textContent = minutesUntilClosing <= 15
        ? `Closes in ${minutesUntilClosing} minute${minutesUntilClosing === 1 ? '' : 's'}`
        : 'Check dishes before you visit';
    } else {
      statusText.textContent = 'Our door is currently closed';

      if (currentMinutes < schedule.breakfast.open) {
        statusSubtext.textContent = 'We\'ll be open from 7:00 AM';
      } else if (currentMinutes < schedule.lunch.open) {
        statusSubtext.textContent = 'We\'ll be open from 12:00 PM';
      } else if (currentMinutes < schedule.dinner.open) {
        statusSubtext.textContent = 'We\'ll be open from 7:00 PM';
      } else {
        statusSubtext.textContent = 'We\'ll be open tomorrow from 7:00 AM';
      }
    }
  }

  // Explore Dishes is enabled only while E-HOMELY is open.
  if (exploreButton) {
    exploreButton.classList.toggle('disabled', !isOpen);
    exploreButton.setAttribute('aria-disabled', String(!isOpen));
    if (isOpen) {
      exploreButton.setAttribute('href', `phase2/index.html?category=${activeCategory}`);
    } else {
      exploreButton.removeAttribute('href');
    }
  }

  // Keep the Dishes navigation item in sync with the same rule.
  if (dishesLink) {
    dishesLink.classList.toggle('disabled', !isOpen);
    dishesLink.setAttribute('aria-disabled', String(!isOpen));
    if (isOpen) {
      dishesLink.setAttribute('href', `phase2/index.html?category=${activeCategory}`);
    } else {
      dishesLink.removeAttribute('href');
    }
  }
}

// Prevent navigation when Dishes/Explore Dishes is disabled.
document.addEventListener('click', event => {
  const target = event.target.closest('.disabled');
  if (target) {
    event.preventDefault();
    event.stopPropagation();
  }
});

updateOpeningStatus();
setInterval(updateOpeningStatus, 60000);
