
"use strict";

// ==========================================
// COLORDEX 0.5 — FICHAS INDIVIDUAIS
// ==========================================

const TOTAL_POKEMON = 1025;

// CORES DOS TIPOS

const TYPE_COLORS = {
  normal: "#9299a1",
  fire: "#e76b45",
  water: "#438acb",
  electric: "#d6aa35",
  grass: "#4a9b69",
  ice: "#65b7c4",
  fighting: "#bb594b",
  poison: "#9565ad",
  ground: "#bb8c4e",
  flying: "#788fbf",
  psychic: "#d76587",
  bug: "#849a39",
  rock: "#9a8964",
  ghost: "#70659e",
  dragon: "#6266b6",
  dark: "#64616b",
  steel: "#6e9da7",
  fairy: "#c77ca5"
};

// TIPOS EM PORTUGUÊS E INGLÊS

const TYPE_ALIASES = {
  normal: "normal",
  fogo: "fire",
  água: "water",
  agua: "water",
  elétrico: "electric",
  eletrico: "electric",
  planta: "grass",
  grama: "grass",
  gelo: "ice",
  lutador: "fighting",
  venenoso: "poison",
  terra: "ground",
  voador: "flying",
  psíquico: "psychic",
  psiquico: "psychic",
  inseto: "bug",
  pedra: "rock",
  fantasma: "ghost",
  dragão: "dragon",
  dragao: "dragon",
  sombrio: "dark",
  aço: "steel",
  aco: "steel",
  fada: "fairy"
};

const TYPE_NAMES = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  electric: "Elétrico",
  grass: "Planta",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Venenoso",
  ground: "Terra",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada"
};

// TRADUÇÃO DAS HABILIDADES INICIAIS

const ABILITY_NAMES = {
  overgrow: "Crescimento Excessivo",
  chlorophyll: "Clorofila"
};

// ELEMENTOS DA PÁGINA

const pokemonHero =
  document.getElementById("pokemonHero");

const pokemonNumber =
  document.getElementById("pokemonNumber");

const pokemonName =
  document.getElementById("pokemonName");

const pokemonSprite =
  document.getElementById("pokemonSprite");

const pokemonTypes =
  document.getElementById("pokemonTypes");

const previousPokemon =
  document.getElementById("previousPokemon");

const nextPokemon =
  document.getElementById("nextPokemon");

const paintButton =
  document.getElementById("paintButton");

const pokemonHeight =
  document.getElementById("pokemonHeight");

const pokemonWeight =
  document.getElementById("pokemonWeight");

const pokemonAbilities =
  document.getElementById("pokemonAbilities");

const pokemonDescription =
  document.getElementById("pokemonDescription");

const pokemonStats =
  document.getElementById("pokemonStats");

const statsTotal =
  document.getElementById("statsTotal");

const pokemonEvolution =
  document.getElementById("pokemonEvolution");

const pokemonMoves =
  document.getElementById("pokemonMoves");

const moveSearch =
  document.getElementById("moveSearch");
const moveVersion =
  document.getElementById("moveVersion");

const moveMethod =
  document.getElementById("moveMethod");

const movesCount =
  document.getElementById("movesCount");
const tabButtons =
  document.querySelectorAll(".tab-button");

const tabPanels =
  document.querySelectorAll(".tab-panel");

// DADOS

let pokemonData = [];
let pokemonDetails = {};
let pokemonEvolutions = {};
let pokemonMovesData = {};
let currentPokemonId = 1;

// FUNÇÕES AUXILIARES

function formatNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}

function getSprite(id) {
  const number = String(id).padStart(3, "0");

  return `../assets/pokemon/normal/${number}.png`;
}

function formatName(name) {
  return String(name)
    .split("-")
    .map(word =>
      word.charAt(0).toUpperCase() +
      word.slice(1)
    )
    .join(" ");
}

