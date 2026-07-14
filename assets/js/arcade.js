(function initializeLottoMindArcade() {
  "use strict";

  const FAVORITES_KEY = "lottomindArcadeFavorites";
  const RECENT_KEY = "lottomindArcadeRecent";
  const MAX_RECENT = 6;
  const games = Array.isArray(window.LottoMindArcadeGames) ? window.LottoMindArcadeGames : [];
  const byId = new Map(games.map((game) => [game.id, game]));

  const elements = {
    count: document.querySelector("[data-arcade-count]"),
    featured: document.querySelector("[data-arcade-featured]"),
    grid: document.querySelector("[data-arcade-grid]"),
    search: document.querySelector("[data-arcade-search]"),
    categories: document.querySelector("[data-arcade-categories]"),
    viewFilters: document.querySelector("[data-arcade-view-filters]"),
    sort: document.querySelector("[data-arcade-sort]"),
    empty: document.querySelector("[data-arcade-empty]"),
    live: document.querySelector("[data-arcade-live]")
  };

  if (!elements.grid) return;

  const state = {
    query: "",
    category: "All",
    view: "all",
    sort: "featured",
    favorites: new Set(readArray(FAVORITES_KEY)),
    recent: readArray(RECENT_KEY).filter((id) => byId.has(id)).slice(0, MAX_RECENT)
  };

  function readArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
    } catch {
      return [];
    }
  }

  function writeArray(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The Arcade remains playable when storage is unavailable.
    }
  }

  function announce(message) {
    if (elements.live) elements.live.textContent = message;
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function markRecent(gameId) {
    state.recent = [gameId, ...state.recent.filter((id) => id !== gameId)].slice(0, MAX_RECENT);
    writeArray(RECENT_KEY, state.recent);
  }

  function launchGame(game, newTab) {
    if (!game || game.status !== "Live") return;
    markRecent(game.id);
    announce(`${game.title} added to recently played.`);
    if (newTab) {
      window.open(game.path, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(game.path);
    }
  }

  function toggleFavorite(gameId, button) {
    if (state.favorites.has(gameId)) state.favorites.delete(gameId);
    else state.favorites.add(gameId);
    writeArray(FAVORITES_KEY, [...state.favorites]);
    const active = state.favorites.has(gameId);
    if (button) {
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${byId.get(gameId).title} ${active ? "from" : "to"} favorites`);
      button.textContent = active ? "\u2605" : "\u2606";
    }
    announce(`${byId.get(gameId).title} ${active ? "saved to" : "removed from"} favorites.`);
    renderGrid();
  }

  function makeArtwork(game) {
    const media = createElement("div", `arcade-card__media arcade-card__media--${game.accent || "signal"}`);
    const fallback = createElement("div", "arcade-card__fallback");
    fallback.setAttribute("aria-hidden", "true");
    fallback.innerHTML = "<i></i><i></i><i></i><span>LM // PLAY</span>";
    media.append(fallback);

    if (game.image) {
      const image = new Image();
      image.loading = "lazy";
      image.decoding = "async";
      image.alt = `${game.title} artwork`;
      image.src = game.image;
      image.addEventListener("load", () => media.classList.add("has-image"), { once: true });
      image.addEventListener("error", () => image.remove(), { once: true });
      media.append(image);
    }

    const status = createElement("span", "arcade-card__status", game.status);
    media.append(status);
    return media;
  }

  function makeGameCard(game, compact = false) {
    const card = createElement("article", `arcade-card${compact ? " arcade-card--compact" : ""}`);
    card.dataset.gameId = game.id;
    card.append(makeArtwork(game));

    const body = createElement("div", "arcade-card__body");
    const meta = createElement("div", "arcade-card__meta");
    meta.append(createElement("span", "arcade-card__category", game.category));
    meta.append(createElement("span", "arcade-card__difficulty", game.difficulty));

    const favorite = createElement("button", "arcade-card__favorite", state.favorites.has(game.id) ? "\u2605" : "\u2606");
    favorite.type = "button";
    favorite.setAttribute("aria-pressed", String(state.favorites.has(game.id)));
    favorite.setAttribute("aria-label", `${state.favorites.has(game.id) ? "Remove" : "Add"} ${game.title} ${state.favorites.has(game.id) ? "from" : "to"} favorites`);
    favorite.addEventListener("click", () => toggleFavorite(game.id, favorite));
    meta.append(favorite);
    body.append(meta);

    const title = createElement("h3", "arcade-card__title", game.title);
    body.append(title);
    if (!compact) body.append(createElement("p", "arcade-card__description", game.description));

    const controls = createElement("p", "arcade-card__controls", game.controls);
    controls.setAttribute("aria-label", `Controls: ${game.controls}`);
    body.append(controls);

    const actions = createElement("div", "arcade-card__actions");
    const play = createElement("button", "arcade-card__play", game.status === "Live" ? "Play now" : "Unavailable");
    play.type = "button";
    play.disabled = game.status !== "Live";
    play.addEventListener("click", () => launchGame(game, false));
    actions.append(play);

    const newTab = createElement("button", "arcade-card__new-tab", "\u2197");
    newTab.type = "button";
    newTab.disabled = game.status !== "Live";
    newTab.setAttribute("aria-label", `Open ${game.title} in a new tab`);
    newTab.title = "Open in a new tab";
    newTab.addEventListener("click", () => launchGame(game, true));
    actions.append(newTab);
    body.append(actions);
    card.append(body);
    return card;
  }

  function renderFeatured() {
    if (!elements.featured) return;
    elements.featured.replaceChildren(...games.filter((game) => game.featured).map((game) => makeGameCard(game)));
  }

  function filteredGames() {
    const query = state.query.trim().toLowerCase();
    let result = games.filter((game) => {
      const matchesCategory = state.category === "All" || game.category === state.category;
      const searchable = [game.title, game.description, game.category, game.controls, ...game.tags].join(" ").toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesView =
        state.view === "all" ||
        (state.view === "featured" && game.featured) ||
        (state.view === "favorites" && state.favorites.has(game.id)) ||
        (state.view === "recent" && state.recent.includes(game.id));
      return matchesCategory && matchesQuery && matchesView;
    });

    if (state.sort === "alphabetical") result.sort((a, b) => a.title.localeCompare(b.title));
    if (state.sort === "category") result.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    if (state.sort === "recent") {
      result.sort((a, b) => {
        const aIndex = state.recent.indexOf(a.id);
        const bIndex = state.recent.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return a.title.localeCompare(b.title);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
    if (state.sort === "featured") result.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
    return result;
  }

  function renderGrid() {
    const result = filteredGames();
    elements.grid.replaceChildren(...result.map((game) => makeGameCard(game)));
    if (elements.empty) elements.empty.hidden = result.length > 0;
    announce(`${result.length} ${result.length === 1 ? "game" : "games"} shown.`);
  }

  function setPressed(container, selector, value) {
    container.querySelectorAll(selector).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.value === value));
    });
  }

  function renderCategories() {
    if (!elements.categories) return;
    const categories = ["All", ...new Set(games.map((game) => game.category))];
    elements.categories.replaceChildren(...categories.map((category) => {
      const button = createElement("button", "arcade-filter", category);
      button.type = "button";
      button.dataset.value = category;
      button.setAttribute("aria-pressed", String(category === state.category));
      button.addEventListener("click", () => {
        state.category = category;
        setPressed(elements.categories, "button", category);
        renderGrid();
      });
      return button;
    }));
  }

  let searchTimer = 0;
  elements.search?.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = elements.search.value;
      renderGrid();
    }, 180);
  });

  elements.viewFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    state.view = button.dataset.value;
    setPressed(elements.viewFilters, "button", state.view);
    renderGrid();
  });

  elements.sort?.addEventListener("change", () => {
    state.sort = elements.sort.value;
    renderGrid();
  });

  document.querySelectorAll("[data-arcade-launch]").forEach((button) => {
    button.addEventListener("click", () => launchGame(byId.get(button.dataset.arcadeLaunch), false));
  });

  if (elements.count) elements.count.textContent = String(games.filter((game) => game.status === "Live").length);
  renderCategories();
  renderFeatured();
  renderGrid();
})();
