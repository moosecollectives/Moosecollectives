document.documentElement.classList.remove('no-js');

const stagger = (selector, delay) => {
  const items = document.querySelectorAll(selector);
  items.forEach((item, index) => {
    item.style.animationDelay = `${index * delay}ms`;
  });
};

window.addEventListener('load', () => {
  stagger('.product-card', 90);
});