function getPokemonName(pokemon) {
  const specialNames = {
    29: "Nidoran♀",
    32: "Nidoran♂",
    83: "Farfetch'd",
    122: "Mr. Mime",
    250: "Ho-Oh",
    474: "Porygon-Z"
  };

  return (
    specialNames[pokemon.id] ||
    formatName(pokemon.name)
  );
}

function normalizeType(type) {
  const value = String(type || "normal")
    .trim()
    .toLowerCase();

  return TYPE_ALIASES[value] || value;
}

function formatMeasurement(value, unit) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return (
    value.toLocaleString("pt-BR", {
      maximumFractionDigits: 2
    }) +
    " " +
    unit
  );
}

// ID NA URL

function getPokemonIdFromUrl() {
  const params = new URLSearchParams(
    window.location.search
  );

  const id = Number(params.get("id") || 1);

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    id > TOTAL_POKEMON
  ) {
    return 1;
  }

  return id;
}

// PINTURA CONCLUÍDA


function isPokemonCompleted(id) {
  try {
    const saved = JSON.parse(
      localStorage.getItem("colordex_completed") || "[]"
    );

    const registered = Array.isArray(saved) &&
      saved.some(value => Number(value) === id);

    if (!registered) {
      return false;
    }

    // Conferir o progresso real da pintura normal.
    const saveKey =
      `colordex_paint_${String(id).padStart(3, "0")}`;

    const painting = JSON.parse(
      localStorage.getItem(saveKey) || "null"
    );

    return Boolean(
      painting &&
      Number(painting.progress) >= 100
    );

  } catch (error) {
    console.error(
      "Erro ao verificar pintura:",
      error
    );

    return false;
  }
}


// BOTÃO DE PINTURA

function updatePaintButton(id) {
  paintButton.href =
    `painting.html?id=${id}`;

  paintButton.textContent =
    isPokemonCompleted(id)
      ? "🎨 PINTAR NOVAMENTE"
      : "🎨 COMEÇAR A PINTURA";
}

// LIMPAR INFORMAÇÕES DETALHADAS

function resetDetailedInformation() {
  pokemonHeight.textContent = "—";
  pokemonWeight.textContent = "—";

  pokemonAbilities.textContent =
    "Informações ainda não disponíveis.";

  pokemonDescription.textContent =
    "Descrição ainda não disponível.";

  pokemonStats.textContent =
    "Atributos em preparação.";

  statsTotal.textContent = "—";

  pokemonEvolution.textContent =
    "Linha evolutiva em preparação.";

  pokemonMoves.textContent =
    "Movimentos em preparação.";

  moveSearch.value = "";
}

// ==========================================
// ABA SOBRE
// ==========================================

function renderAbout(id) {
  const details = pokemonDetails[String(id)];

  if (!details) {
    return;
  }

  // ALTURA E PESO

  pokemonHeight.textContent =
    formatMeasurement(details.height, "m");

  pokemonWeight.textContent =
    formatMeasurement(details.weight, "kg");

  // HABILIDADES

  pokemonAbilities.innerHTML = "";

  const abilities = Array.isArray(
    details.abilities
  )
    ? details.abilities
    : [];

  if (abilities.length === 0) {
    pokemonAbilities.textContent =
      "Habilidades não disponíveis.";
  }

  abilities.forEach(ability => {
    const badge = document.createElement("span");

    badge.className = "ability-badge";

    const englishName =
      String(ability.name || "");

    const key = englishName
      .trim()
      .toLowerCase();

    const portugueseName =
      ABILITY_NAMES[key];

    let label = englishName;

    if (portugueseName) {
      label += ` — ${portugueseName}`;
    }

    if (ability.hidden === true) {
      badge.classList.add("hidden-ability");
      label += " (Oculta)";
    }

    badge.textContent = label;

    pokemonAbilities.appendChild(badge);
  });

  // DESCRIÇÃO

  pokemonDescription.textContent =
    details.description ||
    "Descrição ainda não disponível.";
}

