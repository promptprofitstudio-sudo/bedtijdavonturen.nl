// JavaScript for Bedtijdavonturen
// Handles smooth scrolling, starfield generation and demo form

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Generate random starfield in header
(function starfield() {
  const wrap = document.querySelector('.stars');
  if (!wrap) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('i');
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
    star.style.transform = `scale(${0.6 + Math.random() * 1.6})`;
    wrap.appendChild(star);
  }
})();

// Demo form logic for placeholder until MailerLite embed is installed
const demoForm = document.getElementById('ml-placeholder-form');
if (demoForm) {
  demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('ml-placeholder-msg');
    msg.className = 'success';
    msg.textContent = 'Top! Je staat op de lijst (demo). Vervang dit formulier straks door het MailerLite-embed.';
  });
}