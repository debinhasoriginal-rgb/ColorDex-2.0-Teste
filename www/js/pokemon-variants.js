
/*
 * ColorDex 0.6
 * Seletor de formas alternativas e Shinys
 */

(function () {
  const formSelect = document.getElementById("pokemonFormSelect");
  const shinyToggle = document.getElementById("pokemonShinyToggle");
  const status = document.getElementById("variantStatus");
  const sprite = document.getElementById("pokemonSprite");
  const paintButton = document.getElementById("paintButton");

  if (!formSelect || !shinyToggle || !sprite || !paintButton) {
    return;
  }

  let formsData = {};
  // COLORDEX 0.8 — Tipos da forma selecionada (não altera pinturas nem dados salvos).
  let cdTypeCatalogPromise;
  let cdFormTypePromise;
  let cdTypeRequest = 0;
  const cdAliases = {
    normal:'Normal', fire:'Fogo', fogo:'Fogo', water:'Água', agua:'Água',
    electric:'Elétrico', eletrico:'Elétrico', grass:'Planta', planta:'Planta',
    ice:'Gelo', gelo:'Gelo', fighting:'Lutador', lutador:'Lutador',
    poison:'Venenoso', venenoso:'Venenoso', ground:'Terra', terra:'Terra',
    flying:'Voador', voador:'Voador', psychic:'Psíquico', psiquico:'Psíquico',
    bug:'Inseto', inseto:'Inseto', rock:'Pedra', pedra:'Pedra',
    ghost:'Fantasma', fantasma:'Fantasma', dragon:'Dragão', dragao:'Dragão',
    dark:'Sombrio', sombrio:'Sombrio', steel:'Aço', aco:'Aço', fairy:'Fada', fada:'Fada'
  };
  const cdTypeColors = {
    Normal:'#a8a77a', Fogo:'#ee8130', Água:'#6390f0', Elétrico:'#f7d02c',
    Planta:'#7ac74c', Gelo:'#96d9d6', Lutador:'#c22e28', Venenoso:'#a33ea1',
    Terra:'#e2bf65', Voador:'#a98ff3', Psíquico:'#f95587', Inseto:'#a6b91a',
    Pedra:'#b6a136', Fantasma:'#735797', Dragão:'#6f35fc', Sombrio:'#705746',
    Aço:'#b7b7ce', Fada:'#d685ad'
  };
  function cdNormalizeType(value) {
    const raw = String(value || '').trim();
    const key = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return cdAliases[key] || raw;
  }
  function cdLoadJson(url) {
    return fetch(url).then(r => { if (!r.ok) throw Error(url + ': HTTP ' + r.status); return r.json(); });
  }
  function cdGetCatalog() {
    if (!cdTypeCatalogPromise) cdTypeCatalogPromise = cdLoadJson('../data/pokemon-data.json')
      .catch(e => { cdTypeCatalogPromise = null; throw e; });
    return cdTypeCatalogPromise;
  }
  function cdGetFormTypes() {
    if (!cdFormTypePromise) cdFormTypePromise = cdLoadJson('../data/pokemon-form-types-v074.json')
      .catch(e => { cdFormTypePromise = null; throw e; });
    return cdFormTypePromise;
  }
  function cdPaintTypes(types, verified) {
    const container = document.getElementById('pokemonTypes');
    if (!container) return;
    container.replaceChildren();
    if (!verified) {
      const badge = document.createElement('span');
      badge.className = 'type-badge';
      badge.textContent = 'Tipos não verificados';
      badge.title = 'Esta forma ainda não possui tipagem confirmada no catálogo.';
      container.append(badge);
      return;
    }
    for (const type of types) {
      const label = cdNormalizeType(type);
      const badge = document.createElement('span');
      badge.className = 'type-badge';
      badge.textContent = label;
      container.append(badge);
    }
    const hero = document.getElementById('pokemonHero') || document.querySelector('.pokemon-hero');
    if (hero && types.length) hero.style.setProperty('--hero-color', cdTypeColors[cdNormalizeType(types[0])] || '#dc2626');
  }
  async function cdUpdateSelectedTypes(id, selected, form) {
    const request = ++cdTypeRequest;
    try {
      const [catalog, formTypes] = await Promise.all([cdGetCatalog(), cdGetFormTypes()]);
      if (request !== cdTypeRequest || currentId !== id || formSelect.value !== selected) return;
      const base = Array.isArray(catalog) ? catalog.find(p => Number(p.id) === Number(id)) : catalog[String(id)];
      const baseTypes = Array.isArray(base?.types) ? base.types : [];
      let types = baseTypes;
      let verified = baseTypes.length > 0;
      if (selected !== 'normal') {
        const key = `${Number(id)}--${selected}`;
        const formRecordTypes = Array.isArray(form?.types) ? form.types : null;
        const known = formTypes[key];
        if (Array.isArray(known) && known.length) types = known;
        else if (formRecordTypes?.length) types = formRecordTypes;
        else if (selected.endsWith('-gmax')) types = baseTypes;
        else { types = []; verified = false; }
      }
      cdPaintTypes(types, verified);
    } catch (e) {
      console.warn('ColorDex 0.8: não foi possível atualizar a tipagem', e);
      // Mantém a ficha utilizável se os dados externos estiverem indisponíveis.
    }
  }

  let currentId = null;

  function getCurrentId() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    return Number.isInteger(id) && id >= 1 && id <= 1025
      ? id : 1;
  }

  function getNormalSprite(id, shiny) {
    if (shiny) {
      return `../assets/pokemon/v06-auditoria/shiny/normais/${String(id).padStart(4, "0")}.png`;
    }

    return `../assets/pokemon/normal/${String(id).padStart(3, "0")}.png`;
  }

  function updateVariantProgress() {
    const progressValue =
      document.getElementById("variantProgressValue");

    const progressFill =
      document.getElementById("variantProgressFill");

    const progressTrack =
      document.getElementById("variantProgressTrack");

    const progressMessage =
      document.getElementById("variantProgressMessage");

    if (
      !progressValue ||
      !progressFill ||
      !progressTrack ||
      !progressMessage ||
      !currentId
    ) {
      return;
    }

    const form = formSelect.value;
    const shiny = shinyToggle.checked;

    let saveKey;

    if (form === "normal" && !shiny) {
      saveKey =
        `colordex_paint_${String(currentId).padStart(3, "0")}`;
    } else {
      saveKey =
        `colordex_paint_v06_${currentId}:${form}:${shiny ? "shiny" : "normal"}`;
    }

    let progress = 0;

    try {
      const saved = JSON.parse(
        localStorage.getItem(saveKey) || "null"
      );

      if (saved && Number.isFinite(Number(saved.progress))) {
        progress = Math.max(
          0,
          Math.min(100, Number(saved.progress))
        );
      }
    } catch (error) {
      console.warn(
        "Não foi possível ler o progresso da variante:",
        error
      );
    }

    progressValue.textContent = `${progress}%`;
    progressFill.style.width = `${progress}%`;
    // A silhueta depende da conclusão da variante selecionada.
    let completed = false;

    try {
      if (form === "normal" && !shiny) {
        const list = JSON.parse(
          localStorage.getItem("colordex_completed") || "[]"
        );

        completed = Array.isArray(list) &&
          list.some(id => Number(id) === currentId) &&
          progress >= 100;
      } else {
        const list = JSON.parse(
          localStorage.getItem("colordex_completed_v06") || "[]"
        );

        const identity =
          `${currentId}:${form}:${shiny ? "shiny" : "normal"}`;

        completed = Array.isArray(list) &&
          list.includes(identity);
      }
    } catch (error) {
      console.warn("Erro ao verificar conclusão:", error);
    }

    // Reconhecer também pinturas com 100% salvo.
    const isFinished = completed || progress >= 100;

    // Revelar o sprite quando a pintura estiver concluída.
    sprite.style.filter = isFinished
      ? "none"
      : "brightness(0)";
    progressTrack.setAttribute(
      "aria-valuenow",
      String(progress)
    );

    if (isFinished) {
    progressMessage.textContent =
      "✓ Pintura concluída!";
  } else if (progress > 0) {
    progressMessage.textContent =
      "Pintura em andamento.";
  } else {
    progressMessage.textContent =
      "Pintura ainda não iniciada.";
  }
  }
  function updateVariant() {
    const id = currentId;
    if (!id) return;

    const selected = formSelect.value;
    const shiny = shinyToggle.checked;

    const form = (formsData[String(id)] || [])
      .find(item => item.id === selected);

    if (selected !== "normal" && !form) {
      return;
    }

    if (form && shiny && !form.shiny) {
      shinyToggle.checked = false;
    }

    const useShiny = shinyToggle.checked;

    const image = form
      ? (useShiny ? form.shiny : form.sprite)
      : getNormalSprite(id, useShiny);

    sprite.src = image;

    const name = document.getElementById("pokemonName");
    sprite.alt = name
      ? `${name.textContent} - ${selected}${useShiny ? " Shiny" : ""}`
      : "Sprite Pokémon";

    const params = new URLSearchParams({
      id: String(id),
      form: selected,
      shiny: String(useShiny)
    });

    paintButton.href = `painting.html?${params.toString()}`;
    updateVariantProgress();
    cdUpdateSelectedTypes(id, selected, form);
    if (status) {
      status.textContent = useShiny
        ? "✨ Versão Shiny selecionada."
        : selected === "normal"
          ? "Forma normal selecionada."
          : "Forma alternativa selecionada.";
    }
  }

  function updatePokemon(id) {
    currentId = id;

    const forms = formsData[String(id)] || [];

    formSelect.replaceChildren();

    const normal = new Option("Forma normal", "normal");
    formSelect.add(normal);

    for (const form of forms) {
      formSelect.add(new Option(form.nome, form.id));
    }

    formSelect.value = "normal";
    shinyToggle.checked = false;
    shinyToggle.disabled = false;

    updateVariant();
  }

  formSelect.addEventListener("change", () => {
    const id = currentId;
    const form = (formsData[String(id)] || [])
      .find(item => item.id === formSelect.value);

    shinyToggle.disabled = Boolean(form && !form.shiny);

    if (shinyToggle.disabled) {
      shinyToggle.checked = false;
    }

    updateVariant();
  });

  shinyToggle.addEventListener("change", updateVariant);

  fetch("../data/pokemon-forms-v06.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Não foi possível carregar as formas.");
      }
      return response.json();
    })
    .then(data => {
      formsData = data;
      updatePokemon(getCurrentId());
    })
    .catch(error => {
      console.error("Erro nas formas:", error);
      if (status) status.textContent = "Erro ao carregar formas.";
    });

  // Permite atualizar o seletor quando o Pokémon muda
  // pelas setas da ficha.
  window.ColorDexVariants = {
    updatePokemon
  };
})();
