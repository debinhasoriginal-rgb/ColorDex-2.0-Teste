let AVAILABLE_POKEMON = {};

const params = new URLSearchParams(window.location.search);

const pokemonId = Number(params.get("id"));
const number = String(pokemonId).padStart(3, "0");

const pokemonForm = ColorDexIdentity.normalizeForm(
  params.get("form")
);

const pokemonShiny = params.get("shiny") === "true";

const paintingIdentity = ColorDexIdentity.getIdentity(
  pokemonId,
  pokemonForm,
  pokemonShiny
);

const saveKey = ColorDexIdentity.getSaveKey(
  pokemonId,
  pokemonForm,
  pokemonShiny
);

function getPaintingSprite() {
  // Pokémon normal da v0.5
  if (pokemonForm === "normal" && !pokemonShiny) {
    return `../assets/pokemon/normal/${number}.png`;
  }

  // Pokémon normal Shiny
  if (pokemonForm === "normal" && pokemonShiny) {
    return `../assets/pokemon/v06-auditoria/shiny/normais/${String(pokemonId).padStart(4, "0")}.png`;
  }

  // Formas alternativas Shiny
  if (pokemonShiny) {
    return `../assets/pokemon/v06-auditoria/shiny/formas/${pokemonId}--${pokemonForm}.png`;
  }

  // Cinco formas especiais manuais
  const manualForms = new Set([
    "mega-zygarde",
    "armored-mewtwo",
    "shadow-mewtwo",
    "shadow-lugia",
    "primal-dialga"
  ]);

  if (manualForms.has(pokemonForm)) {
    return `../assets/pokemon/v06-auditoria/manuais/${pokemonForm}.png`;
  }

  // Demais formas alternativas
  return `../assets/pokemon/v06-auditoria/formas/${pokemonId}--${pokemonForm}.png`;
}

const canvas = document.getElementById("paintingCanvas");
const frame = document.getElementById("canvasFrame");
const ctx = canvas.getContext("2d");

const title = document.getElementById("pokemonTitle");
const statusText = document.getElementById("paintingStatus");
const statusBadge = document.getElementById("statusBadge");
const paletteElement = document.getElementById("palette");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const pixelCount = document.getElementById("pixelCount");

const zoomLabel = document.getElementById("zoomLabel");
const completionModal = document.getElementById("completionModal");
const gestureHint = document.getElementById("gestureHint");

const paintModeButton = document.getElementById("paintMode");
const moveModeButton = document.getElementById("moveMode");

const MIN_ZOOM = 4;
const MAX_ZOOM = 32;

let width = 0;
let height = 0;
let zoom = 8;
let offsetX = 0;
let offsetY = 0;
let viewWidth = 0;
let viewHeight = 0;
let deviceScale = 1;

let pixels = [];
let colors = [];
let painted = [];
let selectedColor = 0;
let totalPixels = 0;
let paintedCount = 0;
let completed = false;

let mode = "paint";
let spaceHeld = false;
let singleGesture = null;
let pinchGesture = null;

const pointers = new Map();

// Imagem interna: cada pixel do Pokémon ocupa
// exatamente um pixel, sem linhas ou bordas.
const spriteCanvas = document.createElement("canvas");
const spriteCtx = spriteCanvas.getContext("2d");

function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");
}

function getCompleted() {
  try {
    const list = JSON.parse(
      localStorage.getItem("colordex_completed") || "[]"
    );

    return Array.isArray(list) ? list.map(Number) : [];
  } catch {
    return [];
  }
}


function updateCompletionList(isComplete) {
  try {
    // Pinturas normais da v0.5:
    // preservar o sistema original.
    if (pokemonForm === "normal" && !pokemonShiny) {
      const list = getCompleted().filter(
        id => id !== pokemonId
      );

      if (isComplete) {
        list.push(pokemonId);
      }

      localStorage.setItem(
        "colordex_completed",
        JSON.stringify(list)
      );

      return;
    }

    // Pinturas da v0.6:
    // cada forma e Shiny possui uma identidade própria.
    const storageKey = "colordex_completed_v06";

    const saved = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    const list = (Array.isArray(saved) ? saved : [])
      .filter(key => key !== paintingIdentity.key);

    if (isComplete) {
      list.push(paintingIdentity.key);
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(list)
    );

  } catch (error) {
    console.error(
      "Erro ao atualizar coleção:",
      error
    );
  }
}


