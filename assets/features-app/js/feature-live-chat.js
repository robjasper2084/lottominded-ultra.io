(() => {
  const openButtons = document.querySelectorAll("[data-live-chat-open]");
  const panel = document.querySelector("[data-live-chat-panel]");
  const closeButton = document.querySelector("[data-live-chat-close]");
  const chatFrame = document.querySelector("[data-live-chat-frame]");

  if (!openButtons.length || !panel || !chatFrame) return;

  const getChatUrl = () => {
    const channel = chatFrame.dataset.twitchChannel || "lottominded";
    const parents = new Set(["robjasper2084.github.io", "127.0.0.1", "localhost"]);
    if (window.location.hostname) parents.add(window.location.hostname);
    const params = Array.from(parents)
      .filter(Boolean)
      .map((parent) => `parent=${encodeURIComponent(parent)}`)
      .join("&");
    return `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?${params}&darkpopout`;
  };

  const setOpenState = (isOpen) => {
    panel.hidden = !isOpen;
    panel.classList.toggle("is-open", isOpen);
    openButtons.forEach((button) => {
      button.setAttribute("aria-expanded", String(isOpen));
    });

    if (isOpen && !chatFrame.src) {
      chatFrame.src = getChatUrl();
    }

    if (isOpen) {
      closeButton?.focus({ preventScroll: true });
    }
  };

  window.lottoMindLiveChat = {
    open: () => setOpenState(true),
    close: () => setOpenState(false),
    toggle: () => setOpenState(panel.hidden),
    isOpen: () => !panel.hidden,
  };
  document.documentElement.dataset.liveChatReady = "true";

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest?.("[data-live-chat-open]");
    if (openButton) {
      setOpenState(panel.hidden);
      return;
    }

    if (event.target.closest?.("[data-live-chat-close]")) {
      setOpenState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpenState(false);
      openButtons[0]?.focus({ preventScroll: true });
    }
  });
})();
