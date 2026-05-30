const merchRoot = document.documentElement;
const merchHero = document.querySelector("[data-merch-tilt]");
const bagDrawer = document.querySelector("[data-bag-drawer]");
const bagCount = document.querySelector("[data-bag-count]");
const bagItems = document.querySelector("[data-bag-items]");
const bagTotal = document.querySelector("[data-bag-total]");
const cartNote = document.querySelector("[data-cart-note]");
const CART_STORAGE_KEY = "lottomind.merch.cart.v1";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

const bag = loadCart();

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(bag));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function getCartTotals() {
  return bag.reduce(
    (totals, item) => ({
      count: totals.count + item.quantity,
      subtotal: totals.subtotal + item.price * item.quantity,
    }),
    { count: 0, subtotal: 0 },
  );
}

function updateBag() {
  if (!bagCount || !bagItems) return;
  const totals = getCartTotals();
  bagCount.textContent = String(totals.count);
  if (bagTotal) bagTotal.textContent = formatMoney(totals.subtotal);

  bagItems.innerHTML = bag.length
    ? bag.map((item) => `
        <li class="cart-line">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${formatMoney(item.price)} each</span>
          </div>
          <div class="cart-quantity" aria-label="${escapeHtml(item.name)} quantity">
            <button type="button" data-cart-decrease="${escapeHtml(item.id)}" aria-label="Decrease ${escapeHtml(item.name)}">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-increase="${escapeHtml(item.id)}" aria-label="Increase ${escapeHtml(item.name)}">+</button>
          </div>
          <strong>${formatMoney(item.price * item.quantity)}</strong>
          <button class="cart-remove" type="button" data-cart-remove="${escapeHtml(item.id)}">Remove</button>
        </li>
      `).join("")
    : `<li class="cart-empty">Your cart is empty. Add a hoodie, cap, polo, or gallery piece.</li>`;

  if (cartNote) {
    cartNote.textContent = bag.length
      ? "Checkout preview is local only. Connect a live storefront when the drop is ready."
      : "Shipping and taxes are not calculated in this local preview.";
  }
  saveCart();
}

function addToCart(button) {
  const name = button.dataset.addItem;
  const price = Number(button.dataset.itemPrice || 0);
  if (!name || !price) return;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = bag.find((item) => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    bag.push({ id, name, price, quantity: 1 });
  }
  updateBag();
  bagDrawer?.classList.add("is-open");

  const oldText = button.textContent;
  button.textContent = "Added";
  window.setTimeout(() => {
    button.textContent = oldText;
  }, 900);
}

function changeCartQuantity(id, delta) {
  const index = bag.findIndex((item) => item.id === id);
  if (index < 0) return;
  bag[index].quantity += delta;
  if (bag[index].quantity <= 0) bag.splice(index, 1);
  updateBag();
}

function removeCartItem(id) {
  const index = bag.findIndex((item) => item.id === id);
  if (index < 0) return;
  bag.splice(index, 1);
  updateBag();
}

function copyTextArea(targetId, button) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const copyJob = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(target.value)
    : Promise.resolve(target.select() || document.execCommand("copy"));
  copyJob.then(() => {
    const oldText = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = oldText;
    }, 1200);
  });
}

document.addEventListener("pointermove", (event) => {
  merchRoot.style.setProperty("--mx", `${event.clientX}px`);
  merchRoot.style.setProperty("--my", `${event.clientY}px`);
  if (!merchHero) return;
  const rect = merchHero.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  merchHero.style.setProperty("--hero-copy-x", `${x * -0.018}px`);
  merchHero.style.setProperty("--hero-copy-y", `${y * -0.018}px`);
  merchHero.style.setProperty("--hero-product-x", `${x * 0.018}px`);
  merchHero.style.setProperty("--hero-product-y", `${y * 0.018}px`);
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-item]");
  if (addButton) {
    addToCart(addButton);
    return;
  }

  const copyButton = event.target.closest("[data-copy-target]");
  if (copyButton) {
    copyTextArea(copyButton.dataset.copyTarget, copyButton);
    return;
  }

  const increaseButton = event.target.closest("[data-cart-increase]");
  if (increaseButton) {
    changeCartQuantity(increaseButton.dataset.cartIncrease, 1);
    return;
  }

  const decreaseButton = event.target.closest("[data-cart-decrease]");
  if (decreaseButton) {
    changeCartQuantity(decreaseButton.dataset.cartDecrease, -1);
    return;
  }

  const removeButton = event.target.closest("[data-cart-remove]");
  if (removeButton) {
    removeCartItem(removeButton.dataset.cartRemove);
    return;
  }

  if (event.target.closest("[data-cart-clear]")) {
    bag.splice(0, bag.length);
    updateBag();
    return;
  }

  if (event.target.closest("[data-cart-checkout]")) {
    if (cartNote) cartNote.textContent = bag.length
      ? "Checkout is ready to connect. Add a Shopify or Stripe URL when the drop goes live."
      : "Add something to the cart before checkout preview.";
    return;
  }

  if (event.target.closest("[data-bag-toggle]")) {
    bagDrawer?.classList.toggle("is-open");
    return;
  }

  if (event.target.closest("[data-bag-close]")) {
    bagDrawer?.classList.remove("is-open");
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.18 },
);

document.querySelectorAll(".merch-store-page [data-reveal]").forEach((section) => revealObserver.observe(section));

updateBag();
