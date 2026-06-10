(() => {
  const isStreamPage = document.body.classList.contains("live-events-page") || document.body.classList.contains("stream-page");
  const isMerchPage = document.body.classList.contains("merch-store-page");
  if (!isStreamPage && !isMerchPage) return;

  const eventUrl = "https://www.eventbrite.com/e/serengeti-galleries-presents-juneteenth-celebration-tickets-1989124716573";
  const bannerSrc = "./assets/events/serengeti-juneteenth-celebration.webp";
  const popupDelay = 10000;

  const openExternal = (event) => {
    event.preventDefault();
    window.open(eventUrl, "_blank", "noopener,noreferrer");
  };

  function addStreamFeature() {
    if (!isStreamPage || document.querySelector("[data-juneteenth-stream-feature]")) return;

    const anchor = document.querySelector(".motion-hero-events") || document.querySelector("#upcoming-streams") || document.querySelector(".motion-marquee") || document.querySelector("main");
    if (!anchor) return;

    const feature = document.createElement("section");
    feature.className = "motion-section juneteenth-stream-feature";
    feature.dataset.juneteenthStreamFeature = "true";
    feature.setAttribute("aria-label", "Serengeti Galleries Juneteenth Celebration feature");
    feature.innerHTML = `
      <div class="juneteenth-feature-card">
        <div class="juneteenth-feature-panel">
          <div class="juneteenth-feature-art">
            <img src="${bannerSrc}" alt="Serengeti Galleries Juneteenth Celebration event banner" loading="lazy" />
          </div>
          <div class="juneteenth-feature-copy">
            <p class="motion-overline">Featured Stream Event</p>
            <h2>Serengeti Galleries Presents Juneteenth Celebration</h2>
            <p>
              A premium culture-room spotlight for art, music, community, and celebration inside the
              LOTTOMINDED ULTRA live stream universe.
            </p>
            <div class="juneteenth-feature-actions">
              <a class="juneteenth-button is-gold" href="${eventUrl}" target="_blank" rel="noopener noreferrer">Get Tickets</a>
              <a class="juneteenth-button" href="./merch-store.html#live-events">Shop + Stream</a>
            </div>
          </div>
        </div>
        <div class="juneteenth-feature-panel" aria-hidden="true">
          <div class="juneteenth-feature-art">
            <img src="${bannerSrc}" alt="" loading="lazy" />
          </div>
          <div class="juneteenth-feature-copy">
            <p class="motion-overline">Featured Stream Event</p>
            <h2>Serengeti Galleries Presents Juneteenth Celebration</h2>
            <p>
              A premium culture-room spotlight for art, music, community, and celebration inside the
              LOTTOMINDED ULTRA live stream universe.
            </p>
            <div class="juneteenth-feature-actions">
              <a class="juneteenth-button is-gold" href="${eventUrl}" target="_blank" rel="noopener noreferrer" tabindex="-1">Get Tickets</a>
              <a class="juneteenth-button" href="./merch-store.html#live-events" tabindex="-1">Shop + Stream</a>
            </div>
          </div>
        </div>
      </div>
    `;

    if (anchor.matches(".motion-hero-events")) {
      anchor.insertAdjacentElement("afterend", feature);
      return;
    }

    if (anchor.id === "upcoming-streams") {
      anchor.insertAdjacentElement("beforebegin", feature);
      return;
    }
    anchor.insertAdjacentElement("afterend", feature);
  }

  function createPopup() {
    if (document.querySelector("[data-juneteenth-event-popup]")) return null;

    const modal = document.createElement("aside");
    modal.className = "juneteenth-event-popup";
    modal.dataset.juneteenthEventPopup = "true";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="juneteenth-popup-backdrop" data-juneteenth-close></div>
      <div class="juneteenth-popup-panel" role="dialog" aria-modal="true" aria-labelledby="juneteenthPopupTitle">
        <button class="juneteenth-popup-close" type="button" data-juneteenth-close aria-label="Close Juneteenth event announcement">X</button>
        <div class="juneteenth-popup-head">
          <span>Special Event Announcement</span>
          <small>Appears 10 seconds after page load</small>
        </div>
        <img class="juneteenth-popup-image" src="${bannerSrc}" alt="Serengeti Galleries Juneteenth Celebration event banner" />
        <div class="juneteenth-popup-body">
          <p class="juneteenth-popup-kicker">Serengeti Galleries Presents</p>
          <h2 id="juneteenthPopupTitle">Juneteenth Celebration</h2>
          <p>Join the celebration of freedom, culture, art, music, community, and Black-owned creative energy.</p>
          <div class="juneteenth-popup-actions">
            <a class="juneteenth-button is-gold" href="${eventUrl}" target="_blank" rel="noopener noreferrer" data-eventbrite-link>Get Tickets</a>
            ${isMerchPage
              ? '<a class="juneteenth-button" href="#drop">Shop Merch</a>'
              : '<a class="juneteenth-button" href="./merch-store.html#drop">Shop Merch</a>'}
            <button class="juneteenth-button is-muted" type="button" data-juneteenth-close>Maybe Later</button>
          </div>
        </div>
      </div>
    `;

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-juneteenth-close]")) closePopup(modal);
    });

    modal.querySelector("[data-eventbrite-link]")?.addEventListener("click", openExternal);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closePopup(modal);
    });

    document.body.appendChild(modal);
    return modal;
  }

  function openPopup(modal) {
    if (!modal || modal.classList.contains("is-open")) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("juneteenth-event-modal-open");
    window.setTimeout(() => modal.querySelector(".juneteenth-popup-close")?.focus(), 50);
  }

  function closePopup(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("juneteenth-event-modal-open");
  }

  addStreamFeature();

  const modal = createPopup();
  window.setTimeout(() => openPopup(modal), popupDelay);
})();
