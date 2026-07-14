(() => {
  const shell = document.querySelector("[data-goth-game-shell]");
  const frame = shell?.querySelector("[data-goth-game-frame]");
  if (!shell || !frame) return;

  const launch = () => {
    if (!frame.getAttribute("src")) frame.setAttribute("src", frame.dataset.src || "./games/gothtechnology2/");
    shell.classList.add("is-live");
    window.setTimeout(() => frame.focus(), 160);
  };

  document.querySelectorAll("[data-goth-game-launch]").forEach((button) => button.addEventListener("click", launch));
})();
