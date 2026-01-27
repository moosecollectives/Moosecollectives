document.documentElement.classList.remove('no-js');

const stagger = (selector, delay) => {
  const items = document.querySelectorAll(selector);
  items.forEach((item, index) => {
    item.style.animationDelay = `${index * delay}ms`;
  });
};

const jiggle = () => {
  const root = document.documentElement;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();
  let jiggleX = 0;
  let jiggleY = 0;
  let jiggleR = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const update = (now) => {
    const dt = Math.max(now - lastTime, 16);
    const dy = window.scrollY - lastScrollY;
    const velocity = dy / dt;

    const intensity = clamp(Math.abs(velocity) * 22, 0, 1);
    const direction = velocity >= 0 ? 1 : -1;

    jiggleX += (direction * intensity * 2 - jiggleX) * 0.08;
    jiggleY += (direction * intensity * 1.2 - jiggleY) * 0.08;
    jiggleR += (direction * intensity * 0.35 - jiggleR) * 0.08;

    root.style.setProperty('--jiggle-x', `${jiggleX}px`);
    root.style.setProperty('--jiggle-y', `${jiggleY}px`);
    root.style.setProperty('--jiggle-rot', `${jiggleR}deg`);

    lastScrollY = window.scrollY;
    lastTime = now;
    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
};

window.addEventListener('load', () => {
  stagger('.product-card', 90);
  jiggle();
});
