
/*
 * ColorDex v0.6
 * Identificadores de pinturas
 *
 * Preserva os salvamentos da v0.5.
 */

const ColorDexIdentity = {
  normalizeForm(form) {
    const value = String(form || "normal")
      .trim()
      .toLowerCase();

    if (!/^[a-z0-9_-]+$/.test(value)) {
      return "normal";
    }

    return value;
  },

  getIdentity(id, form = "normal", shiny = false) {
    const number = Number(id);

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 1025
    ) {
      throw new Error("ID de Pokémon inválido");
    }

    const normalizedForm = this.normalizeForm(form);

    return {
      id: number,
      form: normalizedForm,
      shiny: Boolean(shiny),
      key: `${number}:${normalizedForm}:${
        shiny ? "shiny" : "normal"
      }`
    };
  },

  getSaveKey(id, form = "normal", shiny = false) {
    const identity = this.getIdentity(id, form, shiny);

    // Compatibilidade com a v0.5.
    if (
      identity.form === "normal" &&
      !identity.shiny
    ) {
      const number = String(id).padStart(3, "0");
      return `colordex_paint_${number}`;
    }

    return `colordex_paint_v06_${identity.key}`;
  },

  getCompletedKey(id, form = "normal", shiny = false) {
    return this.getIdentity(id, form, shiny).key;
  }
};

window.ColorDexIdentity = ColorDexIdentity;
