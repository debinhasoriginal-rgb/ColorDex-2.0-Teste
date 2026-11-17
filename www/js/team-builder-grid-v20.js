
(() => {
  "use strict";

  const MOBILE_WIDTH = 700;

  function applyGrid() {
    const mobile = window.innerWidth <= MOBILE_WIDTH;

    document.querySelectorAll(".team-slots").forEach(grid => {
      if (!mobile) {
        grid.style.removeProperty("display");
        grid.style.removeProperty("grid-template-columns");
        grid.style.removeProperty("grid-auto-rows");
        grid.style.removeProperty("gap");

        grid.querySelectorAll(".team-slot").forEach(slot => {
          slot.style.removeProperty("height");
          slot.style.removeProperty("min-height");
          slot.style.removeProperty("max-height");
        });

        return;
      }

      grid.style.setProperty("display", "grid", "important");
      grid.style.setProperty(
        "grid-template-columns",
        "repeat(3, minmax(0, 1fr))",
        "important"
      );
      grid.style.setProperty("grid-auto-rows", "115px", "important");
      grid.style.setProperty("gap", "7px", "important");

      grid.querySelectorAll(".team-slot").forEach(slot => {
        slot.style.setProperty("height", "115px", "important");
        slot.style.setProperty("min-height", "0", "important");
        slot.style.setProperty("max-height", "115px", "important");
        slot.style.setProperty("min-width", "0", "important");
        slot.style.setProperty("padding", "5px", "important");
        slot.style.setProperty("overflow", "hidden", "important");
      });
    });
  }

  let scheduled = false;

  function scheduleGrid() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyGrid();
    });
  }

  function init() {
    applyGrid();

    const observer = new MutationObserver(scheduleGrid);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("resize", scheduleGrid);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