function saveProgress() {
  const progress = totalPixels
    ? Math.round((paintedCount / totalPixels) * 100)
    : 0;

  try {
    localStorage.setItem(saveKey, JSON.stringify({
      width,
      height,
      palette: colors,
      painted,
      progress
    }));
  } catch (error) {
    console.error("Erro ao salvar pintura:", error);
  }
}

function loadSavedProgress() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(saveKey) || "null"
    );

    if (!saved || !Array.isArray(saved.painted)) {
      return;
    }

    if (
      saved.width !== width ||
      saved.height !== height ||
      saved.palette?.join(",") !== colors.join(",") ||
      saved.painted.length !== pixels.length
    ) {
      return;
    }

    painted = saved.painted.map((value, index) =>
      value === true && pixels[index] !== -1
    );
  } catch (error) {
    console.error("Erro ao recuperar pintura:", error);
  }
}

function countPainted() {
  paintedCount = painted.reduce(
    (sum, value) => sum + (value ? 1 : 0),
    0
  );
}

function updateProgress() {
  const progress = totalPixels
    ? Math.round((paintedCount / totalPixels) * 100)
    : 0;

  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;

  pixelCount.textContent =
    `${paintedCount} / ${totalPixels} pixels`;

  if (completed) {
    statusText.textContent = "Pintura concluída!";
    statusBadge.textContent = "CONCLUÍDO";
  } else {
    statusBadge.textContent = "PINTANDO";

    statusText.textContent = paintedCount
      ? "Pintura em andamento"
      : "Pronto para colorir";
  }
}

function renderPalette() {
  const remaining = new Array(colors.length).fill(0);

  pixels.forEach((colorIndex, index) => {
    if (colorIndex >= 0 && !painted[index]) {
      remaining[colorIndex]++;
    }
  });

  paletteElement.innerHTML = "";

  colors.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-button";

    if (selectedColor === index) {
      button.classList.add("selected");
    }

    if (remaining[index] === 0) {
      button.classList.add("done");
    }

    const swatch = document.createElement("span");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = color;
    swatch.textContent = index + 1;

    const counter = document.createElement("span");
    counter.className = "color-remaining";

    counter.textContent = remaining[index] === 0
      ? "✓ Completo"
      : `${remaining[index]} restantes`;

    button.append(swatch, counter);

    button.addEventListener("click", () => {
      selectedColor = index;

      updateSpriteCanvas();
      draw();
      renderPalette();
    });

    paletteElement.appendChild(button);
  });
}

// Reconstrói o Pokémon em resolução original.
// Pixels pintados recebem sua cor real.
// Pixels não pintados ficam cinza-claro.
function updateSpriteCanvas() {
  if (!width || !height) return;

  const image = spriteCtx.createImageData(width, height);
  const data = image.data;

  for (let index = 0; index < pixels.length; index++) {
    const colorIndex = pixels[index];
    const position = index * 4;

    if (colorIndex === -1) {
      data[position + 3] = 0;
      continue;
    }

    const hex = painted[index]
    ? colors[colorIndex]
    : colorIndex === selectedColor
      ? "#e3e5ec"
      : "#8b90a0";

    data[position] = parseInt(hex.slice(1, 3), 16);
    data[position + 1] = parseInt(hex.slice(3, 5), 16);
    data[position + 2] = parseInt(hex.slice(5, 7), 16);
    data[position + 3] = 255;
  }

  spriteCtx.putImageData(image, 0, 0);
}

// Ajusta a resolução do canvas à tela.
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  viewWidth = rect.width;
  viewHeight = rect.height;

  if (!viewWidth || !viewHeight) return;

  deviceScale = Math.min(
    window.devicePixelRatio || 1,
    3
  );

  canvas.width = Math.round(viewWidth * deviceScale);
  canvas.height = Math.round(viewHeight * deviceScale);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;

  if (width && height) {
    clampOffsets();
    draw();
  }
}

