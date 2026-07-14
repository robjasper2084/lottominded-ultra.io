(function initLottoMindAccountService(global) {
  "use strict";

  if (global.LottoMindAccountService) return;

  var CACHE_KEY = "lottomind.account.snapshot.v1";
  var API_BASE_KEY = "lottomind.api.base";
  var CACHE_TTL = 30000;
  var snapshotCache = null;
  var snapshotTime = 0;
  var subscribers = new Set();
  var channel = "BroadcastChannel" in global ? new BroadcastChannel("lottomind-account-v1") : null;

  function defaultApiBase() {
    if (typeof global.LOTTOMIND_API_BASE_URL === "string") return global.LOTTOMIND_API_BASE_URL.replace(/\/$/, "");
    var configured = "";
    try { configured = localStorage.getItem(API_BASE_KEY) || ""; } catch (_error) {}
    if (configured) return configured.replace(/\/$/, "");
    if (location.hostname === "127.0.0.1" && location.port === "8170") return "http://127.0.0.1:8142";
    if (location.hostname === "localhost" && location.port === "8170") return "http://127.0.0.1:8142";
    return "";
  }

  function apiUrl(path) {
    return defaultApiBase() + "/api" + path;
  }

  function cachedOfflineSnapshot() {
    try {
      var parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      return Object.assign({}, parsed, { verified: false, offline: true });
    } catch (_error) {
      return null;
    }
  }

  function saveSnapshot(snapshot) {
    snapshotCache = Object.assign({}, snapshot, { verified: true, offline: false });
    snapshotTime = Date.now();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(snapshotCache)); } catch (_error) {}
    subscribers.forEach(function notify(callback) {
      try { callback(snapshotCache); } catch (_error) {}
    });
    global.dispatchEvent(new CustomEvent("lottomind:account-refresh", { detail: snapshotCache }));
    return snapshotCache;
  }

  async function request(path, options) {
    var response;
    try {
      response = await fetch(apiUrl(path), Object.assign({
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Requested-With": "LottoMind-Web" },
      }, options || {}));
    } catch (error) {
      var networkError = new Error("The account service is offline. Your verified balance cannot be changed right now.");
      networkError.code = "ACCOUNT_OFFLINE";
      networkError.cause = error;
      throw networkError;
    }
    if (response.status === 204) return null;
    var payload = await response.json().catch(function noJson() { return {}; });
    if (!response.ok) {
      var message = payload && payload.error && payload.error.message ? payload.error.message : "The account request could not be completed.";
      var requestError = new Error(message);
      requestError.code = payload && payload.error && payload.error.code ? payload.error.code : "ACCOUNT_REQUEST_FAILED";
      requestError.status = response.status;
      throw requestError;
    }
    return payload;
  }

  async function getSnapshot(options) {
    var force = options && options.force;
    if (!force && snapshotCache && Date.now() - snapshotTime < CACHE_TTL) return snapshotCache;
    try {
      return saveSnapshot(await request("/account/snapshot"));
    } catch (error) {
      var cached = cachedOfflineSnapshot();
      if (cached) {
        snapshotCache = cached;
        subscribers.forEach(function notify(callback) { try { callback(cached); } catch (_error) {} });
        return cached;
      }
      throw error;
    }
  }

  function broadcastRefresh(reason) {
    if (channel) channel.postMessage({ type: "refresh", reason: reason || "account-change", at: Date.now() });
  }

  async function mutation(path, body) {
    var payload = await request(path, { method: "POST", body: JSON.stringify(body || {}) });
    var snapshot = payload && payload.snapshot ? payload.snapshot : payload;
    if (snapshot && typeof snapshot.authenticated === "boolean") saveSnapshot(snapshot);
    else await getSnapshot({ force: true });
    broadcastRefresh(path);
    return payload;
  }

  if (channel) {
    channel.addEventListener("message", function onMessage(event) {
      if (!event.data || event.data.type !== "refresh") return;
      snapshotTime = 0;
      getSnapshot({ force: true }).catch(function ignoreOffline() {});
    });
  }
  global.addEventListener("storage", function onStorage(event) {
    if (event.key === CACHE_KEY) {
      snapshotTime = 0;
      getSnapshot({ force: true }).catch(function ignoreOffline() {});
    }
  });

  global.LottoMindAccountService = Object.freeze({
    getApiBase: defaultApiBase,
    getSnapshot: getSnapshot,
    getSession: async function getSession() {
      var snapshot = await getSnapshot();
      return { authenticated: snapshot.authenticated, user: snapshot.user, verified: snapshot.verified, offline: snapshot.offline };
    },
    getWallet: async function getWallet() { return (await getSnapshot()).wallet; },
    getMemberships: async function getMemberships() { return (await getSnapshot()).memberships || []; },
    getCollectorStatus: async function getCollectorStatus() { return (await getSnapshot()).collector; },
    register: function register(input) { return mutation("/auth/register", input); },
    signIn: function signIn(input) { return mutation("/auth/login", input); },
    signOut: async function signOut() {
      await request("/auth/logout", { method: "POST", body: "{}" });
      try { localStorage.removeItem(CACHE_KEY); } catch (_error) {}
      snapshotCache = null;
      snapshotTime = 0;
      broadcastRefresh("logout");
      return getSnapshot({ force: true });
    },
    redeemCollectible: function redeemCollectible(code) { return mutation("/redemption/claim", { code: String(code || "").trim() }); },
    spendCredits: async function spendCredits(action, idempotencyKey, context) {
      var result = await request("/credits/spend", { method: "POST", body: JSON.stringify({ action: action, idempotencyKey: idempotencyKey, context: context || {} }) });
      await getSnapshot({ force: true });
      broadcastRefresh("credit-spend");
      return result;
    },
    refundCredits: async function refundCredits(transactionId, idempotencyKey, refundToken) {
      var result = await request("/credits/refund", { method: "POST", body: JSON.stringify({ transactionId: transactionId, idempotencyKey: idempotencyKey, refundToken: refundToken }) });
      await getSnapshot({ force: true });
      broadcastRefresh("credit-refund");
      return result;
    },
    getBeat2LottoEntitlements: function getBeat2LottoEntitlements() { return request("/entitlements/beat2lotto"); },
    analytics: function analytics(event, metadata) {
      return request("/analytics", { method: "POST", body: JSON.stringify({ event: event, metadata: metadata || {} }) }).catch(function ignoreAnalytics() {});
    },
    subscribeToWallet: function subscribeToWallet(callback) {
      subscribers.add(callback);
      if (snapshotCache) callback(snapshotCache);
      return function unsubscribe() { subscribers.delete(callback); };
    },
    createIdempotencyKey: function createIdempotencyKey(prefix) {
      var random = global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      return String(prefix || "action").replace(/[^a-zA-Z0-9:_-]/g, "-").slice(0, 40) + ":" + random;
    },
    refresh: function refresh() { snapshotTime = 0; return getSnapshot({ force: true }); },
  });
})(window);
