/* ColorDex 0.7.4 — análise de tipos. Não modifica dados salvos. */
(() => {
  'use strict';
  const TYPES = ['Normal','Fogo','Água','Elétrico','Planta','Gelo','Lutador','Venenoso','Terra','Voador','Psíquico','Inseto','Pedra','Fantasma','Dragão','Sombrio','Aço','Fada'];
  const WEAK = {
    Normal:['Pedra','Aço'], Fogo:['Fogo','Água','Pedra','Dragão'], Água:['Água','Planta','Dragão'],
    Elétrico:['Elétrico','Planta','Dragão'], Planta:['Fogo','Planta','Venenoso','Voador','Inseto','Dragão','Aço'],
    Gelo:['Fogo','Água','Gelo','Aço'], Lutador:['Venenoso','Voador','Psíquico','Inseto','Fada'],
    Venenoso:['Venenoso','Terra','Pedra','Fantasma'], Terra:['Planta','Inseto'],
    Voador:['Elétrico','Pedra','Aço'], Psíquico:['Psíquico','Aço'],
    Inseto:['Fogo','Lutador','Venenoso','Voador','Fantasma','Aço','Fada'],
    Pedra:['Lutador','Terra','Aço'], Fantasma:['Sombrio'], Dragão:['Aço'],
    Sombrio:['Lutador','Sombrio','Fada'], Aço:['Fogo','Água','Elétrico','Aço'], Fada:['Fogo','Venenoso','Aço']
  };
  const STRONG = {
    Normal:[], Fogo:['Planta','Gelo','Inseto','Aço'], Água:['Fogo','Terra','Pedra'],
    Elétrico:['Água','Voador'], Planta:['Água','Terra','Pedra'], Gelo:['Planta','Terra','Voador','Dragão'],
    Lutador:['Normal','Gelo','Pedra','Sombrio','Aço'], Venenoso:['Planta','Fada'],
    Terra:['Fogo','Elétrico','Venenoso','Pedra','Aço'], Voador:['Planta','Lutador','Inseto'],
    Psíquico:['Lutador','Venenoso'], Inseto:['Planta','Psíquico','Sombrio'],
    Pedra:['Fogo','Gelo','Voador','Inseto'], Fantasma:['Psíquico','Fantasma'],
    Dragão:['Dragão'], Sombrio:['Psíquico','Fantasma'], Aço:['Gelo','Pedra','Fada'],
    Fada:['Lutador','Dragão','Sombrio']
  };
  const IMMUNE = {Normal:['Fantasma'], Elétrico:['Terra'], Lutador:['Fantasma'], Venenoso:['Aço'], Terra:['Voador'], Psíquico:['Sombrio'], Fantasma:['Normal'], Dragão:['Fada']};
  const ALIASES = {
    normal:'Normal',fire:'Fogo',fogo:'Fogo',water:'Água',agua:'Água',água:'Água',electric:'Elétrico',eletrico:'Elétrico',elétrico:'Elétrico',grass:'Planta',planta:'Planta',ice:'Gelo',gelo:'Gelo',fighting:'Lutador',lutador:'Lutador',poison:'Venenoso',venenoso:'Venenoso',ground:'Terra',terra:'Terra',flying:'Voador',voador:'Voador',psychic:'Psíquico',psiquico:'Psíquico',psíquico:'Psíquico',bug:'Inseto',inseto:'Inseto',rock:'Pedra',pedra:'Pedra',ghost:'Fantasma',fantasma:'Fantasma',dragon:'Dragão',dragao:'Dragão',dragão:'Dragão',dark:'Sombrio',sombrio:'Sombrio',steel:'Aço',aco:'Aço',aço:'Aço',fairy:'Fada',fada:'Fada'
  };
  const normalize = t => ALIASES[String(t || '').trim().toLowerCase()] || null;
  function multiplier(attack, defending) {
    return defending.reduce((value, type) => {
      if ((IMMUNE[attack] || []).includes(type)) return 0;
      if ((STRONG[attack] || []).includes(type)) return value * 2;
      if ((WEAK[attack] || []).includes(type)) return value / 2;
      return value;
    }, 1);
  }
  let catalogPromise;
  async function getCatalog() {
    if (!catalogPromise) catalogPromise = fetch('../data/pokemon-data.json')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Formato de dados inesperado');
        return new Map(data.map(p => [Number(p.id), p]));
      }).catch(e => { catalogPromise = null; throw e; });
    return catalogPromise;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function getMembers(team, catalog, formTypes) {
    const members = [];
    const warnings = [];
    for (const p of (team.pokemon || []).filter(Boolean)) {
      const base = catalog.get(Number(p.id));
      if (!base) { warnings.push(`#${p.id}: dados não encontrados`); continue; }
      const baseTypes = (base.types || []).map(normalize);
      if (!baseTypes.length || baseTypes.some(t => !t)) {
        warnings.push(`${p.name || base.name}: tipo desconhecido`); continue;
      }
      const form = p.megaForm || p.form || 'normal';
      let types = baseTypes;
      if (form !== 'normal') {
        const key = `${Number(p.id)}--${form}`;
        const verified = formTypes[key];
        // Gigantamax não altera os tipos da espécie; formas desconhecidas não são presumidas.
        if (Array.isArray(verified) && verified.length) {
          types = verified.map(normalize);
        } else if (String(form).endsWith('-gmax')) {
          types = baseTypes;
        } else {
          warnings.push(`${p.name || base.name}: forma especial não verificada (${form})`);
          continue;
        }
      }
      if (types.some(t => !t)) {
        warnings.push(`${p.name || base.name}: tipagem de forma inválida (${form})`);
        continue;
      }
      members.push({name:p.name || base.name, types});
    }
    return {members,warnings};
  }
  function renderPanel(team, catalog, formTypes) {
    const panel = element('section','cd-analysis');
    const header = element('div','cd-analysis-header');
    header.append(element('h4','', 'Análise de tipos'), element('span','cd-analysis-subtitle','ColorDex 0.7.4'));
    panel.append(header);
    const {members,warnings} = getMembers(team,catalog,formTypes);
    if (!members.length) {
      panel.append(element('p','cd-analysis-note', warnings.length ? 'Não há tipos verificáveis neste time.' : 'Adicione Pokémon para visualizar a análise.'));
    } else {
      const matrix = TYPES.map(type => {
        const values = members.map(m => multiplier(type,m.types));
        return {type,weak:values.filter(v=>v>1).length,resist:values.filter(v=>v>0&&v<1).length,immune:values.filter(v=>v===0).length,neutral:values.filter(v=>v===1).length};
      });
      const headline = element('div','cd-analysis-summary');
      for (const [number,label,kind] of [
        [matrix.filter(x=>x.weak>0).length,'Tipos que ameaçam','danger'],
        [matrix.filter(x=>x.resist>0).length,'Tipos resistidos','good'],
        [matrix.filter(x=>x.immune>0).length,'Tipos imunes','cool']
      ]) {
        const box=element('div','cd-analysis-stat '+kind);
        box.append(element('strong','',String(number)),element('span','',label));headline.append(box);
      }
      panel.append(headline);
      const tableWrap=element('div','cd-analysis-scroll');
      const table=element('table','cd-analysis-table');
      const thead=element('thead'); const tr=element('tr');
      ['Tipo atacante','Fracos','Resistem','Imunes'].forEach(x=>tr.append(element('th','',x)));
      thead.append(tr); table.append(thead);
      const tbody=element('tbody');
      matrix.forEach(x=>{
        const row=element('tr');
        row.append(element('td','cd-type',x.type),element('td',x.weak?'cd-danger':'',String(x.weak)),element('td',x.resist?'cd-good':'',String(x.resist)),element('td',x.immune?'cd-cool':'',String(x.immune)));
        tbody.append(row);
      });
      table.append(tbody);tableWrap.append(table);
      const details=element('details','cd-analysis-details');
      details.append(element('summary','', 'Ver matriz defensiva dos 18 tipos'),tableWrap);
      panel.append(details);
      const covered=TYPES.filter(target=>members.some(m=>m.types.some(t=>multiplier(t,[target])>1)));
      const uncovered=TYPES.filter(target=>!covered.includes(target));
      const offense=element('div','cd-analysis-offense');
      offense.append(element('h5','','Cobertura ofensiva potencial (STAB)'),element('p','',`${covered.length} de 18 tipos atingidos com vantagem pelos tipos naturais dos Pokémon.`));
      const chips=element('div','cd-analysis-chips');
      uncovered.forEach(t=>chips.append(element('span','cd-analysis-chip',t)));
      offense.append(element('p','cd-analysis-note','Sem vantagem de STAB contra:'),chips);
      panel.append(offense);
    }
    if (warnings.length) {
      panel.append(element('p','cd-analysis-warning','Atenção: '+warnings.join(' • ')+'. Esses Pokémon não foram incluídos nos cálculos para evitar resultados incorretos.'));
    }
    panel.append(element('p','cd-analysis-footnote','Cálculo baseado apenas em tipos. Habilidades, itens, clima, Terastal, movimentos reais e alterações temporárias de tipo não são considerados.'));
    return panel;
  }
  window.ColorDexTeamAnalysis = {
    renderPanel,
    getCatalog,
    getFormTypes: () => getFormTypes()
  };

  let formTypesPromise;
  async function getFormTypes() {
    if (!formTypesPromise) formTypesPromise = fetch('../data/pokemon-form-types-v074.json')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(e => { formTypesPromise = null; throw e; });
    return formTypesPromise;
  }
  let run = 0;
  async function refresh() {
    const current=++run;
    const list=document.getElementById('teamsList');
    if (!list) return;
    let catalog;
    try { catalog=await getCatalog(); }
    catch(e) { console.warn('ColorDex Analysis:',e); return; }
    let formTypes;
    try { formTypes = await getFormTypes(); }
    catch(e) { console.warn('ColorDex Analysis: formas indisponíveis', e); formTypes = {}; }
    if (current!==run) return;
    let teams=[];
    try { teams=JSON.parse(localStorage.getItem('colordex_teams_v07') || '[]'); }
    catch(e) { console.warn('ColorDex Analysis: times inválidos',e); return; }
    if (!Array.isArray(teams)) return;
    const cards=[...list.querySelectorAll('.team-card')];
    cards.forEach((card,i)=>{
      card.querySelectorAll('.cd-analysis').forEach(node=>node.remove());
      if (teams[i]) card.append(renderPanel(teams[i],catalog,formTypes));
    });
  }
  let pendingFrame = null;

  function schedule() {
    if (pendingFrame !== null) return;

    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      refresh();
    });
  }
  function start() {
    const list=document.getElementById('teamsList');
    if (!list) return;
    // Observe apenas alterações nos cartões, não o próprio painel.
    const observer=new MutationObserver(records=>{
      if (records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1 && (n.matches?.('.team-card') || n.querySelector?.('.team-card'))))) schedule();
    });
    observer.observe(list,{childList:true});
    window.addEventListener('colordex-teams-updated',schedule);
    window.addEventListener('load',schedule);
    schedule();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
