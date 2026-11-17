
(() => {
  "use strict";

  const mobile = window.matchMedia("(max-width: 700px)");

  function activateAutomaticGestures() {
    if (!mobile.matches) return;

    const paint = document.getElementById("paintMode");
    const canvas = document.getElementById("paintingCanvas");

    if (!paint || !canvas) return;

    // Mantém o motor original em modo de pintura.
    // O próprio painting.js já trata dois dedos
    // como gesto de navegação e zoom.
    paint.click();

    canvas.style.touchAction = "none";

    const hint = document.getElementById("gestureHint");
    if (hint) {
      hint.textContent =
        "Um dedo pinta. Dois dedos movem e ampliam.";
    }
  }

  function init() {
    activateAutomaticGestures();

    if (mobile.addEventListener) {
      mobile.addEventListener(
        "change",
        activateAutomaticGestures
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