function renderStats(id) {
  const details = pokemonDetails[String(id)];
  const stats = details?.stats;

  if (!stats) {
    pokemonStats.textContent =
      "Atributos ainda não disponíveis.";

    statsTotal.textContent = "—";
    return;
  }

  const statConfig = [
    { key: "hp", name: "HP", color: "#60b77a" },
    { key: "attack", name: "Ataque", color: "#e8a54d" },
    { key: "defense", name: "Defesa", color: "#e8a54d" },
    { key: "special_attack", name: "At. Especial", color: "#579ce0" },
    { key: "special_defense", name: "Def. Especial", color: "#579ce0" },
    { key: "speed", name: "Velocidade", color: "#d979a7" }
  ];

  pokemonStats.innerHTML = "";

  let total = 0;

  statConfig.forEach(stat => {
    const value = Number(stats[stat.key] ?? 0);
    total += value;

    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("span");
    label.className = "stat-label";
    label.textContent = stat.name;

    const number = document.createElement("span");
    number.className = "stat-number";
    number.textContent = value;

    const track = document.createElement("div");
    track.className = "stat-track";

    const fill = document.createElement("div");
    fill.className = "stat-fill";
    fill.style.width =
      `${Math.min(100, value / 255 * 100)}%`;
    fill.style.backgroundColor = stat.color;

    track.appendChild(fill);

    row.append(label, number, track);
    pokemonStats.appendChild(row);
  });

  statsTotal.textContent = total;
}

// ==========================================
// EXIBIR FICHA
// ==========================================


function getEvolutionMethod(evolution) {
  if (!evolution) return "Método desconhecido";

  const trigger = evolution.trigger;
  const c = evolution.conditions || {};
  const requirements = [];

  const itemNames = {
    "water-stone": "Pedra da Água",
    "thunder-stone": "Pedra do Trovão",
    "fire-stone": "Pedra do Fogo",
    "leaf-stone": "Pedra da Folha",
    "ice-stone": "Pedra do Gelo",
    "moon-stone": "Pedra da Lua",
    "sun-stone": "Pedra do Sol",
    "dusk-stone": "Pedra do Anoitecer",
    "dawn-stone": "Pedra do Amanhecer",
    "shiny-stone": "Pedra Brilhante"
  };

  const translateItem = item =>
    itemNames[item] || formatName(item);

  if (trigger === "use-item") {
    return c.trigger_item
      ? `Usar ${translateItem(c.trigger_item)}`
      : "Usar item especial";
  }

  if (trigger === "trade") {
    requirements.push("Troca");

    if (c.held_item) {
      requirements.push(
        `segurando ${translateItem(c.held_item)}`
      );
    }

    return requirements.join(" + ");
  }

  if (c.minimum_level) {
    requirements.push(`Nível ${c.minimum_level}`);
  }

  if (c.minimum_happiness) {
    requirements.push("Amizade elevada");
  }

  if (c.minimum_affection) {
    requirements.push("Afeição elevada");
  }

  if (c.time_of_day === "day") {
    requirements.push("durante o dia");
  } else if (c.time_of_day === "night") {
    requirements.push("durante a noite");
  }

  if (c.known_move_type_id === "18") {
    requirements.push("movimento do tipo Fada");
  }

  if (c.known_move) {
    requirements.push(
      `conhecer ${formatName(c.known_move)}`
    );
  }

  if (c.used_move) {
    requirements.push(
      `usar ${formatName(c.used_move)}`
    );
  }

  if (c.location_id) {
    requirements.push("local específico");
  }

  if (c.relative_physical_stats !== undefined) {
    const comparison = Number(
      c.relative_physical_stats
    );

    if (comparison > 0) {
      requirements.push("Ataque maior que Defesa");
    } else if (comparison < 0) {
      requirements.push("Defesa maior que Ataque");
    } else {
      requirements.push("Ataque igual à Defesa");
    }
  }

  if (trigger === "level-up" && requirements.length === 0) {
    return "Subir de nível (condição especial)";
  }

  return requirements.length
    ? requirements.join(" + ")
    : "Condição especial";
}

