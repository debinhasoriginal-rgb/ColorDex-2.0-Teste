
(() => {
  "use strict";

  const FORMS_URL = "../data/pokemon-forms-v06.json";

  let formsPromise = null;

  function loadForms() {
    if (!formsPromise) {
      formsPromise = fetch(FORMS_URL).then(response => {
        if (!response.ok) {
          throw new Error("Não foi possível carregar as formas.");
        }
        return response.json();
      }).catch(error => {
        formsPromise = null;
        throw error;
      });
    }

    return formsPromise;
  }

  function getSaveKey(id, form = "normal", shiny = false) {
    if (window.ColorDexIdentity) {
      return ColorDexIdentity.getSaveKey(id, form, shiny);
    }

    if (form === "normal" && !shiny) {
      return `colordex_paint_${String(id).padStart(3, "0")}`;
    }

    return `colordex_paint_v06_${id}:${form}:${shiny ? "shiny" : "normal"}`;
  }


  function isPaintingComplete(id, form = "normal", shiny = false) {
    try {
      const key = getSaveKey(id, form, shiny);
      const saved = JSON.parse(localStorage.getItem(key) || "null");

      if (!saved || Number(saved.progress) < 100) {
        return false;
      }

      if (form === "normal" && !shiny) {
        const completed = JSON.parse(
          localStorage.getItem("colordex_completed") || "[]"
        );

        return Array.isArray(completed) &&
          completed.map(Number).includes(Number(id));
      }

      const completed = JSON.parse(
        localStorage.getItem("colordex_completed_v06") || "[]"
      );

      const identity = window.ColorDexIdentity.getCompletedKey(
        id,
        form,
        shiny
      );

      return Array.isArray(completed) &&
        completed.includes(identity);

    } catch (error) {
      console.warn("Erro ao verificar pintura:", error);
      return false;
    }
  }


  function isMegaForm(formId) {
    return /(^mega-|[-]mega(?:-|$))/.test(formId);
  }

  async function getMegaOptions(pokemonId) {
    const forms = await loadForms();
    const entries = forms[String(pokemonId)] || [];

    return entries
      .filter(form => isMegaForm(form.id))
      .map(form => ({
        id: form.id,
        name: form.nome || form.id,
        sprite: form.sprite,
        unlocked:
          isPaintingComplete(pokemonId, "normal", false) &&
          isPaintingComplete(pokemonId, form.id, false)
      }));
  }

  async function canUseMega(pokemonId, megaFormId) {
    const options = await getMegaOptions(pokemonId);

    return options.some(
      option =>
        option.id === megaFormId &&
        option.unlocked
    );
  }


  function openSelector(teamId, slotIndex) {
    const teams = JSON.parse(
      localStorage.getItem("colordex_teams_v07") || "[]"
    );

    const team = teams.find(item => item.id === teamId);
    const pokemon = team?.pokemon?.[slotIndex];

    if (!pokemon) return;
    if (pokemon.form !== "normal") {
      alert(
        "A Mega Evolução só pode ser configurada na forma normal do Pokémon."
      );
      return;
    }
    getMegaOptions(pokemon.id)
      .then(options => {
        if (!options.length) {
          alert("Este Pokémon não possui Mega Evolução cadastrada.");
          return;
        }

        document.getElementById("megaSelectorOverlay")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "megaSelectorOverlay";
        overlay.className = "mega-overlay";

        const modal = document.createElement("div");
        modal.className = "mega-modal";

        const title = document.createElement("h2");
        title.textContent = "⚡ Mega Evolução";

        const description = document.createElement("p");
        description.textContent =
          "Conclua as pinturas do Pokémon normal e da Mega para desbloquear a transformação.";

        const list = document.createElement("div");
        list.className = "mega-options";

        function close() {
          overlay.remove();
        }

        function saveMega(megaForm) {
          // Recarregar para preservar alterações recentes
          // feitas em outras partes da Team Builder.
          const currentTeams = JSON.parse(
            localStorage.getItem("colordex_teams_v07") || "[]"
          );

          const currentTeam = currentTeams.find(
            item => item.id === teamId
          );

          const currentPokemon =
            currentTeam?.pokemon?.[slotIndex];

          if (
            !currentPokemon ||
            Number(currentPokemon.id) !== Number(pokemon.id) ||
            currentPokemon.form !== pokemon.form ||
            Boolean(currentPokemon.shiny) !== Boolean(pokemon.shiny)
          ) {
            alert("O Pokémon deste slot mudou. Abra o seletor novamente.");
            close();
            return;
          }

          if (megaForm) {
            if (currentPokemon.form !== "normal") {
              alert("Esta forma não pode receber uma Mega Evolução.");
              return;
            }

            if (currentPokemon.zCrystal || currentPokemon.dynamaxMode) {
              alert("Remova o cristal Z ou Dynamax antes de configurar uma Mega.");
              return;
            }
            currentPokemon.megaForm = megaForm;
          } else {
            delete currentPokemon.megaForm;
          }

          localStorage.setItem(
            "colordex_teams_v07",
            JSON.stringify(currentTeams)
          );

          window.dispatchEvent(
            new Event("colordex-teams-updated")
          );

          close();
        }

        const clearButton = document.createElement("button");
        clearButton.type = "button";
        clearButton.className = "mega-clear";
        clearButton.textContent = "Sem Mega Evolução";
        clearButton.addEventListener("click", () => saveMega(null));

        list.appendChild(clearButton);

        for (const option of options) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "mega-option";
          button.disabled = !option.unlocked;

          const img = document.createElement("img");
          img.src = option.sprite;
          img.alt = option.name;

          const label = document.createElement("span");
          label.textContent = option.name;

          const status = document.createElement("span");
          status.textContent = option.unlocked
            ? "Disponível"
            : "🔒 Pintura pendente";

          button.append(img, label, status);

          button.addEventListener("click", async () => {
            if (!await canUseMega(pokemon.id, option.id)) {
              alert("Essa Mega Evolução ainda não está desbloqueada.");
              return;
            }

            saveMega(option.id);
          });

          list.appendChild(button);
        }

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "mega-close";
        closeButton.textContent = "Fechar";
        closeButton.addEventListener("click", close);

        overlay.addEventListener("click", event => {
          if (event.target === overlay) close();
        });

        modal.append(title, description, list, closeButton);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      })
      .catch(error => {
        console.error("Erro no seletor Mega:", error);
        alert("Não foi possível carregar as Mega Evoluções.");
      });
  }

  window.ColorDexMega = {
    getMegaOptions,
    canUseMega,
    isPaintingComplete,
    openSelector
  };
})();
