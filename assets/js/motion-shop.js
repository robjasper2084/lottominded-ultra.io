(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isFinePointer = window.matchMedia("(pointer: fine)");

  function setupReveal() {
    const targets = Array.from(document.querySelectorAll("[data-reveal]"));
    targets.forEach((target) => {
      target.querySelectorAll(".motion-event-card, .motion-feature-card, .motion-unlock-card, .motion-stack-panel").forEach((child, index) => {
        child.style.setProperty("--reveal-index", String(index));
      });
    });

    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    targets.forEach((target) => observer.observe(target));
  }

  function setupOverlayMenu() {
    const menu = document.querySelector("[data-motion-menu]");
    const toggles = Array.from(document.querySelectorAll("[data-motion-menu-toggle]"));
    if (!menu || !toggles.length) return;

    const closeButtons = Array.from(menu.querySelectorAll("[data-motion-menu-close]"));
    const links = Array.from(menu.querySelectorAll("a"));
    let lastFocus = null;

    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("motion-menu-open", open);
      toggles.forEach((button) => button.setAttribute("aria-expanded", String(open)));
      menu.setAttribute("aria-hidden", String(!open));

      if (open) {
        lastFocus = document.activeElement;
        const firstLink = links[0] || closeButtons[0];
        firstLink?.focus({ preventScroll: true });
      } else if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus({ preventScroll: true });
      }
    };

    toggles.forEach((button) => {
      button.addEventListener("click", () => setOpen(true));
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => setOpen(false));
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    menu.addEventListener("click", (event) => {
      if (event.target === menu) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  function setupActiveSections() {
    const menuLinks = Array.from(document.querySelectorAll(".motion-menu-links a[href^='#']"));
    const navLinks = Array.from(document.querySelectorAll(".motion-anchor-nav a[href^='#']"));
    const links = [...menuLinks, ...navLinks];
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const setActive = (id) => {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActive(visible.target.id);
    }, { threshold: [0.22, 0.5, 0.72] });

    sections.forEach((section) => observer.observe(section));
  }

  function setupParallax() {
    if (reduceMotion.matches || !isFinePointer.matches) return;

    document.querySelectorAll("[data-parallax-hero]").forEach((hero) => {
      const layers = Array.from(hero.querySelectorAll("[data-parallax-layer]"));
      if (!layers.length) return;

      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        layers.forEach((layer, index) => {
          const strength = Number(layer.dataset.parallaxLayer || index + 1);
          const moveX = x * strength * 14;
          const moveY = y * strength * 10;
          layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        });
      }, { passive: true });

      hero.addEventListener("pointerleave", () => {
        layers.forEach((layer) => {
          layer.style.transform = "";
        });
      });
    });
  }

  function setupMagneticButtons() {
    if (reduceMotion.matches || !isFinePointer.matches) return;

    document.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        button.style.setProperty("--magnetic-x", `${x}px`);
        button.style.setProperty("--magnetic-y", `${y}px`);
      }, { passive: true });

      button.addEventListener("pointerleave", () => {
        button.style.setProperty("--magnetic-x", "0px");
        button.style.setProperty("--magnetic-y", "0px");
      });
    });
  }

  function setupCursorCards() {
    if (!isFinePointer.matches) return;

    document.querySelectorAll("[data-cursor-card]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  function setupRails() {
    document.querySelectorAll("[data-motion-rail]").forEach((rail) => {
      const shell = rail.closest(".motion-rail-shell") || rail.parentElement;
      const previous = shell?.querySelector("[data-rail-prev]");
      const next = shell?.querySelector("[data-rail-next]");
      const step = () => Math.max(rail.clientWidth * 0.82, 280);

      previous?.addEventListener("click", () => {
        rail.scrollBy({ left: -step(), behavior: reduceMotion.matches ? "auto" : "smooth" });
      });

      next?.addEventListener("click", () => {
        rail.scrollBy({ left: step(), behavior: reduceMotion.matches ? "auto" : "smooth" });
      });
    });
  }

  function setupMarqueeClones() {
    document.querySelectorAll(".motion-marquee-track").forEach((track) => {
      if (track.dataset.marqueeReady === "true") return;
      track.dataset.marqueeReady = "true";
      const content = track.innerHTML;
      track.insertAdjacentHTML("beforeend", content);
    });
  }

  function initMotionShop() {
    setupMarqueeClones();
    setupReveal();
    setupOverlayMenu();
    setupActiveSections();
    setupParallax();
    setupMagneticButtons();
    setupCursorCards();
    setupRails();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMotionShop, { once: true });
  } else {
    initMotionShop();
  }

  window.addEventListener("lottomind:motion-refresh", initMotionShop);
})();
