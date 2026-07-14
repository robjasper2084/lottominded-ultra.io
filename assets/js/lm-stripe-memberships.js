(() => {
  const status = document.querySelector("[data-stripe-membership-status]");
  const checkoutButtons = [...document.querySelectorAll("[data-stripe-lookup-key]")];
  const portalButton = document.querySelector("[data-stripe-portal]");
  let configuration = null;

  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  const request = async (path, options = {}) => {
    const response = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || "The billing request failed."), { status: response.status, payload });
    return payload;
  };

  const signedIn = async () => {
    if (window.LottoMindAccount?.getSnapshot) {
      const snapshot = await window.LottoMindAccount.getSnapshot();
      return Boolean(snapshot?.authenticated);
    }
    const response = await fetch("/api/account/session", { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    return Boolean(payload.authenticated);
  };

  const requireAccount = async () => {
    if (await signedIn()) return true;
    setStatus("Sign in through Collector Access before starting Stripe test checkout.", "auth-required");
    const collector = document.querySelector(".membership-collector-section");
    collector?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => collector?.querySelector("[data-collector-trigger]")?.click(), 450);
    return false;
  };

  const beginCheckout = async (button) => {
    if (!configuration?.enabled) {
      setStatus(configuration?.message || "Stripe test mode is not configured on the server.", "disabled");
      return;
    }
    if (!(await requireAccount())) return;
    const lookupKey = button.dataset.stripeLookupKey || "";
    const configured = configuration.plans?.find((plan) => plan.lookupKey === lookupKey)?.available;
    if (!configured) {
      setStatus(`The ${lookupKey} test Price ID still needs to be added to news-hub/.env.local.`, "disabled");
      return;
    }
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Opening Stripe...";
    setStatus("Creating a secure Stripe test checkout...", "updating");
    try {
      const payload = await request("/api/billing/checkout", { method: "POST", body: JSON.stringify({ lookupKey }) });
      window.location.assign(payload.url);
    } catch (error) {
      setStatus(error.message, "error");
      button.disabled = false;
      button.textContent = original;
    }
  };

  checkoutButtons.forEach((button) => button.addEventListener("click", () => beginCheckout(button)));

  portalButton?.addEventListener("click", async () => {
    if (!(await requireAccount())) return;
    portalButton.disabled = true;
    setStatus("Opening Stripe test billing...", "updating");
    try {
      const payload = await request("/api/billing/portal", { method: "POST", body: "{}" });
      window.location.assign(payload.url);
    } catch (error) {
      setStatus(error.message, "error");
      portalButton.disabled = false;
    }
  });

  const checkoutState = new URLSearchParams(window.location.search).get("checkout");
  if (checkoutState === "success") setStatus("Stripe test checkout completed. Your account will update after the signed webhook is received.", "success");
  if (checkoutState === "cancelled") setStatus("Stripe test checkout was cancelled. No charge was made.", "cancelled");

  request("/api/billing/config", { method: "GET", headers: {} })
    .then((payload) => {
      configuration = payload;
      if (!checkoutState) setStatus(payload.message, payload.enabled ? "ready" : "disabled");
    })
    .catch(() => setStatus("The billing service is unavailable. Membership details remain visible.", "error"));
})();