function getEvolutionMethods(member) {
  const evolutions = Array.isArray(member.evolutions)
    ? member.evolutions
    : [];

  const methods = evolutions.map(getEvolutionMethod);

  return [...new Set(methods)];
}

function renderEvolution(id) {
  const family = pokemonEvolutions[String(id)];

  pokemonEvolution.innerHTML = "";

  if (!family || !Array.isArray(family.members)) {
    pokemonEvolution.textContent =
      "Linha evolutiva ainda não disponível.";
    return;
  }

  const members = family.members;

  if (members.length === 1) {
    pokemonEvolution.textContent =
      "Este Pokémon não possui evoluções conhecidas.";
    return;
  }
  const hasBranches = family.members.some(member =>
    family.members.filter(other =>
      other.evolves_from === member.id
    ).length > 1
  );
  const stages = new Map();

  members.forEach(member => {
    const stage = Number(member.stage || 0);

    if (!stages.has(stage)) {
      stages.set(stage, []);
    }

    stages.get(stage).push(member);
  });

  const sortedStages = [...stages.keys()]
    .sort((a, b) => a - b);

  sortedStages.forEach((stage, index) => {
    const stageContainer =
      document.createElement("div");

    stageContainer.className =
      "evolution-stage";

    stages.get(stage).forEach(member => {
      const card = document.createElement("a");

      card.className = "evolution-card";
      card.href = `pokemon.html?id=${member.id}`;

      if (member.id === id) {
        card.classList.add("current");
      }

      const image = document.createElement("img");

      image.src = getSprite(member.id);
      image.alt = formatName(member.name);
      image.loading = "lazy";

      if (!isPokemonCompleted(member.id)) {
        image.style.filter = "brightness(0)";
      }

      const name = document.createElement("strong");
      name.textContent = formatName(member.name);

      const number = document.createElement("span");
      number.className = "evolution-number";
      number.textContent = formatNumber(member.id);

      card.append(image, name, number);


      if (member.evolves_from !== null) {
        const methods = getEvolutionMethods(member);

        if (hasBranches) {
          const info = document.createElement("div");
          info.className = "evolution-branch-info";

          const title = document.createElement("span");
          title.className = "evolution-branch-title";
          title.textContent = "COMO EVOLUIR";

          info.appendChild(title);

          methods.forEach(methodText => {
            const method = document.createElement("p");
            method.textContent = methodText;
            info.appendChild(method);
          });

          card.appendChild(info);
        } else {
          const method = document.createElement("small");
          method.className = "evolution-method";

          method.textContent =
            methods.join(" ou ") || "Condição especial";

          card.appendChild(method);
        }
      }


      stageContainer.appendChild(card);
    });

    pokemonEvolution.appendChild(stageContainer);


    if (index < sortedStages.length - 1) {
      const nextStage = sortedStages[index + 1];
      const nextMembers = stages.get(nextStage);

      const transition = document.createElement("div");
      transition.className = "evolution-transition";

      const arrow = document.createElement("div");
      arrow.className = "evolution-arrow";
      arrow.textContent = "↓";

      transition.appendChild(arrow);

      // Mostrar painel quando existe um único destino
      // para evitar informações ambíguas em ramificações.
      if (nextMembers.length === 1) {
        const nextMember = nextMembers[0];
        const evolution = nextMember.evolutions?.[0];

        const method = getEvolutionMethod(evolution);

        const panel = document.createElement("div");
        panel.className = "evolution-info-panel";

        const heading = document.createElement("strong");
        heading.textContent = method;

        const description = document.createElement("p");

        const conditions = evolution?.conditions || {};

        if (conditions.minimum_level) {
          description.textContent =
            `Alcance o nível ${conditions.minimum_level} ` +
            "para realizar esta evolução.";
        } else if (evolution?.trigger === "trade") {
          description.textContent =
            "Realize uma troca para evoluir este Pokémon.";
        } else if (conditions.trigger_item) {
          description.textContent =
            `Utilize ${formatName(conditions.trigger_item)} ` +
            "para realizar esta evolução.";
        } else {
          description.textContent =
            "Esta evolução possui condições específicas.";
        }

        panel.append(heading, description);

        if (index % 2 === 0) {
          panel.classList.add("panel-left");
        } else {
          panel.classList.add("panel-right");
        }

        transition.appendChild(panel);
      }

      pokemonEvolution.appendChild(transition);
    }

  });
}

