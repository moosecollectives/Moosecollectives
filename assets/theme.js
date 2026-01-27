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
  const isMobile = window.matchMedia('(max-width: 980px)').matches;
  const mobileBoost = isMobile ? 1.1 : 0;
  const tunedSpeed = Math.min(baseSpeed + mobileBoost, 2);
  speed = tunedSpeed;
  targetSpeed = tunedSpeed;

  const getHalfWidth = () => track.scrollWidth / 2;
  let halfWidth = getHalfWidth();
  const startFromEnd = carousel.dataset.start === 'end';
  if (startFromEnd) {
    position = -halfWidth;
  }

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const randomizeTrack = () => {
    const cards = Array.from(track.querySelectorAll('[data-carousel-card]'));
    if (cards.length < 2) return;
    const half = Math.floor(cards.length / 2);
    if (half < 2) return;
    const firstHalf = cards.slice(0, half);
    const secondHalf = cards.slice(half, half * 2);
    if (secondHalf.length !== firstHalf.length) return;

    const order = shuffle(firstHalf.map((_, index) => index));
    const fragment = document.createDocumentFragment();
    order.forEach((index) => {
      fragment.appendChild(firstHalf[index]);
    });
    order.forEach((index) => {
      fragment.appendChild(secondHalf[index]);
    });
    track.appendChild(fragment);
  };

  randomizeTrack();

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
    targetSpeed = tunedSpeed;
  });

  window.addEventListener('resize', refresh);

  requestAnimationFrame(step);
};

window.addEventListener('load', () => {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
});
