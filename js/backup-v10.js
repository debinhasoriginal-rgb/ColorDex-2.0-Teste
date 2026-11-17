
(() => {
  "use strict";

  const PREFIXES = [
    "colordex_",
    "colordex-",
    "colordex."
  ];

  const isColorDexKey = key =>
    PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix));

  function collect() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isColorDexKey(key)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }

  function download(data, filename) {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function exportProgress() {
    const data = collect();
    const backup = {
      app: "ColorDex",
      format: "progress-backup-v1",
      exportedAt: new Date().toISOString(),
      entries: data
    };
    const date = new Date().toISOString().slice(0, 10);
    download(backup, `ColorDex-backup-${date}.json`);
  }

  function validateBackup(backup) {
    if (!backup ||
        backup.app !== "ColorDex" ||
        backup.format !== "progress-backup-v1" ||
        !backup.entries ||
        typeof backup.entries !== "object" ||
        Array.isArray(backup.entries)) {
      throw new Error("Arquivo não é um backup válido da ColorDex.");
    }

    const entries = Object.entries(backup.entries);
    if (entries.length > 20000) {
      throw new Error("Backup contém entradas demais.");
    }

    for (const [key, value] of entries) {
      if (!isColorDexKey(key) || typeof value !== "string") {
        throw new Error("Backup contém dados incompatíveis.");
      }
    }
    return entries;
  }

  async function importProgress(file) {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      alert("Backup muito grande para importar.");
      return;
    }

    try {
      const backup = JSON.parse(await file.text());
      const entries = validateBackup(backup);

      if (!confirm(
        `Restaurar ${entries.length} registros da ColorDex?\n\n` +
        "Os registros existentes com as mesmas chaves serão substituídos. " +
        "Os demais serão mantidos."
      )) return;

      // Snapshot local de recuperação antes da importação.
      const previous = collect();
      const changedKeys = entries.map(([key]) => key);

      try {
        for (const [key, value] of entries) {
          localStorage.setItem(key, value);
        }
      } catch (error) {
        // Reverte apenas as chaves que a importação tentou alterar.
        for (const key of changedKeys) {
          try {
            if (Object.prototype.hasOwnProperty.call(previous, key)) {
              localStorage.setItem(key, previous[key]);
            } else {
              localStorage.removeItem(key);
            }
          } catch (_) {}
        }
        throw error;
      }

      alert("Progresso restaurado! A página será atualizada.");
      location.reload();
    } catch (error) {
      alert("Não foi possível importar: " + error.message);
    }
  }

  function init() {
    if (document.querySelector(".cd-backup-launcher")) return;

    const launcher = document.createElement("button");
    launcher.hidden = true;
    launcher.className = "cd-backup-launcher";
    launcher.type = "button";
    launcher.textContent = "💾 BACKUP";
    launcher.setAttribute("aria-label", "Gerenciar backup da ColorDex");
    document.body.append(launcher);

    launcher.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "cd-backup-dialog";

      const panel = document.createElement("section");
      panel.className = "cd-backup-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Backup da ColorDex");

      const heading = document.createElement("h2");
      heading.textContent = "Backup da ColorDex";

      const info = document.createElement("p");
      info.textContent =
        "Exporte seu progresso para um arquivo JSON. " +
        "Guarde esse arquivo para restaurar suas pinturas, " +
        "times e insígnias em outro dispositivo.";

      const actions = document.createElement("div");
      actions.className = "cd-backup-actions";

      const exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.textContent = "⬇ Exportar progresso";
      exportButton.onclick = exportProgress;

      const importButton = document.createElement("button");
      importButton.type = "button";
      importButton.textContent = "⬆ Importar progresso";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json,application/json";
      fileInput.hidden = true;
      importButton.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        importProgress(fileInput.files?.[0]);
      };

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.textContent = "Fechar";
      closeButton.onclick = () => overlay.remove();

      actions.append(exportButton, importButton, closeButton, fileInput);
      panel.append(heading, info, actions);
      overlay.append(panel);
      document.body.append(overlay);

      exportButton.focus();
      overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.remove();
      });
      overlay.addEventListener("keydown", event => {
        if (event.key === "Escape") overlay.remove();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
