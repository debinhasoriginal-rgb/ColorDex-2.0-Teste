
/*
 * ColorDex 0.7.2
 * Seleção de Pokémon concluídos
 */

(() => {
  const STORAGE_KEY = "colordex_teams_v07";

  const overlay = document.getElementById("pokemonPicker");
  const closeButton = document.getElementById("closePokemonPicker");
  const searchInput = document.getElementById("pokemonPickerSearch");
  const listElement = document.getElementById("pokemonPickerList");
  const countElement = document.getElementById("pokemonPickerCount");

  let catalog = [];
  let selectedTeamId = null;
  let selectedSlot = null;

  function normalSprite(id, shiny = false) {
    if (shiny) {
      return `../assets/pokemon/v06-auditoria/shiny/normais/${String(id).padStart(4, "0")}.png`;
    }

    return `../assets/pokemon/normal/${String(id).padStart(3, "0")}.png`;
  }

  function getProgress(id, form, shiny) {
    const key = form === "normal" && !shiny
      ? `colordex_paint_${String(id).padStart(3, "0")}`
      : `colordex_paint_v06_${id}:${form}:${shiny ? "shiny" : "normal"}`;

    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      return saved ? Number(saved.progress) || 0 : 0;
    } catch {
      return 0;
    }
  }

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }


  function formatForm(form) {
    if (form === "normal") {
      return "Forma Normal";
    }

    return String(form)
      .replaceAll("-", " ")
      .replaceAll("_", " ")
      .replace(/\b\w/g, letra => letra.toUpperCase());
  }


  function getUnlockedPokemon(pokemonData, formsData) {
    const result = [];
    const names = new Map();

    for (const pokemon of pokemonData) {
      const id = Number(pokemon.id);
      if (!Number.isInteger(id)) continue;

      const name =
        pokemon.name?.pt ||
        pokemon.name?.en ||
        (typeof pokemon.name === "string" ? pokemon.name : null) ||
        pokemon.names?.en ||
        `Pokémon #${id}`;

      names.set(id, name);
    }

    const normalCompleted = readArray("colordex_completed")
      .map(Number);

    const variantCompleted = readArray("colordex_completed_v06");

    // Também localizar pinturas de variantes com 100% de progresso.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key || !key.startsWith("colordex_paint_v06_")) {
        continue;
      }

      const identity = key.slice("colordex_paint_v06_".length);

      if (
        /^\d+:[a-z0-9_-]+:(normal|shiny)$/.test(identity) &&
        !variantCompleted.includes(identity)
      ) {
        variantCompleted.push(identity);
      }
    }

    for (const id of normalCompleted) {
      if (getProgress(id, "normal", false) < 100) continue;

      result.push({
        id,
        form: "normal",
        shiny: false,
        name: names.get(id) || `Pokémon #${id}`,
        sprite: normalSprite(id)
      });
    }

    for (const key of variantCompleted) {
      const match = /^(\d+):([a-z0-9_-]+):(normal|shiny)$/.exec(key);
      if (!match) continue;

      const id = Number(match[1]);
      const form = match[2];
      const shiny = match[3] === "shiny";

      if (getProgress(id, form, shiny) < 100) continue;

      let sprite;

      if (form === "normal") {
        sprite = normalSprite(id, shiny);
      } else {
        const formInfo = (formsData[String(id)] || [])
          .find(item => item.id === form);

        if (!formInfo) continue;

        sprite = shiny ? formInfo.shiny : formInfo.sprite;
      }

      if (!sprite) continue;

      result.push({
        id,
        form,
        shiny,
        name: names.get(id) || `Pokémon #${id}`,
        sprite
      });
    }

    return result.filter((item, index, array) =>
      array.findIndex(other =>
        other.id === item.id &&
        other.form === item.form &&
        other.shiny === item.shiny
      ) === index
    );
  }

  function renderPicker() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = catalog.filter(pokemon =>
      pokemon.name.toLowerCase().includes(query) ||
      String(pokemon.id).includes(query) ||
      formatForm(pokemon.form).toLowerCase().includes(query)
    );

    listElement.replaceChildren();

    countElement.textContent =
      `${filtered.length} Pokémon/variantes disponíveis`;

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "picker-empty";
      empty.textContent =
        "Nenhum Pokémon concluído encontrado.";
      listElement.appendChild(empty);
      return;
    }

    for (const pokemon of filtered) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "picker-item";

      const img = document.createElement("img");
      img.src = pokemon.sprite;
      img.alt = pokemon.name;

      const info = document.createElement("span");
      info.className = "picker-item-info";

      const name = document.createElement("strong");
      name.textContent = pokemon.name;

      const detail = document.createElement("small");
      detail.textContent =
        `${formatForm(pokemon.form)}${pokemon.shiny ? " ✨ Shiny" : ""}`;

      info.append(name, detail);
      button.append(img, info);

      button.addEventListener("click", () => {
        choosePokemon(pokemon);
      });

      listElement.appendChild(button);
    }
  }

  function choosePokemon(pokemon) {
    const teams = readArray(STORAGE_KEY);
    const team = teams.find(item => item.id === selectedTeamId);

    if (!team || selectedSlot === null) return;

    if (!Array.isArray(team.pokemon)) {
      team.pokemon = Array(6).fill(null);
    }


    team.pokemon[selectedSlot] = {
      id: pokemon.id,
      name: pokemon.name,
      form: pokemon.form,
      shiny: pokemon.shiny
    };


    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
    } catch (error) {
      alert("Não foi possível salvar o Pokémon.");
      return;
    }

    closePicker();
    window.dispatchEvent(new Event("colordex-teams-updated"));
  }

  function openPicker(teamId, slotIndex) {
    selectedTeamId = teamId;
    selectedSlot = slotIndex;
    searchInput.value = "";
    renderPicker();
    overlay.hidden = false;
    searchInput.focus();
  }

  function closePicker() {
    overlay.hidden = true;
    selectedTeamId = null;
    selectedSlot = null;
  }

  closeButton.addEventListener("click", closePicker);
  searchInput.addEventListener("input", renderPicker);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closePicker();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) {
      closePicker();
    }
  });

  Promise.all([
    fetch("../data/pokemon-data.json").then(r => {
      if (!r.ok) throw new Error("Erro ao carregar Pokémon.");
      return r.json();
    }),
    fetch("../data/pokemon-forms-v06.json").then(r => {
      if (!r.ok) throw new Error("Erro ao carregar formas.");
      return r.json();
    })
  ]).then(([pokemonData, formsData]) => {
    const entries = Array.isArray(pokemonData)
      ? pokemonData
      : Object.values(pokemonData);

    catalog = getUnlockedPokemon(entries, formsData);
  }).catch(error => {
    console.error("Erro no seletor:", error);
  });

  window.ColorDexTeamPicker = {
    openPicker,
    normalSprite
  };
})();
