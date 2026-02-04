document.documentElement.classList.remove('no-js');

const initCarousel = (carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  if (!track) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let position = 0;
  let speed = 0.6;
  let targetSpeed = speed;
  const baseDirection = carousel.dataset.direction === 'right' ? 1 : -1;
  const baseSpeed = parseFloat(carousel.dataset.speed) || 0.6;
  const isMobile = window.matchMedia('(max-width: 980px)').matches;
  const mobileBoost = isMobile ? 1.1 : 0;
  const tunedSpeed = Math.min((baseSpeed + mobileBoost) * 0.6, 2);
  speed = tunedSpeed;
  targetSpeed = tunedSpeed;
  let directionMultiplier = baseDirection;
  let edgeTimeout;

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
    position += directionMultiplier * speed;

    if (directionMultiplier === -1 && Math.abs(position) >= halfWidth) {
      position = 0;
    }
    if (directionMultiplier === 1 && position >= 0) {
      position = -halfWidth;
    }

    track.style.transform = `translate3d(${position}px, 0, 0)`;
    requestAnimationFrame(step);
  };

  const refresh = () => {
    halfWidth = getHalfWidth();
  };

  let hoverPause = false;
  const setHoverPause = (pause) => {
    hoverPause = pause;
    if (pause) {
      targetSpeed = 0;
    }
  };

  const isInEdgeZone = (clientX) => {
    const rect = carousel.getBoundingClientRect();
    const edgeSize = Math.min(80, rect.width * 0.18);
    const x = clientX - rect.left;
    return x <= edgeSize || x >= rect.width - edgeSize;
  };

  carousel.querySelectorAll('[data-carousel-card]').forEach((card) => {
    card.addEventListener('mouseenter', (event) => {
      if (isInEdgeZone(event.clientX)) {
        return;
      }
      setHoverPause(true);
      edgeHovering = false;
      clearTimeout(edgeTimeout);
    });
    card.addEventListener('mouseleave', () => {
      setHoverPause(false);
      if (edgeHovering) {
        targetSpeed = tunedSpeed * 0.9;
        return;
      }
      clearTimeout(edgeTimeout);
      edgeTimeout = setTimeout(() => {
        targetSpeed = tunedSpeed;
      }, 2000);
    });
  });

  let edgeHovering = false;

  carousel.addEventListener('mouseleave', () => {
    edgeHovering = false;
    directionMultiplier = baseDirection;
    if (!hoverPause) {
      clearTimeout(edgeTimeout);
      edgeTimeout = setTimeout(() => {
        targetSpeed = tunedSpeed;
      }, 2000);
    }
  });

  window.addEventListener('resize', refresh);

  const updateEdgeState = (clientX) => {
    const rect = carousel.getBoundingClientRect();
    const edgeSize = Math.min(80, rect.width * 0.18);
    const x = clientX - rect.left;
    const isLeft = x <= edgeSize;
    const isRight = x >= rect.width - edgeSize;
    carousel.classList.toggle('edge-hover', isLeft || isRight);

    if (hoverPause) {
      edgeHovering = false;
      return;
    }

    if (isLeft || isRight) {
      clearTimeout(edgeTimeout);
      edgeHovering = true;
      directionMultiplier = isLeft ? 1 : -1;
      targetSpeed = tunedSpeed * 0.9;
    } else {
      edgeHovering = false;
      if (directionMultiplier !== baseDirection) {
        directionMultiplier = baseDirection;
      }
      clearTimeout(edgeTimeout);
      edgeTimeout = setTimeout(() => {
        targetSpeed = tunedSpeed;
      }, 2000);
    }
  };

  const edgeHover = (event) => {
    updateEdgeState(event.clientX);
  };

  carousel.addEventListener('mousemove', edgeHover);
  carousel.addEventListener('mouseenter', (event) => {
    updateEdgeState(event.clientX);
  });
  carousel.addEventListener('mouseleave', () => {
    carousel.classList.remove('edge-hover');
  });

  carousel.querySelectorAll('[data-carousel-card]').forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      updateEdgeState(event.clientX);
    });
  });

  requestAnimationFrame(step);
};

