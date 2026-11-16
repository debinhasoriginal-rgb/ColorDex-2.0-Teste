
const TOTAL_POKEMON = 1025;

// Nomes e tipos carregados do arquivo pokemon-data.json
let pokemonNames = [];
let pokemonTypes = {};

// Elementos da página
const searchInput = document.getElementById("searchInput");
const pokemonGrid = document.getElementById("pokemonGrid");
const resultCount = document.getElementById("resultCount");
const completedCount = document.getElementById("completedCount");
const emptyMessage = document.getElementById("emptyMessage");

const pokemonModal = document.getElementById("pokemonModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalSprite = document.getElementById("modalSprite");
const modalAction = document.getElementById("modalAction");
const closeModal = document.getElementById("closeModal");

const filterButtons = document.querySelectorAll(".filter");
const regionSelect = document.getElementById("regionSelect");
const typeSelect = document.getElementById("typeSelect");

let currentFilter = "all";

// Regiões da Pokédex Nacional
const REGION_RANGES = {
  kanto: [1, 151],
  johto: [152, 251],
  hoenn: [252, 386],
  sinnoh: [387, 493],
  unova: [494, 649],
  kalos: [650, 721],
  alola: [722, 809],
  galar: [810, 905],
  paldea: [906, 1025]
};

// Verificar região selecionada
function matchesRegion(id) {
  const selectedRegion = regionSelect.value;

  if (selectedRegion === "all") {
    return true;
  }

  const range = REGION_RANGES[selectedRegion];

  if (!range) {
    return true;
  }

  return id >= range[0] && id <= range[1];
}

// Caminho do sprite
function getSprite(id) {
  const number = String(id).padStart(3, "0");
  return `../assets/pokemon/normal/${number}.png`;
}

// Pokémon concluídos

function getCompletedPokemon() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("colordex_completed") || "[]"
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    return [...new Set(saved.map(Number))].filter(id => {
      if (
        !Number.isInteger(id) ||
        id < 1 ||
        id > TOTAL_POKEMON
      ) {
        return false;
      }

      // Conferir a pintura da forma normal.
      const number = String(id).padStart(3, "0");

      const painting = JSON.parse(
        localStorage.getItem(
          `colordex_paint_${number}`
        ) || "null"
      );

      return (
        painting !== null &&
        Number(painting.progress) >= 100
      );
    });

  } catch (error) {
    console.error(
      "Erro ao carregar Pokémon concluídos:",
      error
    );

    return [];
  }
}


// Progresso de pintura
function getPaintingProgress(id) {
  try {
    const number = String(id).padStart(3, "0");

    const saved = JSON.parse(
      localStorage.getItem(
        `colordex_paint_${number}`
      ) || "null"
    );

    if (!saved || typeof saved !== "object") {
      return 0;
    }

    const progress = Number(saved.progress);

    if (!Number.isFinite(progress)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, progress)
    );

  } catch (error) {
    console.error(
      "Erro ao carregar progresso:",
      error
    );

    return 0;
  }
}

// Informações de cada Pokémon
function getPokemon(id) {
  const completed = getCompletedPokemon().includes(id);
  const available = true;

  const progress = completed
    ? 100
    : getPaintingProgress(id);

  return {
    id,
    name: pokemonNames[id - 1],
    sprite: getSprite(id),
    available,
    completed,
    progress
  };
}

// Número formatado
function formatNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}

// Status do Pokémon
function getPokemonStatus(pokemon) {
  if (pokemon.completed) {
    return "Concluído";
  }

  if (!pokemon.available) {
    return "Bloqueado";
  }

  if (pokemon.progress > 0) {
    return `${Math.round(pokemon.progress)}% concluído`;
  }

  return "Colorir";
}

// Abrir a ficha individual
function openPokemon(pokemon) {
  if (!pokemon.available) {
    showModal(
      `${formatNumber(pokemon.id)} — ${pokemon.name}`,
      "Este Pokémon ainda está bloqueado.",
      pokemon,
      "ENTENDI"
    );

    return;
  }

  window.location.href =
    `pokemon.html?id=${pokemon.id}`;
}

// Criação dos cartões
function createCard(pokemon) {
  const card = document.createElement("div");

  card.className = "pokemon-card";

  if (!pokemon.available) {
    card.classList.add("locked");
  }

  if (pokemon.completed) {
    card.classList.add("completed");
  }

  // Apenas Pokémon concluídos aparecem coloridos.
  // Os demais permanecem como silhuetas.
  const silhouetteStyle = pokemon.completed
    ? ""
    : "filter: brightness(0);";

  const status = getPokemonStatus(pokemon);

  const lockIcon = pokemon.available
    ? ""
    : '<span class="lock-icon">🔒</span>';

  card.innerHTML = `
    <div class="pokemon-number">
      ${formatNumber(pokemon.id)}
    </div>

    <div class="pokemon-image">
      <img
        src="${pokemon.sprite}"
        alt="${pokemon.name}"
        loading="lazy"
        style="${silhouetteStyle}"
      >
      ${lockIcon}
    </div>

    <div class="pokemon-name">
      ${pokemon.name}
    </div>

    <div class="pokemon-status">
      ${status}
    </div>
  `;

  // COLORDEX 0.5:
  // Clicar no cartão abre a ficha do Pokémon.
  card.addEventListener("click", () => {
    openPokemon(pokemon);
  });

  return card;
}

// COLORDEX 2.0 — RENDERIZACAO PROGRESSIVA

const POKEDEX_BATCH_SIZE = 48;

let visiblePokemon = [];
let renderedPokemonCount = 0;
let renderVersion = 0;
let renderTimer = null;
let renderFrame = null;
let scrollObserver = null;

