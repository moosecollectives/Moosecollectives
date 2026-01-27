document.documentElement.classList.remove('no-js');

const initCarousel = (carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  if (!track) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let position = 0;
  let speed = 0.6;
  let targetSpeed = speed;
  let isHovering = false;

  const getHalfWidth = () => track.scrollWidth / 2;
  let halfWidth = getHalfWidth();

  const step = () => {
    speed += (targetSpeed - speed) * 0.06;
    position -= speed;

    if (Math.abs(position) >= halfWidth) {
      position = 0;
    }

    track.style.transform = `translate3d(${position}px, 0, 0)`;
    requestAnimationFrame(step);
  };

  const refresh = () => {
    halfWidth = getHalfWidth();
  };

  carousel.addEventListener('mouseenter', () => {
    isHovering = true;
    targetSpeed = 0;
  });

  carousel.addEventListener('mouseleave', () => {
    isHovering = false;
    targetSpeed = 0.6;
  });

  window.addEventListener('resize', refresh);

  requestAnimationFrame(step);
};

window.addEventListener('load', () => {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
});
