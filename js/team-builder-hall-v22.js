
(() => {
  "use strict";

  const KEY = "colordex_teams_v07";

  const readTeams = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  function make(tag, cls = "", text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function init() {
    document.body.classList.add("cd-hall22");
    const list = document.getElementById("teamsList");
    if (!list) return;

    const overlay = make("div", "cd-hall-overlay");
    overlay.hidden = true;

    const dialog = make("section", "cd-hall-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "cd-hall-title");

    const heading = make("div", "cd-hall-heading");
    const title = make("h2", "", "◈ EDITOR DE POKÉMON");
    title.id = "cd-hall-title";

    const closeButton = make("button", "cd-hall-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Fechar editor");
    heading.append(title, closeButton);

    const identity = make("div", "cd-hall-identity");
    const stats = make("div", "cd-hall-stats");
    const section = make("div", "cd-hall-section");
    const sectionCount = make("span", "", "0 / 4");
    section.append(make("h3", "", "MOVIMENTOS"), sectionCount);

    const moveList = make("div", "cd-hall-moves");
    const tools = make("div", "cd-hall-tools");
    const save = make("button", "cd-hall-save", "Salvar alterações");
    save.type = "button";

    const note = make(
      "p", "cd-hall-note",
      "Os seletores do jogo salvam as alterações automaticamente."
    );

    dialog.append(
      heading, identity, stats, section,
      moveList, tools, save, note
    );

    overlay.append(dialog);
    document.body.append(overlay);

    let previousFocus = null;
    let previousOverflow = "";

    function close() {
      overlay.hidden = true;
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    }

    closeButton.addEventListener("click", close);
    save.addEventListener("click", close);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", event => {
      if (overlay.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }

      if (event.key === "Tab") {
        const focusable = [...dialog.querySelectorAll(
          "button:not([disabled])"
        )];

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    let catalogPromise = null;

    async function getTypes(id) {
      if (!catalogPromise) {
        catalogPromise = fetch("../data/pokemon.json")
          .then(response => {
            if (!response.ok) throw Error("Catálogo indisponível");
            return response.json();
          })
          .catch(() => null);
      }

      const catalog = await catalogPromise;
      const entries = Array.isArray(catalog)
        ? catalog
        : Array.isArray(catalog?.pokemon)
          ? catalog.pokemon
          : [];

      const entry = entries.find(p => Number(p.id) === Number(id));
      return Array.isArray(entry?.types) ? entry.types : [];
    }

    function stat(label, value) {
      const box = make("div", "cd-hall-stat");
      box.append(
        make("small", "", label),
        make("strong", "", String(value || "Não configurado"))
      );
      stats.append(box);
    }

    function tool(label, callback, disabled = false) {
      const button = make("button", "", label);
      button.type = "button";
      button.disabled = disabled;

      button.addEventListener("click", () => {
        close();
        callback();
      });

      tools.append(button);
    }

    function getMoveName(move) {
      if (typeof move === "string") return move;
      if (move && typeof move === "object") {
        return String(move.name || move.move || move.id || "Movimento");
      }
      return "Adicionar movimento";
    }

    async function open(teamId, index, slot) {
      const team = readTeams().find(
        t => String(t.id) === String(teamId)
      );
      const pokemon = team?.pokemon?.[index];
      if (!pokemon) return;

      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;

      identity.replaceChildren();
      stats.replaceChildren();
      moveList.replaceChildren();
      tools.replaceChildren();

      const sprite = slot.querySelector(".slot-sprite");
      if (sprite) {
        const img = sprite.cloneNode(true);
        img.removeAttribute("class");
        identity.append(img);
      }

      const info = make("div");
      info.append(
        make("small", "", `#${String(pokemon.id).padStart(4, "0")}`),
        make("strong", "", pokemon.name || `Pokémon #${pokemon.id}`)
      );

      const typesRow = make("div", "cd-hall-types");
      const initialTypes = Array.isArray(pokemon.types)
        ? pokemon.types
        : [];

      function showTypes(types) {
        typesRow.replaceChildren();
        if (!types.length) {
          typesRow.append(
            make("span", "cd-hall-type", "Tipo não disponível")
          );
          return;
        }

        types.forEach(type => {
          typesRow.append(
            make("span", "cd-hall-type", String(type))
          );
        });
      }

      showTypes(initialTypes);
      info.append(typesRow);
      identity.append(info);

      if (!initialTypes.length) {
        getTypes(pokemon.id).then(types => {
          if (!overlay.hidden) showTypes(types);
        });
      }

      stat(
        "◇ Forma",
        String(pokemon.megaForm || pokemon.form || "normal")
          .replaceAll("-", " ")
      );

      stat("♧ Habilidade", pokemon.ability || "Não configurada");
      stat("⬡ Item", pokemon.item || "Não configurado");

      const special = pokemon.megaForm
        ? "Mega Evolução"
        : pokemon.dynamaxMode === "gmax"
          ? "Gigantamax"
          : pokemon.dynamaxMode === "dynamax"
            ? "Dynamax"
            : pokemon.zCrystal
              ? `Cristal Z: ${pokemon.zCrystal}`
              : "Nenhum";

      stat("⚡ Especial", special);

      const moves = Array.isArray(pokemon.moves)
        ? pokemon.moves
        : Array.isArray(pokemon.moveset)
          ? pokemon.moveset
          : [];

      sectionCount.textContent =
        `${moves.filter(Boolean).length} / 4`;

      for (let i = 0; i < 4; i++) {
        const move = moves[i];
        const button = make("button", "cd-hall-move");
        button.type = "button";

        const details = make("span", "cd-hall-move-info");
        details.append(
          make("strong", "", getMoveName(move)),
          make(
            "small", "",
            move && typeof move === "object"
              ? String(move.type || "Toque para editar")
              : "Toque para editar"
          )
        );

        button.append(
          make(
            "span", "cd-hall-move-num",
            String(i + 1).padStart(2, "0")
          ),
          details,
          make("span", "", "✎")
        );

        button.addEventListener("click", () => {
          close();
          window.ColorDexTeamMoves?.openEditor(teamId, index);
        });

        moveList.append(button);
      }

      const mega = slot.querySelector(".slot-mega-button");

      tool(
        "💎 Mega Evolução",
        () => mega?.click(),
        !mega || mega.hidden
      );

      tool(
        "✨ Dynamax / Gigantamax",
        () => slot.querySelector(".mechanic-dynamax")?.click()
      );

      tool(
        "⚡ Z-Moves",
        () => slot.querySelector(".mechanic-z")?.click()
      );

      tool(
        "🔄 Trocar Pokémon",
        () => window.ColorDexTeamPicker?.openPicker(teamId, index)
      );

      tool(
        "🗑 Remover Pokémon",
        () => {
          if (confirm("Remover este Pokémon da equipe?")) {
            slot.querySelector(".slot-remove")?.click();
          }
        }
      );

      overlay.hidden = false;
      document.body.style.overflow = "hidden";
      closeButton.focus();
    }

    function decorate() {
      const saved = readTeams();

      [...list.querySelectorAll(".team-card")].forEach((card, cardIndex) => {
        if (card.dataset.cdHall22 === "ready") return;

        const team = saved[cardIndex];
        if (!team) return;

        card.dataset.cdHall22 = "ready";

        card.querySelector(".cd-mobile-summary")?.remove();
        card.querySelector(".cd-mobile-back")?.remove();

        const slots = [...card.querySelectorAll(".team-slot")];

        slots.forEach((slot, index) => {
          slot.append(
            make(
              "span", "cd-hall-number",
              String(index + 1).padStart(2, "0")
            )
          );

          if (!slot.classList.contains("filled")) return;

          slot.tabIndex = 0;
          slot.setAttribute("role", "button");
          slot.setAttribute(
            "aria-label",
            `Editar Pokémon do slot ${index + 1}`
          );

          slot.addEventListener("click", event => {
            if (event.target.closest("button")) return;
            event.stopImmediatePropagation();
            open(team.id, index, slot);
          }, true);

          slot.addEventListener("keydown", event => {
            if (event.target !== slot) return;
            if (!["Enter", " "].includes(event.key)) return;

            event.preventDefault();
            open(team.id, index, slot);
          });
        });

        const occupied = slots.filter(
          slot => slot.classList.contains("filled")
        ).length;

        const footer = make("div", "cd-hall-footer");
        footer.append(
          make("span", "", `${occupied} de 6 Pokémon`),
          make("strong", "", "◈ HALL DA FAMA")
        );

        card.querySelector(".team-slots")?.after(footer);
      });
    }

    let pending = false;

    function schedule() {
      if (pending) return;
      pending = true;

      requestAnimationFrame(() => {
        pending = false;
        decorate();
      });
    }

    new MutationObserver(schedule).observe(list, {
      childList: true
    });

    decorate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
