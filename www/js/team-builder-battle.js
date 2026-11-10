/* ColorDex 0.7.3C — Cristais Z e Dynamax/Gigantamax */
(() => {
  "use strict";
  const KEY = "colordex_teams_v07";
  const TYPES = {
    normal: ["Normalium Z", "Breakneck Blitz"], fire: ["Firium Z", "Inferno Overdrive"],
    water: ["Waterium Z", "Hydro Vortex"], electric: ["Electrium Z", "Gigavolt Havoc"],
    grass: ["Grassium Z", "Bloom Doom"], ice: ["Icium Z", "Subzero Slammer"],
    fighting: ["Fightinium Z", "All-Out Pummeling"], poison: ["Poisonium Z", "Acid Downpour"],
    ground: ["Groundium Z", "Tectonic Rage"], flying: ["Flyinium Z", "Supersonic Skystrike"],
    psychic: ["Psychium Z", "Shattered Psyche"], bug: ["Buginium Z", "Savage Spin-Out"],
    rock: ["Rockium Z", "Continental Crush"], ghost: ["Ghostium Z", "Never-Ending Nightmare"],
    dragon: ["Dragonium Z", "Devastating Drake"], dark: ["Darkinium Z", "Black Hole Eclipse"],
    steel: ["Steelium Z", "Corkscrew Crash"], fairy: ["Fairium Z", "Twinkle Tackle"]
  };
  const Z_VERSIONS = new Set(["sun-moon", "ultra-sun-ultra-moon"]);
  const DMAX_VERSIONS = new Set(["sword-shield"]);
  const read = () => {
    try { const data = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(data) ? data : []; }
    catch { return []; }
  };
  const find = (teams, teamId, index) => teams.find(t => t.id === teamId)?.pokemon?.[index];
  const norm = s => String(s || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  const cache = new Map();
  async function fetchJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.json();
  }
  async function moveMetadata(id) {
    if (!cache.has(id)) {
      cache.set(id, (async () => {
        const number = String(id).padStart(3, "0");
        const [versions, catalog] = await Promise.all([
          fetchJSON(`../data/pokemon-moves/${number}.json`),
          fetchJSON("../data/pokemon-form-moves/move-catalog.json").catch(() => ({}))
        ]);
        const map = new Map();
        for (const move of Object.values(catalog)) if (Number(move?.id) > 0) map.set(Number(move.id), move);
        for (const moves of Object.values(versions)) {
          if (!Array.isArray(moves)) continue;
          for (const move of moves) {
            if (Number(move?.id) > 0) map.set(Number(move.id), move);
          }
        }
        return map;
      })().catch(e => { cache.delete(id); throw e; }));
    }
    return cache.get(id);
  }
  async function getCompatibleCrystals(pokemon) {
    if (!pokemon?.id || !Array.isArray(pokemon.moves)) return [];
    const metadata = await moveMetadata(pokemon.id);
    const groups = new Map();
    for (const selected of pokemon.moves.slice(0, 4)) {
      const move = metadata.get(Number(selected.id));
      if (!move) continue;
      const type = norm(move.type), category = norm(move.category);
      if (!TYPES[type]) continue;
      if (!groups.has(type)) groups.set(type, { id: `${type}-z`, name: TYPES[type][0], type, moves: [] });
      groups.get(type).moves.push({ id: Number(move.id), name: move.name || selected.name,
        effect: category === "status" ? "Z-Status (efeito especial)" : TYPES[type][1] });
    }
    return [...groups.values()];
  }
  async function getGmaxOptions(pokemon) {
    const forms = await fetchJSON("../data/pokemon-forms-v06.json");
    const options = (forms[String(pokemon.id)] || []).filter(f => /-gmax$/.test(f.id));
    return options.map(f => ({...f, unlocked:
      pokemon.form === "normal" &&
      !!window.ColorDexMega?.isPaintingComplete(pokemon.id, "normal", false) &&
      !!window.ColorDexMega?.isPaintingComplete(pokemon.id, f.id, false)
    }));
  }
  function save(teamId, slotIndex, original, update) {
    const teams = read(), current = find(teams, teamId, slotIndex);
    if (!current || current.id !== original.id || current.form !== original.form ||
        Boolean(current.shiny) !== Boolean(original.shiny)) {
      alert("O Pokémon deste slot mudou. Abra o seletor novamente."); return false;
    }
    if (update.zCrystal && (current.megaForm || current.dynamaxMode)) {
      alert("Remova a Mega ou Dynamax antes de equipar um cristal Z."); return false;
    }
    if (update.dynamaxMode && (current.megaForm || current.zCrystal)) {
      alert("Remova a Mega ou o cristal Z antes de ativar Dynamax."); return false;
    }
    if (Object.hasOwn(update, "zCrystal")) {
      if (update.zCrystal === null) {
        delete current.zCrystal;
      } else if (update.zCrystal) {
        current.zCrystal = update.zCrystal;
      }
    }
    if (update.dynamaxMode === null) { delete current.dynamaxMode; delete current.gmaxForm; }
    else if (update.dynamaxMode) {
      current.dynamaxMode = update.dynamaxMode;
      if (update.gmaxForm) current.gmaxForm = update.gmaxForm;
      else delete current.gmaxForm;
    }
    try { localStorage.setItem(KEY, JSON.stringify(teams)); }
    catch (e) { alert("Falha ao salvar a configuração."); return false; }
    window.dispatchEvent(new Event("colordex-teams-updated"));
    return true;
  }
  async function openSelector(teamId, slotIndex, mode = "z") {
    if (!["z", "dynamax"].includes(mode)) return;
    const pokemon = find(read(), teamId, slotIndex);
    if (!pokemon) return;
    document.getElementById("battleSelectorOverlay")?.remove();
    const overlay = document.createElement("div"); overlay.id = "battleSelectorOverlay"; overlay.className = "battle-overlay";
    const modal = document.createElement("section"); modal.className = "battle-modal";
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    const title = document.createElement("h2"); title.textContent = `${mode === "z" ? "💎 Z-Moves" : "✨ Dynamax / Gigantamax"} — ${pokemon.name || `#${pokemon.id}`}`;
    const info = document.createElement("p");
    info.textContent = "Mecânicas disponíveis independentemente da versão do jogo. Apenas uma pode ficar ativa por Pokémon.";
    const content = document.createElement("div"); content.textContent = "Carregando opções...";
    const close = () => { overlay.remove(); document.removeEventListener("keydown", onEsc); };
    const closeBtn = document.createElement("button"); closeBtn.type = "button"; closeBtn.textContent = "Fechar";
    closeBtn.className = "battle-close"; closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    const onEsc = e => { if (e.key === "Escape") { close(); document.removeEventListener("keydown", onEsc); } };
    document.addEventListener("keydown", onEsc);
    modal.append(title, info, content, closeBtn); overlay.appendChild(modal); document.body.appendChild(overlay);
    function addButton(parent, label, action, disabled = false, description = "") {
      const button = document.createElement("button"); button.type = "button";
      button.className = "battle-option"; button.disabled = disabled;
      const strong = document.createElement("strong"); strong.textContent = label;
      button.appendChild(strong);
      if (description) { const small = document.createElement("small"); small.textContent = description; button.appendChild(small); }
      button.addEventListener("click", async () => {
        try { if (await action()) close(); }
        catch(e) { console.error(e); alert("Não foi possível concluir a operação."); }
      });
      parent.appendChild(button);
      return button;
    }
    try {
      content.replaceChildren();
      const zTitle = document.createElement("h3"); zTitle.textContent = "Cristais Z"; content.append(zTitle);
      if (mode === "z") {
        const crystals = await getCompatibleCrystals(pokemon);
        if (!crystals.length) { const p = document.createElement("p"); p.textContent = "Nenhum cristal compatível com os movimentos selecionados."; content.append(p); }
        for (const crystal of crystals) {
          const desc = crystal.moves.map(m => `${m.name}: ${m.effect}`).join(" • ");
          addButton(content, `${pokemon.zCrystal === crystal.id ? "✓ " : ""}${crystal.name}`, async () => {
            const current = find(read(), teamId, slotIndex);
            const valid = await getCompatibleCrystals(current);
            if (!valid.some(c => c.id === crystal.id)) { alert("O moveset mudou. Abra o seletor novamente."); return false; }
            return save(teamId, slotIndex, pokemon, { zCrystal: crystal.id });
          }, !!(pokemon.megaForm || pokemon.dynamaxMode), desc);
        }
      }
      addButton(content, "Remover cristal Z", () => save(teamId, slotIndex, pokemon, {zCrystal: null}), !pokemon.zCrystal);
      const dTitle = document.createElement("h3"); dTitle.textContent = "Dynamax / Gigantamax"; content.append(dTitle);
      if (mode === "dynamax") {
        addButton(content, "Dynamax", () => save(teamId, slotIndex, pokemon, {dynamaxMode: "dynamax"}),
          !!(pokemon.megaForm || pokemon.zCrystal), "Transformação padrão (sem G-Max Move exclusivo)");
        const options = pokemon.form === "normal" ? await getGmaxOptions(pokemon) : [];
        for (const form of options) {
          addButton(content, `Gigantamax — ${form.nome}`, async () => {
            const current = find(read(), teamId, slotIndex);
            const available = await getGmaxOptions(current);
            if (!available.some(o => o.id === form.id && o.unlocked)) { alert("A pintura Gigantamax ainda não foi concluída."); return false; }
            return save(teamId, slotIndex, pokemon, {dynamaxMode: "gmax", gmaxForm: form.id});
          }, !form.unlocked || !!(pokemon.megaForm || pokemon.zCrystal),
          form.unlocked ? "Pinturas concluídas" : "🔒 Requer forma normal e Gigantamax pintadas");
        }
      }
      addButton(content, "Desativar Dynamax / Gigantamax", () => save(teamId, slotIndex, pokemon, {dynamaxMode: null}), !pokemon.dynamaxMode);
      const note = document.createElement("p"); note.className = "battle-note";
      note.textContent = "Cristais exclusivos e efeitos detalhados dos Max/G-Max Moves ainda não estão implementados. Não é possível combinar Mega, Z-Move e Dynamax no mesmo Pokémon.";
      content.append(note);
    } catch (error) {
      console.error("Erro no seletor de batalha:", error);
      content.textContent = "Falha ao carregar dados. Confira os arquivos de movimentos e formas no servidor.";
    }
  }
  window.ColorDexBattle = { openSelector, getCompatibleCrystals, getGmaxOptions };
})();
