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

  const adjustProductTitles = () => {
    document.querySelectorAll('.product-info .hero-title').forEach((title) => {
      const shouldWrap = title.scrollWidth > title.clientWidth;
      title.classList.toggle('is-wrapping', shouldWrap);
    });
  };

  adjustProductTitles();
  window.addEventListener('resize', adjustProductTitles);

  const cartForm = document.querySelector('[data-cart-form]');
  if (cartForm) {
    const updateDelay = 500;
    const timers = new Map();
    const previousValues = new Map();
    const updateButton = cartForm.querySelector('button[name="update"]');

    const submitCart = () => {
      if (typeof cartForm.requestSubmit === 'function') {
        cartForm.requestSubmit(updateButton || undefined);
        return;
      }
      cartForm.submit();
    };

    const scheduleSubmit = (input) => {
      const existing = timers.get(input);
      if (existing) {
        clearTimeout(existing);
      }
      const timer = setTimeout(() => {
        submitCart();
      }, updateDelay);
      timers.set(input, timer);
    };

    const resetInput = (input) => {
      const previous = previousValues.get(input);
      if (previous !== undefined) {
        input.value = previous;
      }
    };

    cartForm.querySelectorAll('[data-cart-qty]').forEach((input) => {
      const wrap = input.closest('[data-cart-qty-wrap]');
      if (wrap) {
        wrap.querySelectorAll('[data-cart-qty-btn]').forEach((button) => {
          button.addEventListener('click', () => {
            const direction = button.dataset.cartQtyBtn;
            const current = parseInt(input.value, 10) || 0;
            const nextValue = direction === 'plus' ? current + 1 : Math.max(0, current - 1);

            if (nextValue === 0) {
              const title = input.dataset.cartTitle || 'this item';
              const confirmed = window.confirm(`Remove ${title} from your cart?`);
              if (!confirmed) {
                return;
              }
            }

            input.value = nextValue;
            scheduleSubmit(input);
          });
        });
      }

      input.addEventListener('focus', () => {
        previousValues.set(input, input.value);
      });

      input.addEventListener('input', () => {
        if (input.value === '') return;

        const value = Math.max(0, parseInt(input.value, 10));
        if (Number.isNaN(value)) return;
        input.value = value;

        if (value === 0) {
          const title = input.dataset.cartTitle || 'this item';
          const confirmed = window.confirm(`Remove ${title} from your cart?`);
          if (!confirmed) {
            resetInput(input);
            return;
          }
        }

        scheduleSubmit(input);
      });

      input.addEventListener('blur', () => {
        if (input.value === '') {
          resetInput(input);
        }
      });
    });
  }

  const cartCount = document.querySelector('[data-cart-count]');

  const fetchCart = async () => {
    const response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    return response.json();
  };

  const refreshCartCount = async (cart) => {
    const resolvedCart = cart || (await fetchCart());
    if (!resolvedCart) return null;
    if (cartCount) {
      cartCount.textContent = resolvedCart.item_count;
    }
    return resolvedCart;
  };

  const setProductQtyState = (form, quantity) => {
    const controls = form.querySelector('[data-product-qty-controls]');
    const count = form.querySelector('[data-product-qty-count]');
    const button = form.querySelector('[data-add-to-cart-button]');
    if (!controls || !count || !button) return;

    if (quantity > 0) {
      controls.hidden = false;
      button.style.display = 'none';
      count.textContent = `${quantity} in cart`;
    } else {
      controls.hidden = true;
      button.style.display = '';
      count.textContent = '0 in cart';
    }
  };

  const updateProductControls = (cart) => {
    if (!cart) return;
    document.querySelectorAll('[data-add-to-cart]').forEach((form) => {
      const variantId = parseInt(form.dataset.variantId, 10);
      if (!variantId) return;
      const item = cart.items.find((entry) => entry.id === variantId);
      setProductQtyState(form, item ? item.quantity : 0);
    });
  };

  const initProductControls = async () => {
    const cart = await refreshCartCount();
    updateProductControls(cart);
  };

  initProductControls();

  document.querySelectorAll('[data-add-to-cart]').forEach((form) => {
    const variantId = parseInt(form.dataset.variantId, 10);
    const controls = form.querySelector('[data-product-qty-controls]');

    if (controls && variantId) {
      controls.querySelectorAll('[data-product-qty-btn]').forEach((button) => {
        button.addEventListener('click', async () => {
          const direction = button.dataset.productQtyBtn;
          const cart = await fetchCart();
          if (!cart) return;

          const item = cart.items.find((entry) => entry.id === variantId);
          const currentQty = item ? item.quantity : 0;
          const nextQty = direction === 'plus' ? currentQty + 1 : Math.max(0, currentQty - 1);

          if (nextQty === currentQty) return;

          if (!item && nextQty > 0) {
            const addResponse = await fetch('/cart/add.js', {
              method: 'POST',
              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: variantId, quantity: nextQty })
            });
            if (!addResponse.ok) return;
          } else {
            const response = await fetch('/cart/change.js', {
              method: 'POST',
              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: item.key, quantity: nextQty })
            });
            if (!response.ok) return;
          }

          const updatedCart = await refreshCartCount();
          updateProductControls(updatedCart);
        });
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });

        if (!response.ok) {
          throw new Error('Add to cart failed');
        }

        const updatedCart = await refreshCartCount();
        updateProductControls(updatedCart);
      } catch (error) {
        form.submit();
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  });
});
