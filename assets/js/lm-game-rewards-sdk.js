(function () {
  "use strict";

  const DEFAULT_BATCH_SIZE = 50;

  function randomId(prefix) {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }

  function getApiBaseUrl(options) {
    const params = new URLSearchParams(window.location.search);
    let parentApiBaseUrl = "";
    try {
      parentApiBaseUrl = window.parent && window.parent !== window ? window.parent.LOTTOMIND_REWARDS_API_BASE_URL || "" : "";
    } catch {
      parentApiBaseUrl = "";
    }
    const sameOriginLocalApi = /^(127\.0\.0\.1|localhost)$/i.test(window.location.hostname) ? window.location.origin : "";
    return (
      options.apiBaseUrl ||
      params.get("rewardsApi") ||
      window.LOTTOMIND_REWARDS_API_BASE_URL ||
      parentApiBaseUrl ||
      sameOriginLocalApi
    ).replace(/\/+$/, "");
  }

  async function request(apiBaseUrl, path, init = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers || {}),
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.error?.code || data?.error?.message || `HTTP ${response.status}`);
    }
    return data;
  }

  async function diagnosticHash(value) {
    if (!window.crypto?.subtle) return value;
    const bytes = new TextEncoder().encode(value);
    const hash = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function createClient(options = {}) {
    const apiBaseUrl = getApiBaseUrl(options);
    const disabled = options.disabled === true || !apiBaseUrl || !options.gameId || !options.buildId;
    const mode = options.mode || "arcade";
    const buffer = [];
    let sessionId = null;
    let eventToken = null;
    let expiresAt = 0;
    let nextSeq = 1;
    let previousEventHash = null;
    let startedAt = Date.now();
    let initPromise = null;
    let closed = false;

    const status = (state, detail) => options.onStatus?.({ status: state, detail });

    async function initialize() {
      if (disabled || closed) return null;
      if (initPromise) return initPromise;
      initPromise = (async () => {
        status("session_creating");
        const created = await request(apiBaseUrl, "/api/v1/game-sessions", {
          method: "POST",
          body: JSON.stringify({
            gameId: options.gameId,
            mode,
            buildId: options.buildId,
          }),
        });
        sessionId = created.sessionId;
        startedAt = Date.now();
        const exchanged = await request(apiBaseUrl, `/api/v1/game-sessions/${encodeURIComponent(sessionId)}/exchange`, {
          method: "POST",
          body: JSON.stringify({ launchToken: created.launchToken }),
        });
        eventToken = exchanged.eventToken;
        expiresAt = Date.parse(exchanged.expiresAt) || 0;
        status("ready", { sessionId });
        return created;
      })().catch((error) => {
        status("error", error);
        throw error;
      });
      return initPromise;
    }

    async function emit(input) {
      if (disabled || closed) {
        status("disabled", { type: input.type });
        return null;
      }
      await initialize();
      if (expiresAt && Date.now() >= expiresAt) throw new Error("Rewards session expired");
      const event = {
        eventId: input.eventId || randomId("evt"),
        seq: nextSeq,
        type: input.type,
        simulationTick: input.simulationTick,
        clientElapsedMs: input.clientElapsedMs ?? Math.max(0, Math.round(Date.now() - startedAt)),
        previousEventHash,
        payload: input.payload || {},
      };
      previousEventHash = await diagnosticHash(JSON.stringify({
        id: event.eventId,
        seq: event.seq,
        type: event.type,
        payload: event.payload,
      }));
      nextSeq += 1;
      buffer.push(event);
      return event;
    }

    async function flush() {
      if (disabled || closed || !buffer.length) return null;
      await initialize();
      const batch = buffer.slice(0, DEFAULT_BATCH_SIZE);
      status("flushing", { count: batch.length });
      const response = await request(apiBaseUrl, `/api/v1/game-sessions/${encodeURIComponent(sessionId)}/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${eventToken}` },
        body: JSON.stringify({ events: batch }),
      });
      const acceptedThrough = Number(response.acceptedThrough || 0);
      while (buffer.length && buffer[0].seq <= acceptedThrough) buffer.shift();
      status("ready", response);
      return response;
    }

    async function finalize(input) {
      if (disabled || closed) return null;
      await flush();
      status("finalizing");
      const response = await request(apiBaseUrl, `/api/v1/game-sessions/${encodeURIComponent(sessionId)}/finalize`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (response?.status === "rewarded") {
        try {
          const account = window.LottoMindAccountService || (window.parent !== window ? window.parent.LottoMindAccountService : null);
          account?.refresh?.();
        } catch {}
        try {
          window.parent?.postMessage?.({ type: "lottomind:game-reward", reward: response.reward, wallet: response.wallet }, window.location.origin);
        } catch {}
      }
      closed = response?.status === "rewarded";
      status(closed ? "closed" : "ready", response);
      return response;
    }

    return {
      get disabled() {
        return disabled;
      },
      emit,
      flush,
      finalize,
      close() {
        closed = true;
        buffer.splice(0, buffer.length);
        status("closed");
      },
    };
  }

  window.LottoMindGameRewards = { createClient };
})();