function clampOffsets() {
  if (!width || !height) return;

  const imageWidth = width * zoom;
  const imageHeight = height * zoom;

  // COLORDEX 1.0.11
  // No celular, permite movimentar o desenho
  // mesmo quando ele é menor que a tela.
  if (window.matchMedia("(max-width: 700px)").matches) {
    const visibleMargin = 48;

    offsetX = Math.max(
      visibleMargin - imageWidth,
      Math.min(viewWidth - visibleMargin, offsetX)
    );

    offsetY = Math.max(
      visibleMargin - imageHeight,
      Math.min(viewHeight - visibleMargin, offsetY)
    );

    return;
  }

  // Comportamento original do desktop.
  if (imageWidth <= viewWidth) {
    offsetX = (viewWidth - imageWidth) / 2;
  } else {
    offsetX = Math.max(
      viewWidth - imageWidth,
      Math.min(0, offsetX)
    );
  }

  if (imageHeight <= viewHeight) {
    offsetY = (viewHeight - imageHeight) / 2;
  } else {
    offsetY = Math.max(
      viewHeight - imageHeight,
      Math.min(0, offsetY)
    );
  }
}

// Desenha a imagem inteira de uma vez.
// O navegador amplia os pixels sem interpolação.
function draw() {
  if (!width || !height || !viewWidth || !viewHeight) {
    return;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#242938";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width / viewWidth;
  const scaleY = canvas.height / viewHeight;

  ctx.save();

  // Alinha a imagem aos pixels físicos da tela.
  const left = Math.round(offsetX * scaleX);
  const top = Math.round(offsetY * scaleY);
  const right = Math.round(
    (offsetX + width * zoom) * scaleX
  );
  const bottom = Math.round(
    (offsetY + height * zoom) * scaleY
  );

  ctx.drawImage(
    spriteCanvas,
    left,
    top,
    right - left,
    bottom - top
  );

  // Números são desenhados por cima da imagem.
  // Não há grade nos pixels pintados.
  if (zoom >= 7) {
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#454955";

    const startX = Math.max(
      0,
      Math.floor(-offsetX / zoom)
    );

    const startY = Math.max(
      0,
      Math.floor(-offsetY / zoom)
    );

    const endX = Math.min(
      width,
      Math.ceil((viewWidth - offsetX) / zoom)
    );

    const endY = Math.min(
      height,
      Math.ceil((viewHeight - offsetY) / zoom)
    );

    ctx.font = `${Math.max(5, zoom * 0.55)}px Arial`;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = y * width + x;
        const colorIndex = pixels[index];

        if (colorIndex === -1 || painted[index]) {
          continue;
        }

        ctx.fillText(
          String(colorIndex + 1),
          offsetX + (x + 0.5) * zoom,
          offsetY + (y + 0.5) * zoom,
          zoom - 1
        );
      }
    }
  }

  ctx.restore();
  zoomLabel.textContent = `${zoom.toFixed(1)}×`;
}

// Amplia mantendo o ponto escolhido no lugar.
function setZoom(newZoom, anchorX, anchorY) {
  if (!width || !height) return;

  const oldZoom = zoom;

  zoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, newZoom)
  );

  const imageX = (anchorX - offsetX) / oldZoom;
  const imageY = (anchorY - offsetY) / oldZoom;

  offsetX = anchorX - imageX * zoom;
  offsetY = anchorY - imageY * zoom;

  clampOffsets();
  draw();
}

function fitPokemon() {
  if (!width || !height) return;

  const margin = 24;

  zoom = Math.max(
    MIN_ZOOM,
    Math.floor(
      Math.min(
        MAX_ZOOM,
        (viewWidth - margin * 2) / width,
        (viewHeight - margin * 2) / height
      )
    )
  );

  offsetX = (viewWidth - width * zoom) / 2;
  offsetY = (viewHeight - height * zoom) / 2;

  clampOffsets();
  draw();
}

