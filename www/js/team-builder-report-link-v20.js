
(() => {
  'use strict';

  function compact() {
    const cards = document.querySelectorAll('#teamsList .team-card');

    cards.forEach((card, index) => {
      const panel = card.querySelector('.cd-analysis:not(.cd-analysis-compact)');
      if (!panel) return;

      const summary = panel.querySelector('.cd-analysis-summary');
      const note = panel.querySelector('.cd-analysis-note');

      const compactPanel = document.createElement('section');
      compactPanel.className = 'cd-analysis cd-analysis-compact';

      const heading = document.createElement('h4');
      heading.textContent = 'Análise de tipos';
      compactPanel.append(heading);

      if (summary) compactPanel.append(summary);
      else if (note) compactPanel.append(note);

      const button = document.createElement('a');
      button.className = 'cd-analysis-report-link';
      button.textContent = 'Ver relatório completo ↗';

      try {
        const teams = JSON.parse(
          localStorage.getItem('colordex_teams_v07') || '[]'
        );
        if (Array.isArray(teams) && teams[index]) {
          button.href = 'team-report.html?team=' +
            encodeURIComponent(teams[index].id);
        } else {
          button.href = 'team-builder.html';
        }
      } catch {
        button.href = 'team-builder.html';
      }

      compactPanel.append(button);
      panel.replaceWith(compactPanel);
    });
  }

  let pending = false;

  function schedule() {
    if (pending) return;
    pending = true;

    requestAnimationFrame(() => {
      pending = false;
      compact();
    });
  }

  function start() {
    const list = document.getElementById('teamsList');
    if (!list) return;

    new MutationObserver(schedule).observe(list, {
      childList: true,
      subtree: true
    });

    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
