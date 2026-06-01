document.documentElement.classList.remove('no-js');

// Stagger product card animations
const stagger = (selector, delay) => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.animationDelay = `${i * delay}ms`;
  });
};
window.addEventListener('load', () => stagger('.product-card', 90));

// ===== MOBILE NAV =====
const hamburger     = document.querySelector('.hamburger');
const mobileNav     = document.getElementById('mobile-nav');
const mobileOverlay = document.querySelector('.mobile-nav-overlay');
const mobileClose   = document.querySelector('.mobile-nav-close');

function openMobileNav() {
  mobileNav?.classList.add('open');
  mobileOverlay?.classList.add('open');
  hamburger?.classList.add('open');
  hamburger?.setAttribute('aria-expanded', 'true');
  mobileNav?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  mobileNav?.classList.remove('open');
  mobileOverlay?.classList.remove('open');
  hamburger?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  mobileNav?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', openMobileNav);
mobileClose?.addEventListener('click', closeMobileNav);
mobileOverlay?.addEventListener('click', closeMobileNav);

// ===== CART DRAWER =====
const cartDrawer      = document.getElementById('cart-drawer');
const cartOverlay     = document.getElementById('cart-overlay');
const cartDrawerClose = document.querySelector('.cart-drawer-close');
const cartDrawerBody  = document.getElementById('cart-drawer-body');
const cartCountEl     = document.querySelector('.cart-count');

function openCartDrawer() {
  cartDrawer?.classList.add('open');
  cartOverlay?.classList.add('open');
  cartDrawer?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  refreshCartDrawer();
}

function closeCartDrawer() {
  cartDrawer?.classList.remove('open');
  cartOverlay?.classList.remove('open');
  cartDrawer?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function formatMoney(cents) {
  return '$' + (cents / 100).toFixed(2);
}

async function refreshCartDrawer() {
  try {
    const res  = await fetch('/cart.js');
    const cart = await res.json();

    if (cartCountEl) {
      cartCountEl.textContent = cart.item_count;
      cartCountEl.style.display = cart.item_count > 0 ? 'flex' : 'none';
    }

    if (!cartDrawerBody) return;

    if (cart.items.length === 0) {
      cartDrawerBody.innerHTML = '<p class="cart-empty-msg">Your cart is empty.</p>';
      return;
    }

    cartDrawerBody.innerHTML = cart.items.map(item => `
      <div class="cart-item">
        ${item.image ? `<img src="${item.image}" alt="${item.product_title}" width="80" height="80" loading="lazy">` : '<div style="width:80px;height:80px;background:#f0f0f0;border-radius:10px;"></div>'}
        <div class="cart-item-info">
          <span class="cart-item-title">${item.product_title}</span>
          ${item.variant_title && item.variant_title !== 'Default Title' ? `<span class="cart-item-variant">${item.variant_title}</span>` : ''}
          <span class="cart-item-price">Qty ${item.quantity} &middot; ${formatMoney(item.line_price)}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Cart refresh error:', err);
  }
}

cartDrawerClose?.addEventListener('click', closeCartDrawer);
cartOverlay?.addEventListener('click', closeCartDrawer);

document.querySelector('.cart-link')?.addEventListener('click', e => {
  e.preventDefault();
  openCartDrawer();
});

// ===== AJAX ADD TO CART =====
const productForm = document.getElementById('product-form');

productForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn       = productForm.querySelector('.btn-add-to-cart');
  const variantId = document.getElementById('variant-id')?.value;
  if (!variantId) return;

  btn.disabled    = true;
  btn.textContent = 'Adding…';

  try {
    const res = await fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 })
    });

    if (!res.ok) throw new Error('Add to cart failed');

    btn.textContent = 'Added!';
    openCartDrawer();

    setTimeout(() => {
      btn.disabled    = false;
      btn.textContent = 'Add to cart';
    }, 1800);
  } catch (err) {
    console.error(err);
    btn.disabled    = false;
    btn.textContent = 'Add to cart';
  }
});

// ===== PRODUCT GALLERY =====
document.querySelectorAll('.gallery-thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const mainImg = document.getElementById('gallery-main-img');
    if (mainImg) {
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src           = thumb.dataset.src;
        mainImg.style.opacity = '1';
      }, 150);
    }
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  });
});

// ===== VARIANT SELECTION =====
const variantIdInput = document.getElementById('variant-id');

if (variantIdInput && typeof window.productVariants !== 'undefined') {
  const selectedOptions = {};

  // Seed selected options from active buttons
  document.querySelectorAll('.option-btn.active').forEach(btn => {
    selectedOptions[btn.dataset.optionIndex] = btn.dataset.value;
  });

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.optionIndex;
      selectedOptions[idx] = btn.dataset.value;

      document.querySelectorAll(`.option-btn[data-option-index="${idx}"]`)
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const match = window.productVariants.find(v =>
        Object.entries(selectedOptions).every(([i, val]) =>
          v[`option${parseInt(i, 10) + 1}`] === val
        )
      );

      if (match) {
        variantIdInput.value = match.id;
        const atcBtn = document.querySelector('.btn-add-to-cart');
        if (atcBtn) {
          atcBtn.disabled    = !match.available;
          atcBtn.textContent = match.available ? 'Add to cart' : 'Sold out';
        }
      }
    });
  });
}

// ===== EMAIL POPUP =====
const emailPopup        = document.getElementById('email-popup');
const emailPopupOverlay = document.getElementById('email-popup-overlay');
const emailPopupClose   = document.querySelector('.email-popup-close');
const popupForm         = document.getElementById('popup-form');

function showEmailPopup() {
  if (!emailPopup) return;
  emailPopup.classList.add('open');
  emailPopupOverlay?.classList.add('open');
  emailPopup.setAttribute('aria-hidden', 'false');
}

function hideEmailPopup() {
  emailPopup?.classList.remove('open');
  emailPopupOverlay?.classList.remove('open');
  emailPopup?.setAttribute('aria-hidden', 'true');
  localStorage.setItem('mc_popup_seen', '1');
}

emailPopupClose?.addEventListener('click', hideEmailPopup);
emailPopupOverlay?.addEventListener('click', hideEmailPopup);
popupForm?.addEventListener('submit', hideEmailPopup);

if (!localStorage.getItem('mc_popup_seen')) {
  setTimeout(showEmailPopup, 8000);
}