function setMode(nextMode) {
  mode = nextMode;

  paintModeButton.classList.toggle(
    "active",
    mode === "paint"
  );

  moveModeButton.classList.toggle(
    "active",
    mode === "move"
  );

  paintModeButton.setAttribute(
    "aria-pressed",
    String(mode === "paint")
  );

  moveModeButton.setAttribute(
    "aria-pressed",
    String(mode === "move")
  );

  bombModeButton.classList.toggle(
    "active",
    mode === "bomb"
  );

  bombModeButton.setAttribute(
    "aria-pressed",
    String(mode === "bomb")
  );

  frame.classList.toggle(
    "bomb-active",
    mode === "bomb"
  );

  bombRadiusPanel.hidden = mode !== "bomb";

  frame.classList.toggle(
    "move-active",
    mode === "move"
  );

  gestureHint.textContent = mode === "bomb"
    ? "Toque para explodir cores. Arraste para mover. Dois dedos para zoom."
    : mode === "paint"
      ? "Um dedo pinta. Dois dedos ampliam e movimentam."
      : "Arraste com um dedo para mover. Use dois para zoom.";
}

function finishPainting() {
  if (completed) return;

  completed = true;

  updateCompletionList(true);
  saveProgress();
  updateProgress();
  updateSpriteCanvas();
  draw();
  renderPalette();

  document.getElementById("completedSprite").src =
    getPaintingSprite();

  document.getElementById("completionMessage").textContent =
    `${AVAILABLE_POKEMON[pokemonId]} foi registrado na sua ColorDex!`;

  completionModal.classList.remove("hidden");
}
function selectNextColor() {
  if (completed) return;

  for (let step = 1; step <= colors.length; step++) {
    const nextColor =
      (selectedColor + step) % colors.length;

    const hasRemaining = pixels.some(
      (colorIndex, index) =>
        colorIndex === nextColor && !painted[index]
    );

    if (hasRemaining) {
      selectedColor = nextColor;
      updateSpriteCanvas();
      draw();
      renderPalette();
      return;
    }
  }
}

/* COLORDEX 2.0 — BOMBA DE TINTA */
const bombModeButton = document.getElementById("bombMode");
let BOMB_RADIUS = 4;

const bombRadiusPanel = document.getElementById("bombRadiusPanel");
const bombRadiusLabel = document.getElementById("bombRadiusLabel");
const bombRadiusOptions = document.getElementById("bombRadius");

const bombRadiusNames = {
  2: "Pequena",
  4: "Média",
  6: "Grande",
  8: "Gigante"
};

