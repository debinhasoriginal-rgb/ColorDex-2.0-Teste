
const TOTAL_POKEMON = 1025;

// BOTÕES DA TELA INICIAL
const playBtn = document.getElementById("playBtn");
const collectionBtn = document.getElementById("collectionBtn");

// ELEMENTOS DA JANELA
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

const closeModal = document.getElementById("closeModal");
const modalOk = document.getElementById("modalOk");

// ELEMENTOS DO PROGRESSO
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");

// BUSCAR POKÉMON CONCLUÍDOS

function getCompletedPokemon() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("colordex_completed") || "[]"
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    return [...new Set(saved.map(Number))].filter(id => {
      if (!Number.isInteger(id) ||
          id < 1 ||
          id > TOTAL_POKEMON) {
        return false;
      }

      // Verifica a conclusão da pintura normal.
      const key = `colordex_paint_${String(id).padStart(3, "0")}`;
      const raw = localStorage.getItem(key);

      if (!raw) return false;

      try {
        const painting = JSON.parse(raw);
        return Number(painting.progress) >= 100;
      } catch {
        return false;
      }
    });

  } catch (error) {
    console.error("Erro ao carregar progresso:", error);
    return [];
  }
}


// ATUALIZAR BARRA DE PROGRESSO
function updateProgress() {
  const completed = getCompletedPokemon().length;

  const percent = Math.round(
    (completed / TOTAL_POKEMON) * 100
  );

  progressText.textContent =
    `${completed} / ${TOTAL_POKEMON}`;

  progressFill.style.width = `${percent}%`;

  progressPercent.textContent =
    `${percent}% concluído`;
}

// ABRIR JANELA
function showModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;

  modal.classList.remove("hidden");
  closeModal.focus();
}

// FECHAR JANELA
function hideModal() {
  modal.classList.add("hidden");
}

// BOTÃO JOGAR
// Abre a Pokédex de Kanto
playBtn.addEventListener("click", () => {
  window.location.href = "html/pokedex.html";
});

// BOTÃO MINHA COLEÇÃO
collectionBtn.addEventListener("click", () => {
  const completed = getCompletedPokemon().length;

  showModal(
    "MINHA COLEÇÃO",
    `Você já coloriu ${completed} de ${TOTAL_POKEMON} Pokémon!`
  );
});

// BOTÃO FECHAR
closeModal.addEventListener("click", hideModal);

// BOTÃO ENTENDIDO
modalOk.addEventListener("click", hideModal);

// FECHAR CLICANDO FORA DA JANELA
modal.addEventListener("click", event => {
  if (event.target === modal) {
    hideModal();
  }
});

// FECHAR PRESSIONANDO ESC
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hideModal();
  }
});

// ATUALIZAR PROGRESSO AO ABRIR A PÁGINA
updateProgress();

// ATUALIZAR PROGRESSO AO VOLTAR PARA A TELA
window.addEventListener("pageshow", updateProgress);
