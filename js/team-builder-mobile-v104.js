
(() => {
  "use strict";

  document.body.classList.add("cd-team-mobile");

  let openCard = null;

  function make(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setupCard(card) {
    if (card.dataset.cdMobile104 === "ready") return;

    const slots = card.querySelector(".team-slots");
    const name = card.querySelector(".team-name");

    if (!slots || !name) return;

    card.dataset.cdMobile104 = "ready";

    const summary = make("button", "cd-mobile-summary");
    summary.type = "button";

    const heading = make("div", "cd-mobile-summary-head");
    const title = make(
      "span",
      "cd-mobile-summary-name",
      name.textContent || "Meu time"
    );
    const arrow = make(
      "span",
      "cd-mobile-summary-arrow",
      "›"
    );

    heading.append(title, arrow);

    const preview = make("div", "cd-mobile-preview");
    let occupied = 0;

    const originalSlots = Array.from(
      slots.querySelectorAll(".team-slot")
    ).slice(0, 6);

    for (let i = 0; i < 6; i++) {
      const original = originalSlots[i];
      const sprite = original?.querySelector("img.slot-sprite");

      const item = make(
        "span",
        "cd-mobile-preview-slot" + (sprite ? "" : " empty")
      );

      if (sprite) {
        const img = document.createElement("img");
        img.src = sprite.src;
        img.alt = sprite.alt || "Pokémon";
        img.loading = "lazy";
        item.append(img);
        occupied++;
      } else {
        item.textContent = "+";
      }

      preview.append(item);
    }

    const footer = make(
      "div",
      "cd-mobile-summary-footer",
      `${occupied}/6 Pokémon · Toque para abrir`
    );

    summary.append(heading, preview, footer);

    const back = make(
      "button",
      "cd-mobile-back",
      "← Voltar aos times"
    );
    back.type = "button";
    back.style.display = "none";

    summary.addEventListener("click", () => {
      if (openCard && openCard !== card) {
        openCard.classList.remove("cd-mobile-open");
      }

      openCard = card;
      card.classList.add("cd-mobile-open");
      card.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    back.addEventListener("click", () => {
      card.classList.remove("cd-mobile-open");
      openCard = null;
      card.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    card.prepend(back);
    card.prepend(summary);
  }

  function refresh() {
    document.querySelectorAll(".team-card").forEach(setupCard);
  }

  function init() {
    refresh();

    // A Team Builder recria os cartões ao salvar alterações.
    // Processamos apenas cartões novos, sem alterar seus dados.
    const observer = new MutationObserver(() => {
      const pending = document.querySelector(
        ".team-card:not([data-cd-mobile104])"
      );
      if (pending) refresh();
    });

    const teamsList = document.getElementById("teamsList");

    if (teamsList) {
      observer.observe(teamsList, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