function setBombRadius(radius) {
  if (!Object.hasOwn(bombRadiusNames, radius)) return;

  BOMB_RADIUS = radius;

  bombRadiusLabel.textContent =
    `${bombRadiusNames[radius]} · ${radius} pixels`;

  bombRadiusOptions.querySelectorAll("button").forEach(button => {
    const selected = Number(button.dataset.radius) === radius;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

bombRadiusOptions.addEventListener("click", event => {
  const button = event.target.closest("button[data-radius]");
  if (!button || !bombRadiusOptions.contains(button)) return;
  setBombRadius(Number(button.dataset.radius));
});

setBombRadius(4);

function bombAtPoint(point) {
  if (completed || !width || !height) return;

  const cx = Math.floor((point.x - offsetX) / zoom);
  const cy = Math.floor((point.y - offsetY) / zoom);

  if (cx < 0 || cy < 0 || cx >= width || cy >= height) return;

  let changed = 0;

  const minX = Math.max(0, cx - BOMB_RADIUS);
  const maxX = Math.min(width - 1, cx + BOMB_RADIUS);
  const minY = Math.max(0, cy - BOMB_RADIUS);
  const maxY = Math.min(height - 1, cy + BOMB_RADIUS);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;

      if (dx * dx + dy * dy > BOMB_RADIUS * BOMB_RADIUS) {
        continue;
      }

      const index = y * width + x;

      if (pixels[index] === -1 || painted[index]) continue;

      painted[index] = true;
      changed++;
    }
  }

  if (!changed) return;

  paintedCount += changed;

  saveProgress();
  updateProgress();
  renderPalette();
  updateSpriteCanvas();
  draw();

  const burst = document.createElement("span");
  burst.className = "cd-bomb-burst";
  burst.style.left = `${point.x}px`;
  burst.style.top = `${point.y}px`;
  burst.setAttribute("aria-hidden", "true");
  frame.appendChild(burst);

  burst.addEventListener(
    "animationend",
    () => burst.remove(),
    { once: true }
  );

  if (paintedCount === totalPixels) {
    finishPainting();
  }
}

bombModeButton.addEventListener("click", () => {
  setMode("bomb");
});

function paintAtPoint(point) {
  if (completed || !width || !height) return;

  const x = Math.floor(
    (point.x - offsetX) / zoom
  );

  const y = Math.floor(
    (point.y - offsetY) / zoom
  );

  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }

  const index = y * width + x;

  if (
    pixels[index] !== selectedColor ||
    painted[index]
  ) {
    return;
  }

  painted[index] = true;
  paintedCount++;

  saveProgress();
  updateProgress();
  renderPalette();
  updateSpriteCanvas();
  draw();

  if (paintedCount === totalPixels) {
    finishPainting();
    return;
  }

  const hasCurrentColorRemaining = pixels.some(
    (colorIndex, index) =>
      colorIndex === selectedColor && !painted[index]
  );

  if (!hasCurrentColorRemaining) {
    selectNextColor();
  }
}


// COLORDEX 1.0.17 — PINTURA INTELIGENTE
function canPaintAtPoint(point) {
  if (completed || !width || !height) return false;

  const x = Math.floor((point.x - offsetX) / zoom);
  const y = Math.floor((point.y - offsetY) / zoom);

  if (x < 0 || y < 0 || x >= width || y >= height) {
    return false;
  }

  const index = y * width + x;

  return (
    pixels[index] === selectedColor &&
    !painted[index]
  );
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function getPinchData() {
  const points = [...pointers.values()].slice(0, 2);

  if (points.length < 2) return null;

  const [a, b] = points;

  return {
    centerX: (a.x + b.x) / 2,
    centerY: (a.y + b.y) / 2,
    distance: Math.hypot(
      a.x - b.x,
      a.y - b.y
    )
  };
}

function startPinch() {
  const data = getPinchData();
  if (!data) return;

  singleGesture = null;

  pinchGesture = {
    distance: Math.max(1, data.distance),
    zoom,
    imageX: (data.centerX - offsetX) / zoom,
    imageY: (data.centerY - offsetY) / zoom
  };

  frame.classList.add("dragging");
}
function paintAlongPath(start, end) {
  const distance = Math.hypot(
    end.x - start.x,
    end.y - start.y
  );

  const steps = Math.max(
    1,
    Math.ceil(distance / Math.max(1, zoom / 2))
  );

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    paintAtPoint({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    });
  }
}
canvas.addEventListener("pointerdown", event => {
  if (
    event.pointerType === "mouse" &&
    event.button !== 0 &&
    event.button !== 1
  ) {
    return;
  }

  event.preventDefault();

  const point = getPoint(event);

  pointers.set(event.pointerId, point);
  canvas.setPointerCapture(event.pointerId);

  if (pointers.size >= 2) {
    startPinch();
    return;
  }


const isTouch = event.pointerType === "touch";
const forceMove =
  mode === "move" ||
  spaceHeld ||
  event.button === 1;

const shouldPaint =
  !forceMove &&
  mode === "paint" &&
  (
    isTouch
      ? canPaintAtPoint(point)
      : true
  );

singleGesture = {
  id: event.pointerId,
  pointerType: event.pointerType,
  startX: point.x,
  startY: point.y,
  lastX: point.x,
  lastY: point.y,
  moved: false,
  canMove: !shouldPaint,
  painting: shouldPaint,
  bombing: !forceMove && mode === "bomb",
  startedAt: point
};

if (shouldPaint) {
  paintAtPoint(point);
}
});
canvas.addEventListener("pointermove", event => {
  if (!pointers.has(event.pointerId)) return;

  event.preventDefault();

  const point = getPoint(event);
  pointers.set(event.pointerId, point);

  if (pointers.size >= 2 && pinchGesture) {
    const data = getPinchData();
    if (!data) return;

    const ratio =
      data.distance / pinchGesture.distance;

    zoom = Math.max(
      MIN_ZOOM,
      Math.min(
        MAX_ZOOM,
        pinchGesture.zoom * ratio
      )
    );

    offsetX =
      data.centerX - pinchGesture.imageX * zoom;

    offsetY =
      data.centerY - pinchGesture.imageY * zoom;

    clampOffsets();
    draw();
    return;
  }

  if (
    !singleGesture ||
    singleGesture.id !== event.pointerId
  ) {
    return;
  }

  const dx = point.x - singleGesture.lastX;
  const dy = point.y - singleGesture.lastY;

  if (
    Math.hypot(
      point.x - singleGesture.startX,
      point.y - singleGesture.startY
    ) > 7
  ) {
    singleGesture.moved = true;
  }

  if (singleGesture.canMove) {
    offsetX += dx;
    offsetY += dy;

    clampOffsets();
    draw();

    frame.classList.add("dragging");
  } else if (singleGesture.painting && !spaceHeld) {
    paintAlongPath(
      {
        x: singleGesture.lastX,
        y: singleGesture.lastY
      },
      point
    );
  }

  singleGesture.lastX = point.x;
  singleGesture.lastY = point.y;
});

