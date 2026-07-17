(async () => {
  try {
    window.THREE = await import("../vendor/three/three.module.min.js?v=0.160.1");
  } catch (error) {
    document.body?.classList.add("lm-no-webgl");
  }
  await import("./memberships-cinematic.js?v=membership-observatory-1");
})();