const loadMoreMarker = document.createElement("div");
loadMoreMarker.className = "colordex-load-more";
loadMoreMarker.style.cssText =
  "height:2px;width:100%;grid-column:1/-1;pointer-events:none;";

function stopPendingRender() {
  renderVersion++;

  if (renderFrame !== null) {
    cancelAnimationFrame(renderFrame);
    renderFrame = null;
  }

  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }
}

function appendPokemonBatch(version) {
  if (version !== renderVersion) return;

  renderFrame = null;

  const end = Math.min(
    renderedPokemonCount + POKEDEX_BATCH_SIZE,
    visiblePokemon.length
  );

  const fragment = document.createDocumentFragment();

  for (let i = renderedPokemonCount; i < end; i++) {
    fragment.appendChild(createCard(visiblePokemon[i]));
  }

  // O marcador permanece no fim da grade.
  if (loadMoreMarker.parentNode === pokemonGrid) {
    pokemonGrid.insertBefore(fragment, loadMoreMarker);
  } else {
    pokemonGrid.appendChild(fragment);
  }

  renderedPokemonCount = end;

  if (renderedPokemonCount >= visiblePokemon.length) {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }

    loadMoreMarker.remove();
    return;
  }

  if (!loadMoreMarker.isConnected) {
    pokemonGrid.appendChild(loadMoreMarker);
  }

  if (scrollObserver) {
    scrollObserver.observe(loadMoreMarker);
  }

  // Se a tela ainda não estiver preenchida,
  // o observador solicitará o próximo lote.
}

function renderPokemon() {
  clearTimeout(renderTimer);
  stopPendingRender();

  const version = renderVersion;

  const search = searchInput.value.trim().toLowerCase();
  const selectedType = typeSelect.value;

  const matches = [];

  for (let id = 1; id <= TOTAL_POKEMON; id++) {
    if (!matchesRegion(id)) continue;

    if (
      selectedType !== "all" &&
      !pokemonTypes[id]?.includes(selectedType)
    ) {
      continue;
    }

    const pokemon = getPokemon(id);

    if (
      !pokemon.name.toLowerCase().includes(search) &&
      !formatNumber(id).includes(search) &&
      !String(id).includes(search)
    ) {
      continue;
    }

    if (
      currentFilter === "available" &&
      !pokemon.available
    ) {
      continue;
    }

    if (
      currentFilter === "completed" &&
      !pokemon.completed
    ) {
      continue;
    }

    matches.push(pokemon);
  }

  visiblePokemon = matches;
  renderedPokemonCount = 0;

  pokemonGrid.replaceChildren();

  resultCount.textContent =
    `${matches.length} Pokémon encontrados`;

  completedCount.textContent =
    `${getCompletedPokemon().length}/${TOTAL_POKEMON} concluídos`;

  emptyMessage.classList.toggle(
    "hidden",
    matches.length > 0
  );

  if (!matches.length) return;

  if ("IntersectionObserver" in window) {
    scrollObserver = new IntersectionObserver(
      entries => {
        if (
          entries.some(entry => entry.isIntersecting) &&
          version === renderVersion &&
          renderFrame === null
        ) {
          renderFrame = requestAnimationFrame(
            () => appendPokemonBatch(version)
          );
        }
      },
      { rootMargin: "600px 0px" }
    );
  }

  appendPokemonBatch(version);

  // Alternativa para navegadores sem IntersectionObserver.
  if (!scrollObserver) {
    while (renderedPokemonCount < visiblePokemon.length) {
      appendPokemonBatch(version);
    }
  }
}

function schedulePokemonRender() {
  clearTimeout(renderTimer);

  // Invalida renderizações anteriores imediatamente.
  stopPendingRender();

  renderTimer = setTimeout(renderPokemon, 150);
}

searchInput.addEventListener(
  "input",
  schedulePokemonRender
);

regionSelect.addEventListener(
  "change",
  renderPokemon
);

typeSelect.addEventListener(
  "change",
  renderPokemon
);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(filter => {
      filter.classList.remove("active");
    });

    button.classList.add("active");
    currentFilter = button.dataset.filter;

    renderPokemon();
  });
});

// Atualizar ao retornar à Pokédex
window.addEventListener(
  "pageshow",
  renderPokemon
);

// Inicialização da Pokédex
async function initializePokedex() {
  try {
    const response = await fetch(
      "../data/pokemon-data.json"
    );

    if (!response.ok) {
      throw new Error(
        "Não foi possível carregar pokemon-data.json"
      );
    }

    const data = await response.json();

    if (
      !Array.isArray(data) ||
      data.length !== TOTAL_POKEMON
    ) {
      throw new Error(
        "Lista de Pokémon incompleta"
      );
    }

    // Carregar tipos
    pokemonTypes = Object.fromEntries(
      data.map(pokemon => [
        pokemon.id,
        pokemon.types || []
      ])
    );

    // Carregar nomes
    pokemonNames = data.map(pokemon => {
      return pokemon.name
        .split("-")
        .map(
          word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");
    });

    // Corrigir nomes especiais
    pokemonNames[28] = "Nidoran♀";
    pokemonNames[31] = "Nidoran♂";
    pokemonNames[82] = "Farfetch'd";
    pokemonNames[121] = "Mr. Mime";
    pokemonNames[249] = "Ho-Oh";
    pokemonNames[473] = "Porygon-Z";

    renderPokemon();

    console.log(
      `ColorDex: ${pokemonNames.length} Pokémon carregados!`
    );

  } catch (error) {
    console.error(
      "Erro ao iniciar a Pokédex:",
      error
    );
  }
}

initializePokedex();