function showPokemon(id) {
  const pokemon = pokemonData.find(
    entry => Number(entry.id) === id
  );

  if (!pokemon) {
    console.error(
      "Pokémon não encontrado:",
      id
    );

    return;
  }

  currentPokemonId = id;

  const name = getPokemonName(pokemon);

  // NOME E NÚMERO

  pokemonNumber.textContent =
    formatNumber(id);

  pokemonName.textContent = name;

  // SPRITE

  pokemonSprite.src = getSprite(id);
  pokemonSprite.alt = name;

  pokemonSprite.style.filter =
    isPokemonCompleted(id)
      ? "none"
      : "brightness(0)";

  // TIPOS

  pokemonTypes.innerHTML = "";

  const types = Array.isArray(pokemon.types)
    ? pokemon.types
    : [];

  types.forEach(type => {
    const normalizedType =
      normalizeType(type);

    const badge =
      document.createElement("span");

    badge.className = "type-badge";

    badge.textContent =
      TYPE_NAMES[normalizedType] ||
      formatName(type);

    pokemonTypes.appendChild(badge);
  });

  // COR DO CABEÇALHO

  const primaryType = normalizeType(
    types[0] || "normal"
  );

  const heroColor =
    TYPE_COLORS[primaryType] ||
    TYPE_COLORS.normal;

  pokemonHero.style.setProperty(
    "--hero-color",
    heroColor
  );

  // SETAS

  previousPokemon.disabled = id === 1;

  nextPokemon.disabled =
    id === TOTAL_POKEMON;

  // BOTÃO DE PINTURA

  updatePaintButton(id);

  // INFORMAÇÕES DA FICHA

  resetDetailedInformation();

  renderAbout(id);
  renderStats(id);
  renderEvolution(id);
  loadPokemonMoves(id);
  // TÍTULO DA PÁGINA

  document.title = `ColorDex | ${name}`;

  // ATUALIZAR URL

  const url = new URL(
    window.location.href
  );

  url.searchParams.set(
    "id",
    String(id)
  );

  window.history.replaceState(
    { pokemonId: id },
    "",
    url
  );
  if (window.ColorDexVariants) {
    window.ColorDexVariants.updatePokemon(id);
  }
}

// ==========================================
// NAVEGAÇÃO
// ==========================================

function navigatePokemon(direction) {
  const newId =
    currentPokemonId + direction;

  if (
    newId < 1 ||
    newId > TOTAL_POKEMON
  ) {
    return;
  }

  showPokemon(newId);
}

previousPokemon.addEventListener(
  "click",
  () => navigatePokemon(-1)
);

nextPokemon.addEventListener(
  "click",
  () => navigatePokemon(1)
);

// ==========================================
// ABAS
// ==========================================

/* COLORDEX 0.5 — SISTEMA DE MOVIMENTOS */

const MOVE_METHOD_NAMES = {
  "level-up": "Por nível",
  "machine": "MT / MO",
  "egg": "Reprodução",
  "tutor": "Tutor",
  "light-ball-egg": "Reprodução especial",
  "form-change": "Mudança de forma",
  "zygarde-cube": "Zygarde Cube",
  "stadium-surfing-pikachu": "Evento especial"
};

const MOVE_CATEGORY_NAMES = {
  physical: "Físico",
  special: "Especial",
  status: "Status"
};

const MOVE_TYPE_NAMES = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  electric: "Elétrico",
  grass: "Planta",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Veneno",
  ground: "Terra",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada"
};

