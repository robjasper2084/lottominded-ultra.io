(function initBeat2LottoCollectorAccess() {
  "use strict";

  var root = document.querySelector("[data-collector-access]");
  var account = window.LottoMindAccountService;
  if (!root || !account) return;

  var trigger = root.querySelector("[data-collector-trigger]");
  var triggerBalance = root.querySelector("[data-collector-trigger-balance]");
  var panel = root.querySelector("[data-collector-panel]");
  var closeButton = root.querySelector("[data-collector-close]");
  var statusNode = root.querySelector("[data-collector-status]");
  var walletNode = root.querySelector("[data-collector-wallet]");
  var gameResultsNode = root.querySelector("[data-game-results]");
  var gameResultsList = root.querySelector("[data-game-results-list]");
  var membershipNode = root.querySelector("[data-collector-membership]");
  var authForm = root.querySelector("[data-collector-auth-form]");
  var redeemForm = root.querySelector("[data-collector-redeem-form]");
  var logoutButton = root.querySelector("[data-collector-logout]");
  var messageNode = root.querySelector("[data-collector-message]");
  var frame = document.querySelector("[data-beat2-game-frame]");
  var panelHome = panel.parentNode;
  var mobilePanelMedia = window.matchMedia("(max-width: 900px)");
  var snapshot = null;
  var entitlementConfig = null;
  var pendingTransactions = new Map();
  var collectorPackReported = false;
  var analyticsSurface = document.body.classList.contains("memberships-page") ? "memberships" : document.body.classList.contains("home-page") ? "home" : "beat2lotto";

  function formatDate(value) {
    if (!value) return "No expiration";
    try { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
    catch (_error) { return value; }
  }

  function setMessage(message, isError) {
    messageNode.textContent = message || "";
    messageNode.style.color = isError ? "#ffb0b0" : "#8eeeff";
  }

  function activePaidMembership(data) {
    return (data.memberships || []).find(function findPaid(item) {
      return item.active && ["gold", "ultra", "vault"].includes(item.kind);
    });
  }

  function stateFor(data) {
    if (!data || data.offline || !data.verified) return "offline";
    if (!data.authenticated) return "signed-out";
    var paid = activePaidMembership(data);
    var collectorActive = data.collector && data.collector.status === "active";
    if (paid && collectorActive) return "paid-collector";
    if (paid) return "paid";
    if (collectorActive) return "collector";
    if (data.collector && data.collector.expiresAt) return "expired";
    return "free";
  }

  function postAccountState() {
    if (!frame || !frame.contentWindow || !snapshot) return;
    frame.contentWindow.postMessage({
      type: "lottomind:account-state",
      snapshot: {
        authenticated: Boolean(snapshot.authenticated),
        verified: Boolean(snapshot.verified),
        offline: Boolean(snapshot.offline),
        credits: snapshot.wallet ? snapshot.wallet.balance : 0,
        collector: snapshot.collector || null,
        memberships: snapshot.memberships || [],
        entitlements: snapshot.entitlements || {},
        features: entitlementConfig ? entitlementConfig.features : {},
        creditActions: entitlementConfig ? entitlementConfig.creditActions : {},
      },
    }, location.origin);
  }

  function render(data) {
    snapshot = data;
    if (!data || data.featureEnabled === false) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    var state = stateFor(data);
    var balance = data.wallet && Number.isFinite(data.wallet.balance) ? data.wallet.balance : 0;
    trigger.dataset.state = state;
    var triggerLabel = state === "collector" ? "Collector Active" : state === "paid-collector" ? "Member + Collector" : state === "paid" ? "Member Access" : state === "offline" ? "Wallet Offline" : "Collector Access";
    trigger.querySelector("span").textContent = triggerLabel;
    triggerBalance.textContent = data.authenticated ? String(balance) : "--";
    trigger.setAttribute("aria-label", triggerLabel + (data.authenticated ? ", " + balance + " Lotto Credits" : "") + ". View benefits");
    walletNode.hidden = !data.authenticated;
    if (gameResultsNode) gameResultsNode.hidden = !data.authenticated;
    authForm.hidden = data.authenticated;
    redeemForm.hidden = !data.authenticated;
    logoutButton.hidden = !data.authenticated;

    if (data.authenticated) {
      walletNode.querySelector("strong").textContent = String(balance);
      if (gameResultsList) {
        gameResultsList.replaceChildren();
        var results = Array.isArray(data.gameResults) ? data.gameResults : [];
        if (!results.length) {
          var empty = document.createElement("li");
          empty.className = "collector-access__result-empty";
          empty.textContent = "No verified game results yet. Sign in before launching a supported game.";
          gameResultsList.appendChild(empty);
        } else {
          results.slice(0, 5).forEach(function renderGameResult(result) {
            var item = document.createElement("li");
            var summary = document.createElement("span");
            var credits = document.createElement("strong");
            summary.textContent = String(result.gameTitle || "LottoMind Game") + " - " + String(result.outcome || "Completed") + " - " + formatDate(result.completedAt);
            credits.textContent = "+" + String(result.creditsAwarded || 0);
            item.append(summary, credits);
            gameResultsList.appendChild(item);
          });
        }
      }
    }
    if (state === "paid-collector") {
      var paidCollector = activePaidMembership(data);
      statusNode.textContent = "Your " + paidCollector.kind.charAt(0).toUpperCase() + paidCollector.kind.slice(1) + " membership and Vault Guardian Series 01 collector access are active.";
      membershipNode.textContent = "Collector Starter ends " + formatDate(data.collector.expiresAt) + " · Paid membership preserved · No collector auto-renewal";
    } else if (state === "collector") {
      statusNode.textContent = "Vault Guardian Series 01 is active. Collector Starter access ends " + formatDate(data.collector.expiresAt) + ".";
      membershipNode.textContent = "Collector Starter · 30-day access · No automatic renewal";
    } else if (state === "paid") {
      var paid = activePaidMembership(data);
      statusNode.textContent = "Your " + paid.kind.charAt(0).toUpperCase() + paid.kind.slice(1) + " membership is active.";
      membershipNode.textContent = "Paid membership preserved · Collector codes add credits and the badge";
    } else if (state === "expired") {
      statusNode.textContent = "Collector Starter access expired on " + formatDate(data.collector.expiresAt) + ". Your account and remaining credits stay available.";
      membershipNode.textContent = "Collector access expired · No automatic renewal";
    } else if (state === "offline") {
      statusNode.textContent = "The account service is offline. The last known wallet is view-only until verification returns.";
      membershipNode.textContent = "Redemption and spending are paused offline";
    } else if (state === "signed-out") {
      statusNode.textContent = "Sign in or create an account to redeem a collectible code and share one wallet with LottoMind Refined.";
      membershipNode.textContent = "One account · One wallet · No URL-based credit grants";
    } else {
      statusNode.textContent = "Free access is active. Redeem a verified physical collectible code to unlock Collector Starter.";
      membershipNode.textContent = "Collector Starter grants 30 days, 150 Lotto Credits, and the Vault Guardian Series 01 badge";
    }
    postAccountState();
    if (!collectorPackReported && data.collector && data.collector.status === "active") {
      collectorPackReported = true;
      account.analytics("collector_pack_used", { surface: analyticsSurface, pack: "vault-guardian-series-01" });
    }
  }

  function togglePanel(open) {
    var shouldOpen = typeof open === "boolean" ? open : panel.hidden;
    panel.hidden = !shouldOpen;
    trigger.setAttribute("aria-expanded", String(shouldOpen));
    if (analyticsSurface === "memberships" || analyticsSurface === "home") document.body.classList.toggle("has-collector-panel", shouldOpen);
    if (shouldOpen) {
      account.analytics("collector_panel_viewed", { surface: analyticsSurface });
      setTimeout(function focusPanel() { closeButton.focus(); }, 0);
    } else {
      trigger.focus();
    }
  }

  function syncPanelPortal() {
    var shouldUseBody = analyticsSurface === "memberships" || analyticsSurface === "home" || mobilePanelMedia.matches;
    if (shouldUseBody && panel.parentNode !== document.body) document.body.appendChild(panel);
    if (!shouldUseBody && panel.parentNode !== panelHome) panelHome.appendChild(panel);
  }

  function showWelcome(result) {
    var toast = document.createElement("div");
    toast.className = "collector-access-welcome";
    toast.setAttribute("role", "status");
    toast.innerHTML = "<strong>Collector Access Activated</strong><br>Vault Guardian Series 01 revealed · " + String(result.creditsAdded || 150) + " Lotto Credits Added<br>Expires " + formatDate(result.membershipExpiresAt) + " · No automatic renewal.<div class=\"collector-access-welcome__actions\"><button type=\"button\" data-welcome-unlock>Unlock Beat2Lotto Plus</button><button type=\"button\" data-welcome-continue>Continue Creating</button></div>";
    document.body.appendChild(toast);
    var continueCreating = function continueCreating() {
      toast.remove();
      togglePanel(false);
      frame && frame.focus();
    };
    toast.querySelector("[data-welcome-unlock]").addEventListener("click", continueCreating);
    toast.querySelector("[data-welcome-continue]").addEventListener("click", continueCreating);
    setTimeout(function removeToast() { toast.remove(); }, 8000);
  }

  trigger.addEventListener("click", function onTrigger() { togglePanel(); });
  closeButton.addEventListener("click", function onClose() { togglePanel(false); });
  mobilePanelMedia.addEventListener?.("change", syncPanelPortal);
  syncPanelPortal();
  document.addEventListener("keydown", function onKeydown(event) {
    if (event.key === "Escape" && !panel.hidden) togglePanel(false);
  });
  document.addEventListener("pointerdown", function outside(event) {
    if (!panel.hidden && !root.contains(event.target) && !panel.contains(event.target)) togglePanel(false);
  });

  authForm.addEventListener("submit", async function onAuth(event) {
    event.preventDefault();
    var submitter = event.submitter;
    var mode = submitter && submitter.value === "register" ? "register" : "login";
    var data = new FormData(authForm);
    setMessage(mode === "register" ? "Creating account..." : "Signing in...");
    try {
      var input = { email: String(data.get("email") || ""), password: String(data.get("password") || "") };
      var result = mode === "register" ? await account.register(input) : await account.signIn(input);
      render(result);
      authForm.reset();
      setMessage("Account verified. Your shared wallet is ready.");
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  redeemForm.addEventListener("submit", async function onRedeem(event) {
    event.preventDefault();
    var code = String(new FormData(redeemForm).get("code") || "").trim();
    if (!code) return setMessage("Enter the code printed on the collectible insert.", true);
    setMessage("Verifying collectible code...");
    account.analytics("collector_redeem_started", { surface: analyticsSurface });
    try {
      var result = await account.redeemCollectible(code);
      redeemForm.reset();
      render(result.snapshot);
      showWelcome(result);
      setMessage("Collector Starter unlocked. No automatic renewal.");
      account.analytics("collector_redeem_success", { surface: analyticsSurface, creditsAdded: result.creditsAdded });
    } catch (error) {
      setMessage(error.message, true);
      account.analytics("collector_redeem_failed", { surface: analyticsSurface, reason: error.code || "unknown" });
    }
  });

  logoutButton.addEventListener("click", async function onLogout() {
    try { render(await account.signOut()); setMessage("Signed out."); }
    catch (error) { setMessage(error.message, true); }
  });

  window.addEventListener("message", async function onGameMessage(event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin || !event.data) return;
    var message = event.data;
    if (message.type === "lottomind:game-ready") return postAccountState();
    if (message.type === "lottomind:credit-action-completed") {
      var completed = pendingTransactions.get(message.requestId);
      if (completed) {
        pendingTransactions.delete(message.requestId);
        account.analytics("credit_action_completed", { surface: "beat2lotto", amount: completed.amount });
      }
      return;
    }
    if (message.type === "lottomind:credit-action-failed") {
      var transaction = pendingTransactions.get(message.requestId);
      if (!transaction || transaction.refunded) return;
      transaction.refunded = true;
      try {
        await account.refundCredits(transaction.transactionId, account.createIdempotencyKey("refund"), transaction.refundToken);
        setMessage("The premium action did not complete, so the credits were restored.");
      } catch (error) {
        setMessage("The action failed and the automatic refund could not be confirmed. Contact support with transaction " + transaction.transactionId + ".", true);
      }
      return;
    }
    if (message.type !== "lottomind:credit-action-request") return;
    var action = String(message.action || "");
    var requestId = String(message.requestId || "");
    var price = entitlementConfig && entitlementConfig.creditActions ? entitlementConfig.creditActions[action] : null;
    if (!requestId || !price) return;
    account.analytics("beat2lotto_member_feature_opened", { surface: "beat2lotto", action: action });
    if (!snapshot || !snapshot.authenticated) {
      togglePanel(true);
      setMessage("Sign in before starting a premium action.", true);
      frame.contentWindow.postMessage({ type: "lottomind:credit-action-denied", requestId: requestId, reason: "AUTH_REQUIRED" }, location.origin);
      return;
    }
    if (!snapshot.verified || snapshot.offline) {
      frame.contentWindow.postMessage({ type: "lottomind:credit-action-denied", requestId: requestId, reason: "ACCOUNT_OFFLINE" }, location.origin);
      return setMessage("Premium actions are paused until the wallet is verified online.", true);
    }
    if (!window.confirm("Use " + price + " Lotto Credits for this premium Beat2Lotto action?")) {
      frame.contentWindow.postMessage({ type: "lottomind:credit-action-denied", requestId: requestId, reason: "CANCELLED" }, location.origin);
      return;
    }
    try {
      var spent = await account.spendCredits(action, account.createIdempotencyKey("beat2lotto"), { surface: "shadow-ops", requestId: requestId.slice(0, 64) });
      pendingTransactions.set(requestId, spent);
      frame.contentWindow.postMessage({ type: "lottomind:credit-action-approved", requestId: requestId, transactionId: spent.transactionId, amount: spent.amount, balance: spent.balance }, location.origin);
      account.analytics("credit_action_confirmed", { surface: "beat2lotto", action: action, amount: spent.amount });
      setMessage(spent.amount + " credits used. New verified balance: " + spent.balance + ".");
    } catch (error) {
      frame.contentWindow.postMessage({ type: "lottomind:credit-action-denied", requestId: requestId, reason: error.code || "FAILED", message: error.message }, location.origin);
      setMessage(error.message, true);
      account.analytics("credit_action_failed", { surface: "beat2lotto", action: action, reason: error.code || "unknown" });
    }
  });

  account.subscribeToWallet(render);
  window.setInterval(function refreshOpenSession() {
    if (!document.hidden) account.refresh().catch(function ignoreTemporaryOffline() {});
  }, 60000);
  var entitlementRequest = frame ? account.getBeat2LottoEntitlements() : Promise.resolve(null);
  Promise.all([account.getSnapshot(), entitlementRequest]).then(function ready(results) {
    entitlementConfig = results[1];
    render(results[0]);
  }).catch(function unavailable(error) {
    setMessage(error.message, true);
    root.hidden = false;
    trigger.dataset.state = "offline";
  });
})();
