const merchRoot = document.documentElement;
const merchHero = document.querySelector("[data-merch-tilt]");
const bagDrawer = document.querySelector("[data-bag-drawer]");
const bagCount = document.querySelector("[data-bag-count]");
const bagItems = document.querySelector("[data-bag-items]");
const bag = [];

function updateBag() {
  if (!bagCount || !bagItems) return;
  bagCount.textContent = String(bag.length);
  bagItems.innerHTML = bag.length
    ? bag.map((item) => `<li>${item}</li>`).join("")
    : "<li>No items yet. Add a hoodie, cap, polo, or gallery piece.</li>";
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
    bag.push(addButton.dataset.addItem);
    updateBag();
    bagDrawer?.classList.add("is-open");
  }

  const copyButton = event.target.closest("[data-copy-target]");
  if (copyButton) {
    copyTextArea(copyButton.dataset.copyTarget, copyButton);
  }

  if (event.target.closest("[data-bag-toggle]")) {
    bagDrawer?.classList.toggle("is-open");
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
