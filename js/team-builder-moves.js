
/*
 * ColorDex 0.7.3A
 * Editor de movesets por versão
 */

(() => {
  const STORAGE_KEY = "colordex_teams_v07";

  const editor = document.getElementById("movesEditor");
  const title = document.getElementById("movesPokemonName");
  const validationNotice =
    document.getElementById("movesValidationNotice");
  const closeButton = document.getElementById("closeMovesEditor");
  const versionSelect = document.getElementById("movesGameVersion");
  const selectedContainer = document.getElementById("selectedMoves");
  const availableContainer = document.getElementById("availableMoves");
  const searchInput = document.getElementById("movesSearch");
  const countElement = document.getElementById("movesCount");
  const saveButton = document.getElementById("saveMovesButton");

  let teamId = null;
  let slotIndex = null;
  let pokemon = null;
  let versionData = {};
  let selectedMoves = [];
  let activeVersion = "";
  let formMoveData = null;
  let formDataAvailable = false;
  let moveCatalog = {};

  function normalizeMoveName(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-");
  }
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

  function formatVersion(version) {
    return version
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }


  function getUniqueMoves(version) {
    const speciesMoves = versionData[version] || [];
    const unique = new Map();

    // Metadados já existentes na espécie.
    const speciesMetadata = new Map();

    for (const move of speciesMoves) {
      const key = normalizeMoveName(move.name);

      if (!speciesMetadata.has(key)) {
        speciesMetadata.set(key, move);
      }
    }

    // Quando há dados da forma, eles definem quais
    // movimentos são permitidos naquela versão.
    const specificMoves = formMoveData?.[version];

    const sourceMoves =
      formDataAvailable && Array.isArray(specificMoves)
        ? specificMoves
        : speciesMoves;

    for (const source of sourceMoves) {
      const key = normalizeMoveName(source.name);
      if (!key) continue;

      const base = speciesMetadata.get(key);
      const catalog = moveCatalog[key];

      // Sem ID confiável, não permitir selecionar.
      const id = Number(base?.id ?? catalog?.id);

      if (!Number.isInteger(id) || id <= 0) {
        continue;
      }

      if (!unique.has(id)) {
        unique.set(id, {
          id,
          name:
            base?.name ||
            catalog?.name ||
            source.name.replace(/-/g, " "),
          type: base?.type ?? catalog?.type ?? null,
          category: base?.category ?? catalog?.category ?? null,
          power: base?.power ?? catalog?.power ?? null,
          accuracy: base?.accuracy ?? catalog?.accuracy ?? null,
          pp: base?.pp ?? catalog?.pp ?? null,
          methods: []
        });
      }

      const entry = unique.get(id);

      let method;

      if (source.method === "level-up") {
        method = `Nível ${source.level ?? 0}`;
      } else {
        method = String(source.method || "Outro");
      }

      if (!entry.methods.includes(method)) {
        entry.methods.push(method);
      }
    }

    return [...unique.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  function renderSelected() {
    selectedContainer.replaceChildren();

    for (let i = 0; i < 4; i++) {
      const move = selectedMoves[i];

      const button = document.createElement("button");
      button.type = "button";
      button.className = "selected-move";

      if (move) {
        button.textContent = `${i + 1}. ${move.name} ×`;
        button.title = "Clique para remover";
        button.addEventListener("click", () => {
          selectedMoves.splice(i, 1);
          renderSelected();
          renderAvailable();
        });
      } else {
        button.classList.add("empty");
        button.textContent = `${i + 1}. Movimento vazio`;
      }

      selectedContainer.appendChild(button);
    }
  }

  function renderAvailable() {
    const query = searchInput.value.trim().toLowerCase();
    const moves = getUniqueMoves(activeVersion);

    const filtered = moves.filter(move =>
      move.name.toLowerCase().includes(query) ||
      String(move.type).toLowerCase().includes(query) ||
      move.methods.some(method =>
        method.toLowerCase().includes(query)
      )
    );

    countElement.textContent =
      `${filtered.length} movimentos disponíveis`;

    availableContainer.replaceChildren();

    for (const move of filtered) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "available-move";

      const alreadySelected = selectedMoves.some(
        item => item.id === move.id
      );

      button.disabled =
        alreadySelected || selectedMoves.length >= 4;

      const info = document.createElement("span");
      info.className = "move-info";

      const name = document.createElement("strong");
      name.textContent = move.name;

      const details = document.createElement("small");
      details.textContent =
        `${move.methods.join(", ")} • Poder: ${move.power ?? "—"} • PP: ${move.pp ?? "—"}`;

      info.append(name, details);

      const type = document.createElement("span");
      type.className = "move-type";
      type.textContent = move.type || "—";

      button.append(info, type);

      button.addEventListener("click", () => {
        if (selectedMoves.length >= 4) return;

        if (selectedMoves.some(item => item.id === move.id)) {
          return;
        }

        selectedMoves.push({
          id: move.id,
          name: move.name
        });

        renderSelected();
        renderAvailable();
      });

      availableContainer.appendChild(button);
    }
  }


  function changeVersion() {
    const newVersion = versionSelect.value;

    const validIds = new Set(
      getUniqueMoves(newVersion).map(move => move.id)
    );

    const incompatible = selectedMoves.filter(
      move => !validIds.has(Number(move.id))
    );

    if (incompatible.length > 0) {
      const names = incompatible
        .map(move => move.name)
        .join(", ");

      const confirmed = confirm(
        `Os seguintes movimentos não estão disponíveis em ${formatVersion(newVersion)}:\n\n` +
        `${names}\n\n` +
        `Deseja continuar? Esses movimentos serão retirados do moveset ao salvar.`
      );

      if (!confirmed) {
        versionSelect.value = activeVersion;
        return;
      }
    }

    activeVersion = newVersion;

    selectedMoves = selectedMoves.filter(
      move => validIds.has(Number(move.id))
    );

    renderSelected();
    renderAvailable();
  }


  async function openEditor(selectedTeamId, selectedSlot) {
    const teams = readTeams();
    const team = teams.find(item => item.id === selectedTeamId);
    const selectedPokemon = team?.pokemon?.[selectedSlot];

    if (!selectedPokemon) return;

    teamId = selectedTeamId;
    slotIndex = selectedSlot;
    pokemon = selectedPokemon;

    const isAlternativeForm =
      pokemon.form && pokemon.form !== "normal";

    if (isAlternativeForm) {
      validationNotice.textContent =
        "⚠ Movimentos carregados da espécie original. " +
        "As regras exclusivas desta forma ainda não foram verificadas.";
    } else {
      validationNotice.textContent =
        "Movimentos disponíveis conforme os dados da espécie e da versão selecionada.";
    }

    title.textContent =
      `${pokemon.name || `#${pokemon.id}`} • ${pokemon.form || "normal"}`;

    selectedMoves = Array.isArray(pokemon.moves)
      ? pokemon.moves.slice(0, 4)
      : [];

    searchInput.value = "";
    countElement.textContent = "Carregando movimentos...";
    availableContainer.replaceChildren();
    selectedContainer.replaceChildren();

    editor.hidden = false;

    try {
      const number = String(pokemon.id).padStart(3, "0");

      const response = await fetch(
        `../data/pokemon-moves/${number}.json`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      versionData = await response.json();
      moveCatalog = {};

      try {
        const catalogResponse = await fetch(
          "../data/pokemon-form-moves/move-catalog.json"
        );

        if (catalogResponse.ok) {
          moveCatalog = await catalogResponse.json();
        }
      } catch (error) {
        console.warn("Catálogo de movimentos indisponível:", error);
      }
      formMoveData = null;
      formDataAvailable = false;

      if (pokemon.form && pokemon.form !== "normal") {
        const formFile =
          `${pokemon.id}--${pokemon.form}.json`;

        try {
          const formResponse = await fetch(
            `../data/pokemon-form-moves/${formFile}`
          );

          if (formResponse.ok) {
            const downloaded = await formResponse.json();

            if (
              downloaded.versions &&
              typeof downloaded.versions === "object"
            ) {
              formMoveData = downloaded.versions;
              formDataAvailable = true;
            }
          }
        } catch (error) {
          console.warn(
            "Dados específicos da forma indisponíveis:",
            error
          );
        }
      }
      if (pokemon.form && pokemon.form !== "normal") {
        validationNotice.textContent = formDataAvailable
          ? "✓ Movimentos específicos da forma carregados. " +
            "A disponibilidade segue os dados da PokéAPI por versão."
          : "⚠ Dados específicos desta forma ainda indisponíveis. " +
            "A lista utiliza os movimentos da espécie original.";
      }
      const versions = Object.keys(versionData).filter(
        key => Array.isArray(versionData[key]) &&
               versionData[key].length > 0
      );

      versionSelect.replaceChildren();

      for (const version of versions) {
        const option = document.createElement("option");
        option.value = version;
        option.textContent = formatVersion(version);
        versionSelect.appendChild(option);
      }

      if (versions.length === 0) {
        countElement.textContent =
          "Nenhum movimento encontrado para este Pokémon.";
        return;
      }

      activeVersion = versions.includes(pokemon.gameVersion)
        ? pokemon.gameVersion
        : versions.includes("scarlet-violet")
          ? "scarlet-violet"
          : versions[versions.length - 1];

      versionSelect.value = activeVersion;
      changeVersion();

    } catch (error) {
      console.error("Erro ao carregar movimentos:", error);
      countElement.textContent =
        "Não foi possível carregar os movimentos.";
    }
  }

  function saveMoves() {
    const teams = readTeams();
    const team = teams.find(item => item.id === teamId);

    if (!team || !team.pokemon?.[slotIndex]) return;

    team.pokemon[slotIndex].moves = selectedMoves;
    team.pokemon[slotIndex].gameVersion = activeVersion;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(teams)
      );
    } catch (error) {
      alert("Não foi possível salvar o moveset.");
      return;
    }

    editor.hidden = true;

    window.dispatchEvent(
      new Event("colordex-teams-updated")
    );
  }

  function closeEditor() {
    editor.hidden = true;
  }

  closeButton.addEventListener("click", closeEditor);
  saveButton.addEventListener("click", saveMoves);
  versionSelect.addEventListener("change", changeVersion);
  searchInput.addEventListener("input", renderAvailable);

  editor.addEventListener("click", event => {
    if (event.target === editor) closeEditor();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !editor.hidden) {
      closeEditor();
    }
  });

  window.ColorDexTeamMoves = {
    openEditor
  };
})();