function formatMoveVersion(version) {
  return version
    .split("-")
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

async function loadPokemonMoves(id) {
  const pokemonId = String(id);
  const filename = pokemonId.padStart(3, "0");

  // Limpar as versões do Pokémon anterior
  moveVersion.innerHTML =
    '<option value="">Carregando versões...</option>';

  pokemonMoves.innerHTML = "";
  movesCount.textContent = "Carregando movimentos...";

  try {
    const response = await fetch(
      `../data/pokemon-moves/${filename}.json`
    );

    if (!response.ok) {
      throw new Error(
        `Não foi possível carregar os movimentos de #${filename}`
      );
    }

    const versions = await response.json();

    // Evitar exibir dados de outro Pokémon
    // caso o usuário navegue rapidamente.
    if (currentPokemonId !== id) return;

    pokemonMovesData[pokemonId] = versions;

    updateMoveVersions(id);

  } catch (error) {
    if (currentPokemonId !== id) return;

    console.error("Erro nos movimentos:", error);

    moveVersion.innerHTML =
      '<option value="">Indisponível</option>';

    movesCount.textContent =
      "Não foi possível carregar os movimentos.";

    pokemonMoves.innerHTML = "";
  }
}

function updateMoveVersions(id) {
  const versions = pokemonMovesData[String(id)] || {};
  const names = Object.keys(versions);

  const previousVersion = moveVersion.value;

  moveVersion.innerHTML = "";

  if (!names.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhuma versão disponível";
    moveVersion.appendChild(option);
    renderMoves();
    return;
  }

  // Preservar a versão selecionada ao trocar de Pokémon.
  // Se não existir, usar a última versão disponível
  // segundo a ordem cronológica definida abaixo.
  const versionOrder = [
    "red-blue", "yellow", "gold-silver", "crystal",
    "ruby-sapphire", "emerald", "firered-leafgreen",
    "diamond-pearl", "platinum", "heartgold-soulsilver",
    "black-white", "black-2-white-2",
    "x-y", "omega-ruby-alpha-sapphire",
    "sun-moon", "ultra-sun-ultra-moon",
    "lets-go-pikachu-lets-go-eevee",
    "sword-shield", "brilliant-diamond-and-shining-pearl",
    "legends-arceus", "scarlet-violet"
  ];

  names.sort((a, b) => {
    const indexA = versionOrder.indexOf(a);
    const indexB = versionOrder.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b);
    }
    if (indexA === -1) return -1;
    if (indexB === -1) return 1;

    return indexA - indexB;
  });

  names.forEach(version => {
    const option = document.createElement("option");
    option.value = version;
    option.textContent = formatMoveVersion(version);
    moveVersion.appendChild(option);
  });

  moveVersion.value = names.includes(previousVersion)
    ? previousVersion
    : names[names.length - 1];

  renderMoves();
}

