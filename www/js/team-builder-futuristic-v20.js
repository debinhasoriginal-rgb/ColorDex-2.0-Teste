
(() => {
  "use strict";

  const STORAGE_KEY = "colordex_teams_v07";

  function readTeams() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function init() {
    document.body.classList.add("cd-team-v20");

    const list = document.getElementById("teamsList");
    if (!list) return;

    const overlay = make("div", "cd-v20-overlay");
    overlay.hidden = true;

    const dialog = make("section", "cd-v20-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "cd-v20-title");

    const head = make("div", "cd-v20-dialog-head");
    const heading = make("h2", "", "EDITAR POKÉMON");
    heading.id = "cd-v20-title";

    const closeButton = make("button", "cd-v20-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Fechar editor");

    head.append(heading, closeButton);

    const pokemonInfo = make("div", "cd-v20-pokemon");
    const actions = make("div", "cd-v20-actions");

    dialog.append(head, pokemonInfo, actions);
    overlay.append(dialog);
    document.body.append(overlay);

    let previousFocus = null;

    function close() {
      overlay.hidden = true;
      document.body.style.overflow = "";
      if (previousFocus?.isConnected) previousFocus.focus();
    }

    function action(label, callback, className = "") {
      const button = make("button", className, label);
      button.type = "button";
      button.addEventListener("click", callback);
      actions.append(button);
      return button;
    }

    function open(teamId, index, slot) {
      const team = readTeams().find(item => item.id === teamId);
      const pokemon = team?.pokemon?.[index];

      if (!pokemon) return;

      previousFocus = document.activeElement;
      pokemonInfo.replaceChildren();
      actions.replaceChildren();

      const img = slot.querySelector(".slot-sprite");
      if (img) {
        const preview = img.cloneNode(true);
        preview.removeAttribute("class");
        pokemonInfo.append(preview);
      }

      const info = make("div");
      info.append(
        make("strong", "", pokemon.name || `#${pokemon.id}`),
        make(
          "small",
          "",
          `#${String(pokemon.id).padStart(4, "0")} · ${
            pokemon.form === "normal"
              ? "Forma Normal"
              : String(pokemon.form || "normal").replaceAll("-", " ")
          }${pokemon.shiny ? " · ✨ Shiny" : ""}`
        )
      );
      pokemonInfo.append(info);

      action("🎯 Moveset", () => {
        close();
        window.ColorDexTeamMoves?.openEditor(teamId, index);
      });

      const mega = slot.querySelector(".slot-mega-button");
      const megaAction = action("💎 Mega Evolução", () => {
        close();
        mega?.click();
      });
      megaAction.disabled = !mega || mega.hidden;

      action("✨ Dynamax / Gigantamax", () => {
        close();
        slot.querySelector(".mechanic-dynamax")?.click();
      });

      action("⚡ Z-Moves", () => {
        close();
        slot.querySelector(".mechanic-z")?.click();
      });

      action("🔄 Trocar Pokémon", () => {
        close();
        window.ColorDexTeamPicker?.openPicker(teamId, index);
      });

      action("🗑 Remover Pokémon", () => {
        if (!confirm("Remover este Pokémon da equipe?")) return;
        close();
        slot.querySelector(".slot-remove")?.click();
      }, "cd-v20-danger");

      overlay.hidden = false;
      document.body.style.overflow = "hidden";
      closeButton.focus();
    }

    closeButton.addEventListener("click", close);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.hidden) {
        event.preventDefault();
        close();
      }
    });

    function decorate() {
      for (const card of list.querySelectorAll(".team-card")) {
        if (card.dataset.cdV20 === "ready") continue;
        card.dataset.cdV20 = "ready";

        const slots = [...card.querySelectorAll(".team-slot")];
        const cards = [...list.querySelectorAll(".team-card")];
        const cardIndex = cards.indexOf(card);
        const team = readTeams()[cardIndex];

        if (!team) continue;

        slots.forEach((slot, index) => {
          slot.append(
            make(
              "span",
              "cd-v20-slot-number",
              `SLOT ${String(index + 1).padStart(2, "0")}`
            )
          );

          if (!slot.classList.contains("filled")) return;

          slot.append(make("span", "cd-v20-slot-edit", "✎"));

          slot.setAttribute("role", "button");
          slot.setAttribute("tabindex", "0");
          slot.setAttribute(
            "aria-label",
            `Editar Pokémon do slot ${index + 1}`
          );

          // Captura apenas o clique no cartão, não nos
          // botões internos já conectados ao jogo.
          slot.addEventListener("click", event => {
            if (event.target.closest("button")) return;

            event.stopImmediatePropagation();
            open(team.id, index, slot);
          }, true);

          slot.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            if (event.target !== slot) return;

            event.preventDefault();
            open(team.id, index, slot);
          });
        });
      }
    }

    let scheduled = false;

    function schedule() {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        decorate();
      });
    }

    const observer = new MutationObserver(schedule);
    observer.observe(list, { childList: true });

    decorate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