function endPointer(event, cancelled = false) {
  if (!pointers.has(event.pointerId)) return;

  const point = getPoint(event);
  const wasPinching = pinchGesture !== null;

  const gesture = singleGesture;

  if (
    !cancelled &&
    !wasPinching &&
    pointers.size === 1 &&
    gesture &&
    gesture.id === event.pointerId &&
    gesture.bombing &&
    !gesture.moved &&
    !spaceHeld
  ) {
    bombAtPoint(point);
  }

  pointers.delete(event.pointerId);
  singleGesture = null;

  if (wasPinching) {
    if (pointers.size >= 2) {
      startPinch();
    } else {
      pinchGesture = null;
    }
  }

  if (pointers.size === 0) {
    frame.classList.remove("dragging");
  }
}

canvas.addEventListener("pointerup", event => {
  endPointer(event);
});

canvas.addEventListener("pointercancel", event => {
  endPointer(event, true);
});

canvas.addEventListener("lostpointercapture", event => {
  endPointer(event, true);
});



// Zoom pela rodinha do mouse.
canvas.addEventListener(
  "wheel",
  event => {
    event.preventDefault();

    const point = getPoint(event);
    const factor = Math.exp(
      -event.deltaY * 0.0015
    );

    setZoom(
      zoom * factor,
      point.x,
      point.y
    );
  },
  { passive: false }
);

paintModeButton.addEventListener("click", () => {
  setMode("paint");
});

moveModeButton.addEventListener("click", () => {
  setMode("move");
});

document.getElementById("zoomIn").addEventListener(
  "click",
  () => {
    setZoom(
      zoom + 2,
      viewWidth / 2,
      viewHeight / 2
    );
  }
);

document.getElementById("zoomOut").addEventListener(
  "click",
  () => {
    setZoom(
      zoom - 2,
      viewWidth / 2,
      viewHeight / 2
    );
  }
);

document.getElementById("fitButton").addEventListener(
  "click",
  fitPokemon
);

// Barra de espaço + arrastar no computador.
document.addEventListener("keydown", event => {
  if (
    event.code === "Space" &&
    !["INPUT", "TEXTAREA", "BUTTON"].includes(
      document.activeElement?.tagName
    )
  ) {
    event.preventDefault();
    spaceHeld = true;
    frame.classList.add("move-active");
  }
});

document.addEventListener("keyup", event => {
  if (event.code === "Space") {
    spaceHeld = false;

    frame.classList.toggle(
      "move-active",
      mode === "move"
    );
  }
});