function renderMoves() {
  pokemonMoves.innerHTML = "";

  const versions =
    pokemonMovesData[String(currentPokemonId)] || {};

  const selectedVersion = moveVersion.value;
  const selectedMethod = moveMethod.value;
  const search = moveSearch.value
    .trim()
    .toLowerCase();

  const allMoves = versions[selectedVersion] || [];

  const filteredMoves = allMoves.filter(move => {
    const matchesMethod =
      selectedMethod === "all" ||
      move.method === selectedMethod;

    const matchesSearch =
      move.name.toLowerCase().includes(search);

    return matchesMethod && matchesSearch;
  });

  movesCount.textContent =
    `${filteredMoves.length} movimento(s) encontrado(s)`;

  if (!filteredMoves.length) {
    const empty = document.createElement("p");
    empty.className = "move-empty";
    empty.textContent =
      "Nenhum movimento encontrado para os filtros selecionados.";

    pokemonMoves.appendChild(empty);
    return;
  }

  filteredMoves.forEach(move => {
    const card = document.createElement("article");
    card.className = "move-card";

    const header = document.createElement("div");
    header.className = "move-card-header";

    const name = document.createElement("strong");
    name.textContent = move.name;

    const type = document.createElement("span");
    type.className = "move-type";

    type.textContent =
      MOVE_TYPE_NAMES[move.type] || formatName(move.type);

    type.style.backgroundColor =
      TYPE_COLORS[move.type] || "#64748b";

    header.append(name, type);

    const details = document.createElement("div");
    details.className = "move-card-details";

    const methodName =
      MOVE_METHOD_NAMES[move.method] ||
      formatName(move.method);

    const information = [
      ["Categoria",
        MOVE_CATEGORY_NAMES[move.category] || move.category],
      ["Poder", move.power ?? "—"],
      ["Precisão",
        move.accuracy == null ? "—" : `${move.accuracy}%`],
      ["PP", move.pp ?? "—"],
      ["Método", methodName]
    ];

    if (move.method === "level-up") {
      information.push(["Nível", move.level]);
    }

    information.forEach(([label, value]) => {
      const detail = document.createElement("span");
      detail.className = "move-detail";
      detail.textContent = `${label}: ${value}`;
      details.appendChild(detail);
    });

    card.append(header, details);
    pokemonMoves.appendChild(card);
  });
}

function activateTab(tabId) {
  tabButtons.forEach(button => {
    const active =
      button.dataset.tab === tabId;

    button.classList.toggle(
      "active",
      active
    );

    button.setAttribute(
      "aria-selected",
      String(active)
    );
  });

  tabPanels.forEach(panel => {
    const active =
      panel.id === tabId;

    panel.classList.toggle(
      "active",
      active
    );

    panel.hidden = !active;
  });
}

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
  });
});

// ==========================================
// PESQUISA DE MOVIMENTOS
// ==========================================

moveSearch.addEventListener("input", renderMoves);

moveVersion.addEventListener("change", renderMoves);

moveMethod.addEventListener("change", renderMoves);

// ==========================================
// CARREGAMENTO DOS DADOS
// ==========================================

async function initializePokemonPage() {
  try {
    // CARREGAR POKÉDEX NACIONAL

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
        "Lista de Pokémon incompleta."
      );
    }

    pokemonData = data;

    try {
      const evolutionResponse = await fetch(
        "../data/pokemon-evolutions.json"
      );

      if (!evolutionResponse.ok) {
        throw new Error(
          "Não foi possível carregar as evoluções."
        );
      }

      pokemonEvolutions = await evolutionResponse.json();

      console.log(
        "ColorDex: banco de evoluções carregado."
      );

    } catch (error) {
      console.warn(
        "Evoluções indisponíveis:",
        error
      );

      pokemonEvolutions = {};
    }

    // CARREGAR DADOS DAS FICHAS

    try {
      const detailsResponse = await fetch(
        "../data/pokemon-details.json"
      );

      if (!detailsResponse.ok) {
        throw new Error(
          "pokemon-details.json não encontrado."
        );
      }

      const details =
        await detailsResponse.json();

      if (
        !details ||
        typeof details !== "object" ||
        Array.isArray(details)
      ) {
        throw new Error(
          "Formato inválido de pokemon-details.json"
        );
      }

      pokemonDetails = details;

    } catch (detailsError) {
      console.warn(
        "Dados detalhados indisponíveis:",
        detailsError
      );

      pokemonDetails = {};
    }

    

    // MOSTRAR POKÉMON SELECIONADO

    const initialId =
      getPokemonIdFromUrl();

    showPokemon(initialId);

    console.log(
      `ColorDex 0.5: ${pokemonData.length} Pokémon carregados.`
    );

  } catch (error) {
    console.error(
      "Erro ao carregar ficha Pokémon:",
      error
    );

    pokemonDescription.textContent =
      "Não foi possível carregar os dados do Pokémon.";

    pokemonAbilities.textContent =
      "Erro ao carregar informações.";
  }
}

// INICIALIZAR

initializePokemonPage();
