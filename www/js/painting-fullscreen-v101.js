
(() => {
  "use strict";

  function init() {
    if (document.getElementById("cd-fullscreen-button")) return;

    const button = document.createElement("button");
    button.id = "cd-fullscreen-button";
    button.type = "button";
    button.textContent = "⛶ Tela cheia";
    button.title = "Alternar tela cheia";
    button.setAttribute("aria-label", "Ativar tela cheia");

    document.body.append(button);

    function update() {
      const active = Boolean(document.fullscreenElement);
      button.textContent = active ? "⛶ Sair" : "⛶ Tela cheia";
      button.setAttribute(
        "aria-label",
        active ? "Sair da tela cheia" : "Ativar tela cheia"
      );
      document.body.classList.toggle("cd-fullscreen-active", active);
    }

    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          throw new Error("Fullscreen API indisponível");
        }
      } catch (error) {
        // Alternativa visual para navegadores que não
        // permitem o modo de tela cheia.
        document.body.classList.toggle("cd-fullscreen-fallback");
        const active = document.body.classList.contains(
          "cd-fullscreen-fallback"
        );
        button.textContent = active ? "⛶ Sair" : "⛶ Tela cheia";
      }
    });

    document.addEventListener("fullscreenchange", update);
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
