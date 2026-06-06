(() => {
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const createdAt = Date.now();
  const isoFromNow = (offset) => new Date(createdAt + offset).toISOString();

  const LOTTO_MIND_STREAM_EVENTS = [
    {
      id: "neon-sky-live-concert",
      title: "Neon Sky Live Concert",
      description: "A high-energy studio concert with neon synth textures, live vocals, and cinematic camera movement.",
      category: "Concert",
      thumbnailUrl: "./assets/brand/lm-records-studio-room.png",
      bannerUrl: "./assets/brand/generated-cinematic-hero.png",
      previewVideoUrl: "./assets/video/laugh-lab-comedy-night-preview.mp4",
      streamType: "embed",
      streamUrl: "https://www.youtube-nocookie.com/embed/6GHATpTBBHc?rel=0&modestbranding=1",
      externalUrl: "https://www.youtube.com/watch?v=6GHATpTBBHc",
      startsAt: isoFromNow(-20 * MINUTE),
      endsAt: isoFromNow(90 * MINUTE),
      isFeatured: true,
      access: "free",
      artistName: "Bloom Through Gloom",
      venueName: "LM Records Stage",
      city: "Detroit",
      tags: ["live music", "neon", "studio session"]
    },
    {
      id: "city-lights-music-festival",
      title: "City Lights Music Festival",
      description: "A premium multi-stage music festival stream with late-night sets, host segments, and visual interludes.",
      category: "Music Festival",
      thumbnailUrl: "./assets/brand/lm-host-dark-wide.png",
      bannerUrl: "./assets/brand/lm-host-dark-wide.png",
      previewVideoUrl: "./assets/video/city-lights-music-festival-11s.mp4",
      previewLoopSeconds: 11,
      streamType: "external",
      externalUrl: "https://example.com/city-lights-stream",
      startsAt: isoFromNow(2 * DAY + 2 * HOUR),
      endsAt: isoFromNow(2 * DAY + 7 * HOUR),
      isFeatured: true,
      access: "premium",
      hostName: "LottoMind Live",
      venueName: "City Lights Main Stage",
      city: "Detroit",
      tags: ["festival", "premium", "multi-stage"]
    },
    {
      id: "laugh-lab-comedy-night",
      title: "Laugh Lab Comedy Night",
      description: "An intimate comedy showcase with sharp hosts, quick sets, and a clean stream-room feel.",
      category: "Comedy",
      thumbnailUrl: "./assets/brand/laugh-lab-comedy-night.png",
      bannerUrl: "./assets/brand/laugh-lab-comedy-night.png",
      streamType: "mp4",
      streamUrl: "./assets/video/home-prompt-bloom-blend.mp4",
      startsAt: isoFromNow(5 * HOUR),
      endsAt: isoFromNow(7 * HOUR),
      status: "upcoming",
      isFeatured: true,
      access: "free",
      hostName: "The Laugh Lab Crew",
      venueName: "Signal Room",
      city: "Detroit",
      tags: ["comedy", "showcase", "live room"]
    },
    {
      id: "creative-summit-keynote",
      title: "Creative Summit Keynote",
      description: "A members-only keynote on creative workflow, brand systems, and studio publishing strategy.",
      category: "Conference",
      thumbnailUrl: "./assets/brand/lm-host-white.png",
      bannerUrl: "./assets/brand/lm-records-circuit-banner.png",
      previewEmbedUrl: "https://www.youtube-nocookie.com/embed/4euNaGauB5k?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=4euNaGauB5k&modestbranding=1&rel=0",
      streamType: "external",
      externalUrl: "https://www.youtube.com/watch?v=4euNaGauB5k",
      startsAt: isoFromNow(7 * DAY + 3 * HOUR),
      endsAt: isoFromNow(7 * DAY + 5 * HOUR),
      status: "upcoming",
      isFeatured: true,
      access: "members_only",
      hostName: "LM Records Studio Team",
      venueName: "Creative Summit Stage",
      tags: ["conference", "keynote", "members"]
    },
    {
      id: "replay-acoustic-after-hours",
      title: "Replay: Acoustic After Hours",
      description: "A warm late-night acoustic performance replay with soft lighting, close vocals, and relaxed pacing.",
      category: "Replay",
      thumbnailUrl: "./assets/brand/lm-records-studio-room.png",
      bannerUrl: "./assets/brand/generated-cinematic-hero.png",
      previewVideoUrl: "./assets/video/replay-acoustic-after-hours-preview.mp4",
      streamType: "mp4",
      replayUrl: "./assets/video/replay-acoustic-after-hours-preview.mp4",
      startsAt: isoFromNow(-2 * DAY),
      endsAt: isoFromNow(-2 * DAY + 2 * HOUR),
      status: "ended",
      isFeatured: true,
      access: "free",
      artistName: "Acoustic After Hours",
      venueName: "LM Records Stage",
      tags: ["replay", "acoustic", "after hours"]
    }
  ];

  function getComputedEventStatus(event, now = new Date()) {
    if (event.status === "cancelled") return "cancelled";
    const currentTime = now.getTime();
    const startTime = Date.parse(event.startsAt);
    const endTime = event.endsAt ? Date.parse(event.endsAt) : startTime + 2 * HOUR;
    if (currentTime >= startTime && currentTime <= endTime) return "live";
    if (currentTime < startTime) return "upcoming";
    return "ended";
  }

  function isEventLive(event, now = new Date()) {
    return getComputedEventStatus(event, now) === "live";
  }

  function isEventUpcoming(event, now = new Date()) {
    return getComputedEventStatus(event, now) === "upcoming";
  }

  function isEventReplayAvailable(event, now = new Date()) {
    return getComputedEventStatus(event, now) === "ended" && Boolean(event.replayUrl);
  }

  function getFeaturedLiveEvents(events) {
    return sortStreamEvents(events.filter((event) => event.isFeatured));
  }

  function sortStreamEvents(events, now = new Date()) {
    const priority = { live: 0, upcoming: 1, ended: 2, cancelled: 3 };
    return [...events].sort((a, b) => {
      const statusA = getComputedEventStatus(a, now);
      const statusB = getComputedEventStatus(b, now);
      if (priority[statusA] !== priority[statusB]) return priority[statusA] - priority[statusB];
      return Date.parse(a.startsAt) - Date.parse(b.startsAt);
    });
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function formatAccess(access) {
    if (access === "members_only") return "Members only";
    if (access === "premium") return "Premium";
    return "Free";
  }

  function getStatusLabel(event, now = new Date()) {
    const status = getComputedEventStatus(event, now);
    if (status === "live") return "LIVE NOW";
    if (status === "upcoming") return "UPCOMING";
    if (status === "cancelled") return "CANCELLED";
    return event.replayUrl ? "REPLAY" : "ENDED";
  }

  function getCtaLabel(event, now = new Date()) {
    const status = getComputedEventStatus(event, now);
    if (status === "live") return "Watch Live";
    if (status === "upcoming") return "View Event";
    if (status === "ended" && event.replayUrl) return "Watch Replay";
    return "View Event";
  }

  function getCountdownText(event, now = new Date()) {
    const diff = Date.parse(event.startsAt) - now.getTime();
    if (diff <= MINUTE) return "Starting soon";
    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    const minutes = Math.floor((diff % HOUR) / MINUTE);
    if (days > 0) return `Starts in ${days}d ${hours}h`;
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  }

  function eventUrl(event) {
    return `./live-events.html?event=${encodeURIComponent(event.id)}`;
  }

  function escapeText(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function renderStatusBadge(event) {
    const status = getComputedEventStatus(event);
    return `<span class="stream-event-status is-status-${status}">${getStatusLabel(event)}</span>`;
  }

  function renderEventCardMedia(event) {
    const status = getComputedEventStatus(event);
    if (event.previewEmbedUrl) {
      return `
        <iframe
          class="stream-event-preview-embed"
          src="${event.previewEmbedUrl}"
          title="${escapeText(event.title)} video preview"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          aria-label="${escapeText(event.title)} event preview video"
        ></iframe>
      `;
    }
    if (event.previewVideoUrl) {
      const loopSeconds = Number(event.previewLoopSeconds || 0);
      const loopAttr = loopSeconds > 0 ? ` data-preview-loop-seconds="${loopSeconds}"` : "";
      return `
        <video class="stream-event-preview-video" autoplay muted loop playsinline webkit-playsinline preload="metadata" poster="${event.thumbnailUrl}"${loopAttr} aria-label="${escapeText(event.title)} event preview">
          <source src="${event.previewVideoUrl}" type="video/mp4" />
        </video>
      `;
    }
    if (status === "live" && event.streamType === "mp4" && event.streamUrl) {
      return `
        <video autoplay muted loop playsinline webkit-playsinline preload="metadata" poster="${event.thumbnailUrl}" aria-label="${escapeText(event.title)} live stream preview">
          <source src="${event.streamUrl}" type="video/mp4" />
        </video>
      `;
    }
    return `<img src="${event.thumbnailUrl}" alt="${escapeText(event.title)} event artwork" loading="lazy" />`;
  }

  function renderEventCard(event) {
    const status = getComputedEventStatus(event);
    const countdown = isEventUpcoming(event) ? `<span>${getCountdownText(event)}</span>` : "";
    return `
      <a class="stream-event-card is-${status}" href="${eventUrl(event)}" data-event-id="${escapeText(event.id)}" aria-label="Open ${escapeText(event.title)}">
        <span class="stream-event-media">
          ${renderEventCardMedia(event)}
          ${renderStatusBadge(event)}
        </span>
        <span class="stream-event-card-body">
          <span class="stream-event-category">${escapeText(event.category)}</span>
          <strong>${escapeText(event.title)}</strong>
          <span class="stream-event-time">${formatDateTime(event.startsAt)} ${countdown}</span>
          <span class="stream-event-card-footer">
            <span class="stream-event-access">${formatAccess(event.access)}</span>
            <span class="stream-event-cta">${getCtaLabel(event)}</span>
          </span>
        </span>
      </a>
    `;
  }

  function renderLiveEventsRail(root) {
    const events = getFeaturedLiveEvents(LOTTO_MIND_STREAM_EVENTS);
    const title = root.dataset.title || "Featured Stream Events";
    const subtitle = root.dataset.subtitle || "Watch live concerts, comedy, festivals, conferences, and special events.";
    if (!events.length) {
      root.innerHTML = `
        <div class="stream-events-head">
          <p class="eyebrow">Live entertainment</p>
          <h2 class="stream-events-burst-title" data-burst="${escapeText(title)}" tabindex="0">${escapeText(title)}</h2>
          <p>${escapeText(subtitle)}</p>
        </div>
        <p class="stream-event-empty">No featured stream events right now. Check back soon for new live shows and replays.</p>
      `;
      return;
    }

    root.innerHTML = `
      <div class="stream-events-head">
        <p class="eyebrow">Live entertainment</p>
        <h2 class="stream-events-burst-title" data-burst="${escapeText(title)}" tabindex="0">${escapeText(title)}</h2>
        <p>${escapeText(subtitle)}</p>
      </div>
      <div class="stream-events-grid" aria-label="${escapeText(title)}">
        ${events.map(renderEventCard).join("")}
      </div>
    `;
  }

  function findEventFromUrl(events) {
    const params = new URLSearchParams(window.location.search);
    const selectedId = params.get("event");
    return events.find((event) => event.id === selectedId) || events[0] || null;
  }

  function renderPlayer(event) {
    const status = getComputedEventStatus(event);
    if (status === "cancelled") {
      return `<div class="live-event-state">This event has been cancelled.</div>`;
    }
    if (status === "live" && event.streamType === "embed" && event.streamUrl) {
      const externalAction = event.externalUrl
        ? `<a class="secondary-action" href="${event.externalUrl}" rel="noopener noreferrer">Open on YouTube</a>`
        : "";
      return `
        <div class="live-event-state">
          <strong>Live concert stream is loaded above.</strong>
          ${externalAction}
        </div>
      `;
    }
    if (status === "live" && event.streamUrl) {
      return `
        <div class="live-event-player">
          <video controls autoplay muted playsinline preload="metadata" poster="${event.bannerUrl || event.thumbnailUrl}">
            <source src="${event.streamUrl}" type="video/mp4" />
          </video>
        </div>
      `;
    }
    if (status === "ended" && event.replayUrl) {
      return `
        <div class="live-event-player">
          <video controls playsinline preload="metadata" poster="${event.bannerUrl || event.thumbnailUrl}">
            <source src="${event.replayUrl}" type="video/mp4" />
          </video>
        </div>
      `;
    }
    if (status === "upcoming") {
      const externalAction = event.streamType === "external" && event.externalUrl
        ? `<a class="secondary-action" href="${event.externalUrl}" rel="noopener noreferrer">Open Stream</a>`
        : "";
      return `
        <div class="live-event-state live-event-upcoming">
          <strong>${getCountdownText(event)}</strong>
          <button class="primary-action" type="button" data-event-reminder="${event.id}">Set Reminder</button>
          ${externalAction}
        </div>
      `;
    }
    if (event.streamType === "external" && event.externalUrl) {
      return `
        <div class="live-event-state">
          <p>This stream opens with the event host.</p>
          <a class="primary-action" href="${event.externalUrl}" rel="noopener noreferrer">Open Stream</a>
        </div>
      `;
    }
    return `<div class="live-event-state">Stream details will appear here when available.</div>`;
  }

  function renderDetailBanner(event) {
    const status = getComputedEventStatus(event);
    if (event.previewEmbedUrl) {
      return `
        <div class="live-event-banner live-event-embed-banner">
          <iframe
            src="${event.previewEmbedUrl}"
            title="${escapeText(event.title)} video background"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          ${renderStatusBadge(event)}
        </div>
      `;
    }
    if (status === "live" && event.streamType === "embed" && event.streamUrl) {
      return `
        <div class="live-event-banner live-event-embed-banner">
          <iframe
            src="${event.streamUrl}"
            title="${escapeText(event.title)} live concert stream"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          ${renderStatusBadge(event)}
        </div>
      `;
    }
    return `
      <div class="live-event-banner">
        <img src="${event.bannerUrl || event.thumbnailUrl}" alt="${escapeText(event.title)} banner artwork" />
        ${renderStatusBadge(event)}
      </div>
    `;
  }

  function renderDetail(root, event) {
    if (!event) {
      root.innerHTML = `<p class="stream-event-empty">No featured stream events right now. Check back soon for new live shows and replays.</p>`;
      return;
    }

    const meta = [
      event.artistName,
      event.hostName,
      event.venueName,
      event.city
    ].filter(Boolean);

    root.innerHTML = `
      <article class="live-event-detail">
        ${renderDetailBanner(event)}
        <div class="live-event-copy">
          <div class="live-event-topline">
            <span class="stream-event-category">${escapeText(event.category)}</span>
            <span class="stream-event-access">${formatAccess(event.access)}</span>
          </div>
          <h2>${escapeText(event.title)}</h2>
          <p>${escapeText(event.description)}</p>
          <div class="live-event-meta">
            <span>${formatDateTime(event.startsAt)}</span>
            ${meta.map((item) => `<span>${escapeText(item)}</span>`).join("")}
          </div>
          ${renderPlayer(event)}
        </div>
      </article>
    `;
  }

  function setupReminders(scope = document) {
    scope.querySelectorAll("[data-event-reminder]").forEach((button) => {
      button.addEventListener("click", () => {
        button.textContent = "Reminder set";
        window.alert("Reminder set for this event.");
      });
    });
  }

  function setupPreviewLoops(scope = document) {
    scope.querySelectorAll("video[data-preview-loop-seconds]").forEach((video) => {
      if (video.dataset.previewLoopReady === "true") return;
      video.dataset.previewLoopReady = "true";
      const limit = Number(video.dataset.previewLoopSeconds || 0);
      if (!limit) return;
      const restartPreview = () => {
        if (video.currentTime >= limit) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      };
      video.addEventListener("timeupdate", restartPreview);
      video.addEventListener("loadedmetadata", () => {
        if (video.currentTime >= limit) video.currentTime = 0;
      }, { once: true });
    });
  }

  function setupStreamStartupAudio() {
    const audio = document.querySelector("[data-stream-events-soundtrack]");
    const startup = document.querySelector("[data-stream-startup-audio]");
    const status = document.querySelector("[data-stream-startup-status]");
    if (!audio || !startup) return;

    const close = () => {
      startup.classList.add("is-hidden");
      document.body.classList.remove("has-stream-startup-audio");
    };

    const start = async () => {
      try {
        audio.volume = 0.42;
        audio.loop = true;
        audio.currentTime = 0;
        await audio.play();
        close();
      } catch (error) {
        startup.classList.add("is-audio-blocked");
        if (status) {
          status.textContent = "Tap Start Music again if your browser needs another gesture.";
        }
      }
    };

    startup.querySelector("[data-stream-startup-play]")?.addEventListener("click", start);
    startup.querySelectorAll("[data-stream-startup-close]").forEach((button) => {
      button.addEventListener("click", close);
    });
    startup.addEventListener("click", (event) => {
      if (event.target === startup) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !startup.classList.contains("is-hidden")) close();
    });
    document.querySelectorAll("video").forEach((video) => {
      video.addEventListener("play", () => {
        if (!audio.paused) audio.pause();
      });
    });
  }

  function setupLiveEventArtlines() {
    if (!document.body.classList.contains("live-events-page")) return;
    const update = (x, y) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      document.body.style.setProperty("--artline-x", `${Math.round(x)}px`);
      document.body.style.setProperty("--artline-y", `${Math.round(y)}px`);
      document.body.style.setProperty("--artline-xp", `${Math.round((x / width) * 100)}%`);
      document.body.style.setProperty("--artline-yp", `${Math.round((y / height) * 100)}%`);
    };

    update(window.innerWidth * 0.68, window.innerHeight * 0.38);
    window.addEventListener("pointermove", (event) => update(event.clientX, event.clientY), { passive: true });
    window.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches?.[0] || event.changedTouches?.[0];
        if (touch) update(touch.clientX, touch.clientY);
      },
      { passive: true },
    );
  }

  function renderLiveEventsPage(root) {
    const events = getFeaturedLiveEvents(LOTTO_MIND_STREAM_EVENTS);
    const grid = root.querySelector("[data-live-events-grid]");
    const detail = root.querySelector("[data-live-event-detail]");
    if (grid) grid.innerHTML = events.map(renderEventCard).join("");
    if (detail) renderDetail(detail, findEventFromUrl(events));
    setupReminders(root);
    setupPreviewLoops(root);
  }

  setupStreamStartupAudio();
  setupLiveEventArtlines();
  document.querySelectorAll("[data-live-events-rail]").forEach(renderLiveEventsRail);
  document.querySelectorAll("[data-live-events-page]").forEach(renderLiveEventsPage);
  setupPreviewLoops(document);
  window.LOTTO_MIND_STREAM_EVENTS = LOTTO_MIND_STREAM_EVENTS;
  window.LottoMindLiveEvents = {
    getComputedEventStatus,
    getFeaturedLiveEvents,
    sortStreamEvents,
    isEventLive,
    isEventUpcoming,
    isEventReplayAvailable
  };
  window.dispatchEvent(new Event("lottomind:motion-refresh"));
})();
