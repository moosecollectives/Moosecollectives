document.documentElement.classList.remove('no-js');

const initCarousel = (carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  if (!track) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let position = 0;
  let speed = 0.6;
  let targetSpeed = speed;
  const direction = carousel.dataset.direction === 'right' ? 1 : -1;
  const baseSpeed = parseFloat(carousel.dataset.speed) || 0.6;
  speed = baseSpeed;
  targetSpeed = baseSpeed;

  const getHalfWidth = () => track.scrollWidth / 2;
  let halfWidth = getHalfWidth();
  const startFromEnd = carousel.dataset.start === 'end';
  if (startFromEnd) {
    position = -halfWidth;
  }

  const step = () => {
    speed += (targetSpeed - speed) * 0.06;
    position += direction * speed;

    if (direction === -1 && Math.abs(position) >= halfWidth) {
      position = 0;
    }
    if (direction === 1 && position >= 0) {
      position = -halfWidth;
    }

    track.style.transform = `translate3d(${position}px, 0, 0)`;
    requestAnimationFrame(step);
  };

  const refresh = () => {
    halfWidth = getHalfWidth();
  };

  carousel.addEventListener('mouseenter', () => {
    targetSpeed = 0;
  });

  carousel.addEventListener('mouseleave', () => {
    targetSpeed = baseSpeed;
  });

  window.addEventListener('resize', refresh);

  requestAnimationFrame(step);
};

window.addEventListener('load', () => {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
});
