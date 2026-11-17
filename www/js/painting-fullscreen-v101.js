(() => {
  "use strict";

  function init() {
    const frame = document.getElementById("canvasFrame");
    const paintingPanel = document.querySelector(".painting-panel");

    if (!frame || !paintingPanel) return;

    let button = document.getElementById("cd-fullscreen-button");

    if (!button) {
      button = document.createElement("button");
      button.id = "cd-fullscreen-button";
      button.type = "button";
      document.body.appendChild(button);
    }

    let active = false;
    let previousScrollY = 0;

    function notifyResize() {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }

    function update() {
      document.body.classList.toggle(
        "cd-fullscreen-active",
        active
      );

      document.body.classList.remove(
        "cd-fullscreen-fallback"
      );

      button.textContent = active
        ? "⛶ Sair"
        : "⛶ Tela cheia";

      button.setAttribute(
        "aria-label",
        active
          ? "Sair da tela cheia"
          : "Ativar tela cheia"
      );

      button.setAttribute(
        "aria-pressed",
        String(active)
      );

      notifyResize();
    }

    function enter() {
      if (active) return;

      previousScrollY = window.scrollY;
      active = true;
      update();
    }

    function exit() {
      if (!active) return;

      active = false;
      update();

      requestAnimationFrame(() => {
        window.scrollTo(0, previousScrollY);
      });
    }

    button.addEventListener("click", () => {
      if (active) {
        exit();
      } else {
        enter();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && active) {
        exit();
      }
    });

    window.addEventListener("pagehide", () => {
      if (active) {
        active = false;
        document.body.classList.remove(
          "cd-fullscreen-active"
        );
      }
    });

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
