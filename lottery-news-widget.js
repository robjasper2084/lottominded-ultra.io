(function initLotteryNewsWidget() {
  const root = document.querySelector("#lottery-news");
  if (!root) return;

  const list = root.querySelector("[data-lottery-news-list]");
  const status = root.querySelector("[data-lottery-news-status]");
  const modal = document.querySelector("[data-lottery-news-modal]");
  const closeButton = modal?.querySelector("[data-lottery-news-close]");
  const modalTitle = modal?.querySelector("[data-lottery-news-modal-title]");
  const modalCategory = modal?.querySelector("[data-lottery-news-modal-category]");
  const modalMeta = modal?.querySelector("[data-lottery-news-modal-meta]");
  const modalBody = modal?.querySelector("[data-lottery-news-modal-body]");
  const modalVerify = modal?.querySelector("[data-lottery-news-modal-verify]");
  const modalTags = modal?.querySelector("[data-lottery-news-modal-tags]");
  const modalSources = modal?.querySelector("[data-lottery-news-modal-sources]");

  const RESPONSIBLE_PLAY =
    "Lottery information should be verified with the official lottery operator, and play should remain responsible.";
  const NON_OFFICIAL_NOTE =
    "Official results and prize claims should be checked against the relevant lottery operator before relying on them.";

  let articles = [];

  const text = (value, fallback = "") => String(value || fallback).trim();

  const articleDate = (article) => (
    article.publishedAt ||
    article.date ||
    article.importedAt ||
    article.generatedAt ||
    ""
  );

  const formatDate = (value) => {
    if (!value) return "Date pending";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
  };

  const getCategory = (article) => (
    article.category ||
    (Array.isArray(article.categories) ? article.categories[0] : "")
  );

  const isLottery = (article) => {
    const category = getCategory(article);
    return category === "Lottery" || (Array.isArray(article.categories) && article.categories.includes("Lottery"));
  };

  const getDek = (article) => text(article.dek || article.summary || article.snippet || article.brief, "Source brief available.");

  const getBody = (article) => text(article.body || article.brief || article.summary || article.snippet, "Open the source link for the full article context.");

  const getStatus = (article) => text(article.status || article.sourceTrustLevel || article.sourceType || "Source linked");

  const isAutomated = (article) => article.isAutomated === true || article.automated === true || Boolean(article.importMethod);

  const getVerification = (article) => {
    const base = text(article.verificationNote || article.verificationLanguage || article.officialVerificationLanguage, RESPONSIBLE_PLAY);
    const official = article.sourceTrustLevel === "official-lottery";
    if (official || base.includes(NON_OFFICIAL_NOTE)) return base;
    return `${base} ${NON_OFFICIAL_NOTE}`;
  };

  const getTags = (article) => {
    if (Array.isArray(article.tags)) return article.tags;
    if (Array.isArray(article.categories)) return article.categories;
    return [getCategory(article)].filter(Boolean);
  };

  const getSources = (article) => {
    if (Array.isArray(article.sources) && article.sources.length) return article.sources;
    return [
      {
        name: article.sourceName || "Original source",
        url: article.sourceUrl || article.sourceHomepage || article.url
      }
    ];
  };

  const sourceUrl = (article) => article.url || article.sourceUrl || article.sourceHomepage || "#";

  const clearNode = (node) => {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  };

  const appendMeta = (node, value) => {
    if (!node || !value) return;
    const span = document.createElement("span");
    span.textContent = value;
    node.append(span);
  };

  const renderCards = () => {
    if (!list) return;
    clearNode(list);
    const visible = articles.slice(0, 3);

    if (!visible.length) {
      const empty = document.createElement("article");
      empty.className = "sd-news-card sd-news-card--placeholder";
      empty.innerHTML = "<span class=\"sd-news-badge\">Standby</span><h3>No Lottery briefs loaded</h3><p>The sphere controls remain available while news data is unavailable.</p>";
      list.append(empty);
      return;
    }

    visible.forEach((article, index) => {
      const card = document.createElement("article");
      card.className = "sd-news-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Open lottery news: ${article.title || "article"}`);

      const badge = document.createElement("span");
      badge.className = "sd-news-badge";
      badge.textContent = isAutomated(article) ? "Automated source brief" : "Lottery";

      const title = document.createElement("h3");
      title.textContent = text(article.title, "Untitled lottery brief");

      const meta = document.createElement("div");
      meta.className = "sd-news-card__meta";
      appendMeta(meta, formatDate(articleDate(article)));
      appendMeta(meta, article.sourceName || "Source pending");
      appendMeta(meta, getStatus(article));

      const dek = document.createElement("p");
      dek.textContent = getDek(article);

      const link = document.createElement("a");
      link.className = "sd-news-source";
      link.href = sourceUrl(article);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Source";
      link.addEventListener("click", (event) => event.stopPropagation());

      const open = () => openModal(index);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });

      card.append(badge, title, meta, dek, link);
      list.append(card);
    });
  };

  const openModal = (index) => {
    const article = articles[index];
    if (!article || !modal) return;

    if (modalTitle) modalTitle.textContent = text(article.title, "Lottery News");
    if (modalCategory) modalCategory.textContent = getCategory(article) || "Lottery";
    if (modalBody) modalBody.textContent = getBody(article);
    if (modalVerify) modalVerify.textContent = getVerification(article);

    clearNode(modalMeta);
    appendMeta(modalMeta, formatDate(articleDate(article)));
    appendMeta(modalMeta, getStatus(article));
    appendMeta(modalMeta, article.sourceName || "Source pending");
    appendMeta(modalMeta, article.importedAt ? `Imported ${formatDate(article.importedAt)}` : "");

    clearNode(modalTags);
    getTags(article).forEach((tag) => appendMeta(modalTags, tag));

    clearNode(modalSources);
    getSources(article).forEach((source) => {
      const url = typeof source === "string" ? source : source.url;
      const name = typeof source === "string" ? "Source" : source.name || "Source";
      if (!url) return;
      const link = document.createElement("a");
      link.className = "sd-news-source";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = name;
      modalSources?.append(link);
    });

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    closeButton?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  };

  const fetchArticles = async () => {
    const candidates = ["./articles.json", "./news-articles.json"];
    let lastError;
    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("No article feed available");
  };

  closeButton?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.getAttribute("aria-hidden") === "false") closeModal();
  });

  fetchArticles()
    .then((data) => {
      articles = (Array.isArray(data) ? data : [])
        .filter(isLottery)
        .sort((a, b) => new Date(articleDate(b)).getTime() - new Date(articleDate(a)).getTime());
      renderCards();
      if (status) {
        status.textContent = articles.length
          ? `${articles.length} Lottery source briefs available.`
          : "No Lottery articles were found in the current source file.";
      }
    })
    .catch((error) => {
      console.warn("Lottery news widget could not load articles.json.", error);
      articles = [];
      renderCards();
      if (status) status.textContent = "Lottery news is temporarily unavailable. The spheres remain ready.";
    });
})();