window.addEventListener('load', () => {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
  document.querySelectorAll('[data-case-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('[data-case-track]');
    let items = Array.from(carousel.querySelectorAll('[data-case-item]'));
    const spinButton = carousel.querySelector('[data-case-spin]');
    const spinAudio = carousel.querySelector('[data-case-audio]');
    const result = document.querySelector('[data-case-result]');
    const resultImage = result ? result.querySelector('[data-case-result-image]') : null;
    const resultTitle = result ? result.querySelector('[data-case-result-title]') : null;
    const resultDesc = result ? result.querySelector('[data-case-result-description]') : null;
    const resultPrice = result ? result.querySelector('[data-case-result-price]') : null;
    const resultVariant = result ? result.querySelector('[data-case-result-variant]') : null;
    const resultClose = result ? result.querySelector('.case-result-close') : null;
    const resultAdd = result ? result.querySelector('[data-case-result-add]') : null;
    if (!track || items.length === 0 || !spinButton) return;

    const ensureLoop = () => {
      const currentItems = Array.from(track.querySelectorAll('[data-case-item]'));
      if (currentItems.length === 0) return;
      if (currentItems.length % 2 === 0) {
        items = currentItems;
        return;
      }
      const fragment = document.createDocumentFragment();
      currentItems.forEach((item) => {
        fragment.appendChild(item.cloneNode(true));
      });
      track.appendChild(fragment);
      items = Array.from(track.querySelectorAll('[data-case-item]'));
    };

    ensureLoop();

    const rarityPool = [
      { name: 'common', weight: 35 },
      { name: 'common-light', weight: 25 },
      { name: 'uncommon', weight: 18 },
      { name: 'rare', weight: 10 },
      { name: 'epic', weight: 8 },
      { name: 'legendary', weight: 4 }
    ];
    const totalWeight = rarityPool.reduce((sum, item) => sum + item.weight, 0);
    const pickRarity = () => {
      let roll = Math.random() * totalWeight;
      for (const entry of rarityPool) {
        roll -= entry.weight;
        if (roll <= 0) return entry.name;
      }
      return 'common';
    };

    items.forEach((item) => {
      if (item.dataset.rarityApplied) return;
      const rarity = pickRarity();
      item.classList.add(`case-item--${rarity}`);
      item.dataset.rarityApplied = 'true';
    });

    let currentX = 0;
    let spinning = false;
    let velocity = 0;
    let halfWidth = track.scrollWidth / 2;

    const getItemMetrics = () => {
      const first = items[0];
      const trackStyle = window.getComputedStyle(track);
      const gap = parseFloat(trackStyle.gap || trackStyle.columnGap) || 0;
      return { width: first.offsetWidth + gap };
    };

    const wrapPosition = () => {
      if (currentX <= -halfWidth) {
        currentX += halfWidth;
      }
      if (currentX > 0) {
        currentX -= halfWidth;
      }
    };

    const updateHalfWidth = () => {
      halfWidth = track.scrollWidth / 2;
    };

    const showResult = (item) => {
      if (!result) return;
      resultImage.src = item.dataset.image || '';
      resultImage.alt = item.dataset.title || '';
      resultTitle.textContent = item.dataset.title || '';
      resultDesc.textContent = item.dataset.description || '';
      resultPrice.textContent = item.dataset.price || '';
      if (resultVariant) {
        resultVariant.value = item.dataset.variant || '';
      }
      result.hidden = false;
    };

    const hideResult = () => {
      if (!result) return;
      result.hidden = true;
    };

    const spin = () => {
      if (spinning) return;
      spinning = true;
      carousel.classList.add('is-active');
      carousel.classList.add('is-spinning');
      hideResult();
      spinButton.hidden = true;

      if (spinAudio) {
        spinAudio.currentTime = 0;
        spinAudio.play().catch(() => {});
      }

      updateHalfWidth();
      const metrics = getItemMetrics();
      const viewport = carousel.querySelector('.case-viewport');
      if (!viewport) return;
      const center = viewport.offsetWidth / 2;
      const baseCount = Math.floor(items.length / 2);
      const baseItems = items.slice(0, baseCount);

      velocity = 30;
      const duration = 6000;
      const start = performance.now();
      let lastTime = start;
      const startVelocityItems = 36;
      const endVelocityItems = 0.2;

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const itemsPerSecond = startVelocityItems + (endVelocityItems - startVelocityItems) * ease;
        velocity = itemsPerSecond * metrics.width;
        const delta = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
        lastTime = now;
        currentX -= velocity * delta;
        wrapPosition();
        track.style.transform = `translateX(${currentX}px)`;

        if (progress >= 1) {
          const indexFloat = (center - currentX - metrics.width / 2) / metrics.width;
          const snapIndex = Math.round(indexFloat);
          const target = center - (snapIndex * metrics.width + metrics.width / 2);
          currentX = target;
          wrapPosition();
          track.style.transform = `translateX(${currentX}px)`;
          spinning = false;
          const winner = baseItems[((snapIndex % baseItems.length) + baseItems.length) % baseItems.length];
          showResult(winner);
          if (spinAudio) {
            spinAudio.pause();
          }
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    spinButton.addEventListener('click', spin);
    if (resultClose) {
      resultClose.addEventListener('click', () => {
        hideResult();
        carousel.classList.remove('is-active');
        carousel.classList.remove('is-spinning');
        spinButton.hidden = false;
      });
    }
    if (resultAdd) {
      resultAdd.addEventListener('submit', async (event) => {
        event.preventDefault();
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          body: new FormData(resultAdd)
        });
        if (response.ok) {
          hideResult();
        } else {
          resultAdd.submit();
        }
      });
    }
  });

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

    cartForm.querySelectorAll('[data-cart-remove-key]').forEach((button) => {
      button.addEventListener('click', async () => {
        const key = button.dataset.cartRemoveKey;
        if (!key) return;

        const beforeCart = await fetchCart();
        if (!beforeCart) return;

        const updates = {};
        beforeCart.items.forEach((item) => {
          updates[item.key] = item.key === key ? 0 : item.quantity;
        });

        const response = await fetch('/cart/update.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ updates })
        });

        if (!response.ok) {
          return;
        }

        const updatedCart = await response.json();
        await refreshCartCount(updatedCart);
        window.location.reload();
      });
    });
  }

  document.querySelectorAll('.cart-price').forEach((price) => {
    const row = price.closest('.cart-meta-row');
    if (row) {
      price.addEventListener('mouseenter', () => {
        row.classList.add('is-breakdown');
      });
      price.addEventListener('mouseleave', () => {
        row.classList.remove('is-breakdown');
      });
    }

    price.addEventListener('click', () => {
      if (!window.matchMedia('(max-width: 980px)').matches) {
        return;
      }
      price.classList.toggle('is-breakdown');
      price.classList.add('is-tapped');
      if (row) {
        row.classList.toggle('is-breakdown', price.classList.contains('is-breakdown'));
      }
      if (price.classList.contains('is-breakdown')) {
        clearTimeout(price._breakdownTimer);
        price._breakdownTimer = setTimeout(() => {
          price.classList.remove('is-breakdown');
          price.classList.remove('is-tapped');
          if (row) {
            row.classList.remove('is-breakdown');
          }
        }, 10000);
      } else {
        clearTimeout(price._breakdownTimer);
        setTimeout(() => {
          price.classList.remove('is-tapped');
        }, 200);
      }
    });
  });

  document.querySelectorAll('[data-product-media]').forEach((media) => {
    const mainImg = media.querySelector('[data-media-main] img');
    if (!mainImg) {
      return;
    }
    const lens = media.querySelector('[data-zoom-lens]');
    const zoomWindow = media.querySelector('[data-zoom-window]');
    const mediaMain = media.querySelector('[data-media-main]');
    const zoomModal = document.querySelector('[data-zoom-modal]');
    const zoomModalImg = zoomModal ? zoomModal.querySelector('img') : null;
    const zoomModalClose = zoomModal ? zoomModal.querySelector('.product-zoom-close') : null;
    let zoomReady = false;
    let zoomSrc = mainImg.dataset.mediaZoom || mainImg.src;

    const setZoomImage = (src) => {
      zoomSrc = src;
      if (!zoomWindow) return;
      zoomWindow.style.backgroundImage = `url("${src}")`;
    };

    if (zoomWindow) {
      setZoomImage(zoomSrc);
      mainImg.addEventListener('load', () => {
        zoomReady = true;
      });
      if (mainImg.complete) {
        zoomReady = true;
      }
    }

    media.querySelectorAll('[data-media-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.mediaSrc;
        const zoomSrc = thumb.dataset.mediaZoom || src;
        if (!src) return;
        mainImg.src = src;
        mainImg.removeAttribute('srcset');
        mainImg.removeAttribute('sizes');
        setZoomImage(zoomSrc);
        if (zoomModalImg) {
          zoomModalImg.src = src;
        }

        media.querySelectorAll('[data-media-thumb]').forEach((button) => {
          button.classList.toggle('is-active', button === thumb);
        });
      });
    });

    if (!zoomWindow || !lens || !mediaMain) {
      return;
    }

    const moveZoom = (event) => {
      if (!zoomReady) return;
      const rect = mediaMain.getBoundingClientRect();
      const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
      const y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);

      const lensSize = 120;
      const lensX = Math.min(Math.max(x - lensSize / 2, 0), rect.width - lensSize);
      const lensY = Math.min(Math.max(y - lensSize / 2, 0), rect.height - lensSize);

      lens.style.transform = `translate(${lensX}px, ${lensY}px)`;
      lens.style.width = `${lensSize}px`;
      lens.style.height = `${lensSize}px`;

      const zoomX = (x / rect.width) * 100;
      const zoomY = (y / rect.height) * 100;
      zoomWindow.style.backgroundPosition = `${zoomX}% ${zoomY}%`;
    };

    const showZoom = () => {
      zoomWindow.classList.add('is-visible');
      lens.classList.add('is-visible');
    };

    const hideZoom = () => {
      zoomWindow.classList.remove('is-visible');
      lens.classList.remove('is-visible');
    };

    mediaMain.addEventListener('mouseenter', showZoom);
    mediaMain.addEventListener('mouseleave', hideZoom);
    mediaMain.addEventListener('mousemove', moveZoom);

    if (zoomModal && zoomModalImg) {
      const openModal = () => {
        zoomModalImg.src = mainImg.src;
        zoomModal.classList.add('is-visible');
      };
      const closeModal = () => {
        zoomModal.classList.remove('is-visible');
      };

      mainImg.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 980px)').matches) {
          openModal();
        }
      });
      zoomModal.addEventListener('click', (event) => {
        if (event.target === zoomModal) {
          closeModal();
        }
      });
      if (zoomModalClose) {
        zoomModalClose.addEventListener('click', closeModal);
      }
    }
  });

  const cartCount = document.querySelector('[data-cart-count]');

  let cartCache = null;

  const fetchCart = async () => {
    const response = await fetch('/cart.js', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    if (!response.ok) return null;
    return response.json();
  };

  const refreshCartCount = async (cart) => {
    const resolvedCart = cart || (await fetchCart());
    if (!resolvedCart) return null;
    cartCache = resolvedCart;
    if (cartCount) {
      cartCount.textContent = resolvedCart.item_count;
    }
    if (cartCount) {
      cartCount.hidden = resolvedCart.item_count === 0;
    }
    return resolvedCart;
  };

  const setProductQtyState = (form, quantity) => {
    const controls = form.querySelector('[data-product-qty-controls]');
    const count = form.querySelector('[data-product-qty-count]');
    const button = form.querySelector('[data-add-to-cart-button]');
    if (!controls || !count || !button) return;

    if (quantity > 0) {
      form.classList.add('has-in-cart');
      controls.hidden = false;
      button.hidden = true;
      count.textContent = `${quantity} in cart`;
    } else {
      form.classList.remove('has-in-cart');
      controls.hidden = true;
      button.hidden = false;
      count.textContent = '';
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

  const syncVariantState = (cart) => {
    if (!cart) return;
    document.querySelectorAll('[data-add-to-cart]').forEach((form) => {
      const variantId = parseInt(form.dataset.variantId, 10);
      if (!variantId) return;
      const item = cart.items.find((entry) => entry.id === variantId);
      const state = getVariantState(variantId);
      state.qty = item ? item.quantity : 0;
      state.key = item ? item.key : null;
      state.pendingDelta = 0;
    });
  };

  const initProductControls = async () => {
    const cart = await refreshCartCount();
    syncVariantState(cart);
    updateProductControls(cart);
  };

  initProductControls();

  const qtyState = new Map();

  const getVariantState = (variantId) => {
    if (!qtyState.has(variantId)) {
      qtyState.set(variantId, {
        pendingDelta: 0,
        timer: null,
        inFlight: false,
        qty: 0,
        key: null
      });
    }
    return qtyState.get(variantId);
  };

  const scheduleVariantUpdate = (variantId, form) => {
    const state = getVariantState(variantId);
    if (state.timer) {
      clearTimeout(state.timer);
    }
    state.timer = setTimeout(async () => {
      if (state.inFlight) {
        scheduleVariantUpdate(variantId, form);
        return;
      }
      state.inFlight = true;

      const desiredQty = Math.max(0, state.qty + state.pendingDelta);
      state.pendingDelta = 0;

      if (desiredQty === state.qty) {
        state.inFlight = false;
        return;
      }

      if (!state.key && desiredQty > 0) {
        const addResponse = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ id: variantId, quantity: desiredQty })
        });
        if (!addResponse.ok) {
          state.inFlight = false;
          const refreshed = await refreshCartCount();
          syncVariantState(refreshed);
          updateProductControls(refreshed);
          return;
        }
      } else if (state.key) {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ id: state.key, quantity: desiredQty })
        });
        if (!response.ok) {
          state.inFlight = false;
          const refreshed = await refreshCartCount();
          syncVariantState(refreshed);
          updateProductControls(refreshed);
          return;
        }
      }

      const updatedCart = await refreshCartCount();
      syncVariantState(updatedCart);
      updateProductControls(updatedCart);
      state.inFlight = false;
    }, 350);
  };

  document.querySelectorAll('[data-add-to-cart]').forEach((form) => {
    const variantId = parseInt(form.dataset.variantId, 10);
    const controls = form.querySelector('[data-product-qty-controls]');

    if (controls && variantId) {
      controls.querySelectorAll('[data-product-qty-btn]').forEach((button) => {
        button.addEventListener('click', async () => {
          const direction = button.dataset.productQtyBtn;
          const state = getVariantState(variantId);
          if (direction === 'plus') {
            state.pendingDelta += 1;
          } else {
            if (state.qty + state.pendingDelta <= 0) return;
            state.pendingDelta -= 1;
          }

          scheduleVariantUpdate(variantId, form);
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
          credentials: 'same-origin',
          body: new FormData(form)
        });

        if (!response.ok) {
          throw new Error('Add to cart failed');
        }

        const updatedCart = await refreshCartCount();
        syncVariantState(updatedCart);
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

  document.querySelectorAll('[data-cart-upsell]').forEach((form) => {
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
          credentials: 'same-origin',
          body: new FormData(form)
        });

        if (!response.ok) {
          throw new Error('Add upsell failed');
        }

        await refreshCartCount();
        window.location.reload();
      } catch (error) {
        form.submit();
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  });

  document.querySelectorAll('[data-upsell-quick-add]').forEach((form) => {
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
          credentials: 'same-origin',
          body: new FormData(form)
        });

        if (!response.ok) {
          throw new Error('Add upsell failed');
        }

        const updatedCart = await refreshCartCount();
        updateProductControls(updatedCart);
        const card = form.closest('.product-upsell-inline');
        if (card) {
          card.style.display = 'none';
        }
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