window.addEventListener("blur", () => {
  spaceHeld = false;

  frame.classList.toggle(
    "move-active",
    mode === "move"
  );
});

// Reiniciar a pintura.
document.getElementById("resetButton").addEventListener(
  "click",
  () => {
    if (!width || !height) return;

    const confirmed = confirm(
      "Deseja apagar o progresso desta pintura?"
    );

    if (!confirmed) return;

    painted.fill(false);
    paintedCount = 0;
    completed = false;

    localStorage.removeItem(saveKey);
    updateCompletionList(false);

    completionModal.classList.add("hidden");

    updateSpriteCanvas();
    draw();
    renderPalette();
    updateProgress();
  }
);

async function loadPokemon() {
  if (!AVAILABLE_POKEMON[pokemonId]) {
    title.textContent = "Pokémon indisponível";
    statusText.textContent = "Volte à Pokédex.";
    statusBadge.textContent = "BLOQUEADO";
    return;
  }

  title.textContent =
    `#${number} — ${AVAILABLE_POKEMON[pokemonId]}`;

  const image = new Image();
    image.src = getPaintingSprite();

  try {
    await image.decode();
  } catch (error) {
    statusText.textContent =
      "Não foi possível carregar o sprite.";

    console.error(error);
    return;
  }

  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;

  const sourceCtx = source.getContext("2d", {
    willReadFrequently: true
  });

  sourceCtx.drawImage(image, 0, 0);

  const data = sourceCtx.getImageData(
    0,
    0,
    source.width,
    source.height
  ).data;

  width = source.width;
  height = source.height;

  const colorMap = new Map();
  pixels = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) {
      pixels.push(-1);
      continue;
    }

    const hex = rgbToHex(r, g, b);

    if (!colorMap.has(hex)) {
      colorMap.set(hex, colorMap.size);
    }

    pixels.push(colorMap.get(hex));
  }

  colors = [...colorMap.keys()];

  totalPixels = pixels.filter(
    value => value !== -1
  ).length;

  painted = new Array(pixels.length).fill(false);

  loadSavedProgress();
  countPainted();

  const savedCompleted =
    getCompleted().includes(pokemonId);

  completed = savedCompleted ||
    (
      totalPixels > 0 &&
      paintedCount === totalPixels
    );

  if (completed) {
    painted = pixels.map(
      value => value !== -1
    );

    countPainted();
    updateCompletionList(true);
    saveProgress();
  }

  // Prepara a imagem original para ampliação.
  spriteCanvas.width = width;
  spriteCanvas.height = height;

  updateSpriteCanvas();

  resizeCanvas();
  fitPokemon();
  renderPalette();
  updateProgress();
}

window.addEventListener("resize", resizeCanvas);

if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(frame);
}


async function initializePainting() {
  setMode("paint");

  try {
    const response = await fetch("../data/pokemon-data.json");

    if (!response.ok) {
      throw new Error("Não foi possível carregar pokemon-data.json");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length !== 1025) {
      throw new Error("Lista de Pokémon incompleta");
    }

    AVAILABLE_POKEMON = Object.fromEntries(
      data.map(pokemon => [
        pokemon.id,
        pokemon.name
          .split("-")
          .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join(" ")
      ])
    );

    // Nomes especiais
    AVAILABLE_POKEMON[29] = "Nidoran♀";
    AVAILABLE_POKEMON[32] = "Nidoran♂";
    AVAILABLE_POKEMON[83] = "Farfetch'd";
    AVAILABLE_POKEMON[122] = "Mr. Mime";
    AVAILABLE_POKEMON[250] = "Ho-Oh";
    AVAILABLE_POKEMON[474] = "Porygon-Z";

    await loadPokemon();

    console.log(
      "ColorDex: pintura disponível para 1025 Pokémon!"
    );

  } catch (error) {
    console.error("Erro ao iniciar a pintura:", error);

    title.textContent = "Erro ao carregar Pokémon";
    statusText.textContent =
      "Não foi possível carregar os dados da Pokédex.";
  }
}

initializePainting();
