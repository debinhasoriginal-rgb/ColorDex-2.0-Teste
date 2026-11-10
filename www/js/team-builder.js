
/*
 * ColorDex 0.7 - Team Builder
 * Etapa 0.7.1: gerenciamento de times
 */

(() => {
  const STORAGE_KEY = "colordex_teams_v07";

  const createButton =
    document.getElementById("createTeamButton");

  const teamsList =
    document.getElementById("teamsList");

  const emptyTeams =
    document.getElementById("emptyTeams");

  const teamCount =
    document.getElementById("teamCount");

  let teams = [];

  function loadTeams() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Erro ao carregar times:", error);
      return [];
    }
  }

  function saveTeams() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(teams)
      );
    } catch (error) {
      console.error("Erro ao salvar times:", error);
      alert("Não foi possível salvar os times.");
    }
  }

  function createTeam() {
    const team = {
      id: crypto.randomUUID(),
      name: `Meu Time ${teams.length + 1}`,
      pokemon: [null, null, null, null, null, null],
      createdAt: new Date().toISOString()
    };

    teams.push(team);
    saveTeams();
    renderTeams();
  }

  function renameTeam(id) {
    const team = teams.find(item => item.id === id);
    if (!team) return;

    const name = prompt("Novo nome do time:", team.name);

    if (name === null) return;

    const trimmed = name.trim();

    if (!trimmed) {
      alert("O nome do time não pode ficar vazio.");
      return;
    }

    team.name = trimmed;
    saveTeams();
    renderTeams();
  }

  function deleteTeam(id) {
    const team = teams.find(item => item.id === id);
    if (!team) return;

    const confirmed = confirm(
      `Deseja excluir o time "${team.name}"?`
    );

    if (!confirmed) return;

    teams = teams.filter(item => item.id !== id);
    saveTeams();
    renderTeams();
  }

  function createButtonElement(text, className, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", callback);
    return button;
  }

  function getTeamPokemonSprite(pokemon) {
    if (pokemon.form === "normal") {
      if (pokemon.shiny) {
        return `../assets/pokemon/v06-auditoria/shiny/normais/${String(pokemon.id).padStart(4, "0")}.png`;
      }

      return `../assets/pokemon/normal/${String(pokemon.id).padStart(3, "0")}.png`;
    }

    const folder = pokemon.shiny
      ? "shiny/formas"
      : "formas";

    return `../assets/pokemon/v06-auditoria/${folder}/${pokemon.id}--${pokemon.form}.png`;
  }

  function renderTeams() {
    teamsList.replaceChildren();

    teamCount.textContent =
      `${teams.length} ${teams.length === 1 ? "time criado" : "times criados"}`;

    emptyTeams.hidden = teams.length > 0;

    for (const team of teams) {
      const card = document.createElement("article");
      card.className = "team-card";

      const header = document.createElement("div");
      header.className = "team-card-header";

      const title = document.createElement("h3");
      title.className = "team-name";
      title.textContent = team.name;

      const actions = document.createElement("div");
      actions.className = "team-actions";

      actions.append(
        createButtonElement(
          "Renomear",
          "secondary-button",
          () => renameTeam(team.id)
        ),
        createButtonElement(
          "Excluir",
          "danger-button",
          () => deleteTeam(team.id)
        )
      );

      header.append(title, actions);

      const slots = document.createElement("div");
      slots.className = "team-slots";


      for (let i = 0; i < 6; i++) {
        const pokemon = team.pokemon?.[i] || null;

        const slot = document.createElement("div");
        slot.className = "team-slot";

        if (pokemon) {
          slot.classList.add("filled");

          const img = document.createElement("img");
          img.className = "slot-sprite";
          img.src = getTeamPokemonSprite(pokemon);
          img.alt = `Pokémon #${pokemon.id}`;


          const name = document.createElement("span");
          name.className = "slot-name";
          name.textContent =
            pokemon.name || `#${String(pokemon.id).padStart(3, "0")}`;



          const form = document.createElement("span");
          form.className = "slot-form";

          const formName = pokemon.form === "normal"
            ? "Forma Normal"
            : String(pokemon.form)
                .replaceAll("-", " ")
                .replaceAll("_", " ")
                .replace(/\b\w/g, letra => letra.toUpperCase());

          form.textContent =
            `${formName}${pokemon.shiny ? " ✨ Shiny" : ""}`;

          const remove = createButtonElement(
            "Remover",
            "slot-remove",
            () => {
              team.pokemon[i] = null;
              saveTeams();
              renderTeams();
            }
          );

          const controls = document.createElement("div");
          controls.className = "slot-mechanics";

          const topControls = document.createElement("div");
          topControls.className = "slot-mechanics-top";

          const megaButton = createButtonElement(
            "Mega Evolução", "slot-mega-button mechanic-round mechanic-mega",
            event => {
              event.stopPropagation();
              if (!window.ColorDexMega?.openSelector) {
                alert("O seletor de Mega Evolução não está disponível.");
                return;
              }
              window.ColorDexMega.openSelector(team.id, i);
            }
          );
          megaButton.title = "Mega Evolução";
          megaButton.setAttribute("aria-label", "Mega Evolução");
          megaButton.hidden = true;
          if (pokemon.form === "normal" && window.ColorDexMega?.getMegaOptions) {
            window.ColorDexMega.getMegaOptions(pokemon.id)
              .then(options => {
                if (!slot.isConnected) return;
                if (options.length > 0) {
                  megaButton.hidden = false;
                  const selected = options.find(option => option.id === pokemon.megaForm);
                  if (selected) {
                    megaButton.classList.add("mechanic-active");
                    megaButton.title = `Mega: ${selected.name}`;
                    megaButton.setAttribute("aria-label", `Mega: ${selected.name}`);
                  }
                }
              })
              .catch(error => console.warn("Erro ao consultar Megas:", error));
          }

          const dynamaxButton = createButtonElement(
            "Dynamax / Gigantamax", "slot-battle-button mechanic-round mechanic-dynamax",
            event => {
              event.stopPropagation();
              window.ColorDexBattle?.openSelector(team.id, i, "dynamax");
            }
          );
          const dmaxText = pokemon.dynamaxMode === "gmax" ? "Gigantamax ativo" :
            pokemon.dynamaxMode === "dynamax" ? "Dynamax ativo" : "Dynamax / Gigantamax";
          dynamaxButton.title = dmaxText;
          dynamaxButton.setAttribute("aria-label", dmaxText);
          if (pokemon.dynamaxMode) dynamaxButton.classList.add("mechanic-active");

          const crystalNames = {
            normal: "Normalium", fire: "Firium", water: "Waterium",
            electric: "Electrium", grass: "Grassium", ice: "Icium",
            fighting: "Fightinium", poison: "Poisonium", ground: "Groundium",
            flying: "Flyinium", psychic: "Psychium", bug: "Buginium",
            rock: "Rockium", ghost: "Ghostium", dragon: "Dragonium",
            dark: "Darkinium", steel: "Steelium", fairy: "Fairium"
          };
          const crystalType = String(pokemon.zCrystal || "").replace(/-z$/, "");
          const crystalLabel = pokemon.zCrystal
            ? (crystalNames[crystalType] ? `${crystalNames[crystalType]} Z` : String(pokemon.zCrystal))
            : null;
          const zButton = createButtonElement(
            crystalLabel || "Z-Moves", "slot-battle-button mechanic-z",
            event => {
              event.stopPropagation();
              window.ColorDexBattle?.openSelector(team.id, i, "z");
            }
          );
          if (crystalLabel) zButton.classList.add("mechanic-active");
          zButton.title = crystalLabel ? `Cristal equipado: ${crystalLabel}` : "Escolher cristal Z";

          const megaControl = document.createElement("div");
          megaControl.className = "mechanic-control";
          const megaCaption = document.createElement("span");
          megaCaption.className = "mechanic-caption";
          megaCaption.textContent = pokemon.megaForm ? "MEGA ATIVA" : "MEGA";
          megaControl.append(megaButton, megaCaption);

          const dynamaxControl = document.createElement("div");
          dynamaxControl.className = "mechanic-control";
          const dynamaxCaption = document.createElement("span");
          dynamaxCaption.className = "mechanic-caption";
          dynamaxCaption.textContent = pokemon.dynamaxMode === "gmax" ? "GIGANTAMAX" :
            pokemon.dynamaxMode ? "DYNAMAX ATIVO" : "DYNAMAX";
          dynamaxControl.append(dynamaxButton, dynamaxCaption);

          topControls.append(megaControl, dynamaxControl);
          controls.append(topControls, zButton);
          slot.append(img, name, form, controls, remove);

          slot.addEventListener("click", event => {
            if (
              event.target === remove ||
              megaButton.contains(event.target) ||
              zButton.contains(event.target) ||
              dynamaxButton.contains(event.target)
            ) {
              return;
            }

            window.ColorDexTeamMoves.openEditor(team.id, i);
          });
        } else {
          const plus = document.createElement("span");
          plus.className = "slot-plus";
          plus.textContent = "+";

          const label = document.createElement("span");
          label.textContent = `Pokémon ${i + 1}`;

          slot.append(plus, label);

          slot.addEventListener("click", () => {
            window.ColorDexTeamPicker.openPicker(team.id, i);
          });
        }

        slots.appendChild(slot);
      }


      card.append(header, slots);
      teamsList.appendChild(card);
    }
  }

  teams = loadTeams();

  createButton.addEventListener("click", createTeam);

  // Inicializa depois que os módulos da página estiverem carregados.
  if (document.readyState === "complete") {
    renderTeams();
  } else {
    window.addEventListener("load", renderTeams, { once: true });
  }
  window.addEventListener("colordex-teams-updated", () => {
    teams = loadTeams();
    renderTeams();
  });
})();
