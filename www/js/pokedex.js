
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

// Filtros e pesquisa
function renderPokemon() {
  const search = searchInput.value
    .trim()
    .toLowerCase();

  pokemonGrid.innerHTML = "";

  let visibleCount = 0;

  for (let id = 1; id <= TOTAL_POKEMON; id++) {
    const pokemon = getPokemon(id);

    // Filtro por região
    if (!matchesRegion(id)) {
      continue;
    }

    // Filtro por tipo
    const selectedType = typeSelect.value;

    if (
      selectedType !== "all" &&
      !pokemonTypes[id]?.includes(selectedType)
    ) {
      continue;
    }

    // Pesquisa por nome ou número
    const matchesSearch =
      pokemon.name.toLowerCase().includes(search) ||
      formatNumber(id).includes(search) ||
      String(id).includes(search);

    if (!matchesSearch) {
      continue;
    }

    // Filtro de disponíveis
    if (
      currentFilter === "available" &&
      !pokemon.available
    ) {
      continue;
    }

    // Filtro de concluídos
    if (
      currentFilter === "completed" &&
      !pokemon.completed
    ) {
      continue;
    }

    pokemonGrid.appendChild(
      createCard(pokemon)
    );

    visibleCount++;
  }

  resultCount.textContent =
    `${visibleCount} Pokémon encontrados`;

  completedCount.textContent =
    `${getCompletedPokemon().length}/${TOTAL_POKEMON} concluídos`;

  emptyMessage.classList.toggle(
    "hidden",
    visibleCount > 0
  );
}

// Modal
function showModal(
  title,
  description,
  pokemon,
  actionText
) {
  modalTitle.textContent = title;
  modalDescription.textContent = description;

  modalSprite.src = pokemon.sprite;
  modalSprite.alt = pokemon.name;

  modalSprite.style.filter = pokemon.completed
    ? "none"
    : "brightness(0)";

  modalAction.textContent = actionText;

  pokemonModal.classList.remove("hidden");
}

// Fechar modal
function hideModal() {
  pokemonModal.classList.add("hidden");
}

closeModal.addEventListener(
  "click",
  hideModal
);

pokemonModal.addEventListener(
  "click",
  event => {
    if (event.target === pokemonModal) {
      hideModal();
    }
  }
);

document.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      hideModal();
    }
  }
);

modalAction.addEventListener(
  "click",
  hideModal
);

// Pesquisa
searchInput.addEventListener(
  "input",
  renderPokemon
);

regionSelect.addEventListener(
  "change",
  renderPokemon
);

typeSelect.addEventListener(
  "change",
  renderPokemon
);

// Filtros
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
