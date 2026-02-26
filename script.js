// ============================================================
//  09 — IMAGE SAMPLER
// ============================================================

paper.setup(document.getElementById('canvas'));

// -------------------- UI: Upload --------------------
document.getElementById('upload').onclick = function () {
  document.getElementById('file').click();
};

var lastImg = null;

document.getElementById('file').onchange = function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    var img = new Image();
    img.onload = function () {
      lastImg = img;
      var canvas = document.getElementById('canvas');
      paper.view.viewSize = new paper.Size(canvas.clientWidth, canvas.clientHeight);
      refMinSize = Math.min(paper.view.size.width, paper.view.size.height);
      drawFromImage(img, 120);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// -------------------- Helpers --------------------
function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// -------------------- UI State --------------------
var currentFont  = 'Courier New, Courier, monospace';
var textMode     = 'random';
var customText   = '';
var textScale    = 1;
var maxOverlap   = 6;
var layering     = 0.8;
var contrast     = 1;
var textColorHex = '#000000';
var refMinSize   = null;

// Gradient state
var gradientType    = 'linear';
var gradientEnabled = false;

// -------------------- Debounce / fast-preview --------------------
var redrawTimer = null;

function scheduleDraw(fast) {
  if (!lastImg) return;
  clearTimeout(redrawTimer);
  if (fast) {
    drawFromImage(lastImg, 40);
    redrawTimer = setTimeout(function () { drawFromImage(lastImg, 120); }, 300);
  } else {
    redrawTimer = setTimeout(function () { drawFromImage(lastImg, 120); }, 80);
  }
}

// -------------------- UI: Typeface (custom dropdown) --------------------
var typefaceBtn      = document.getElementById('typefaceBtn');
var typefaceDropdown = document.getElementById('typefaceDropdown');
var typefaceLabel    = document.getElementById('typefaceLabel');

if (typefaceBtn) {
  typefaceBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeAllDropdowns(typefaceDropdown);
    typefaceDropdown.classList.toggle('open');
  });
}

if (typefaceDropdown) {
  typefaceDropdown.querySelectorAll('.custom-select-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      currentFont = opt.dataset.value;
      typefaceLabel.textContent = opt.textContent;
      typefaceDropdown.classList.remove('open');
      scheduleDraw(false);
    });
  });
}

// -------------------- UI: Text input --------------------
function getWordsFromCustomText() {
  var w = customText.trim().split(/\s+/).filter(Boolean);
  return w.length ? w : null;
}

var textInputEl = document.getElementById('textInput');
if (textInputEl) {
  textInputEl.addEventListener('input', function (e) {
    var value = e.target.value.trim();
    if (value === '' || value.toLowerCase() === 'random') {
      textMode = 'random'; customText = '';
    } else {
      textMode = 'custom'; customText = value;
    }
    scheduleDraw(false);
  });
}

// -------------------- UI: Sliders --------------------
var sizeEl = document.getElementById('sizeSlider');
if (sizeEl) {
  textScale = parseFloat(sizeEl.value) || 1;
  sizeEl.addEventListener('input',  function (e) { textScale = parseFloat(e.target.value) || 1; scheduleDraw(true); });
  sizeEl.addEventListener('change', function (e) { textScale = parseFloat(e.target.value) || 1; scheduleDraw(false); });
}

var densityEl = document.getElementById('densitySlider');
if (densityEl) {
  maxOverlap = parseInt(densityEl.value, 10) || 6;
  densityEl.addEventListener('input',  function (e) { maxOverlap = parseInt(e.target.value, 10) || 6; scheduleDraw(true); });
  densityEl.addEventListener('change', function (e) { maxOverlap = parseInt(e.target.value, 10) || 6; scheduleDraw(false); });
}

var layeringEl = document.getElementById('layeringSlider');
if (layeringEl) {
  layering = parseFloat(layeringEl.value) || 0.8;
  layeringEl.addEventListener('input',  function (e) { layering = parseFloat(e.target.value) || 0; scheduleDraw(true); });
  layeringEl.addEventListener('change', function (e) { layering = parseFloat(e.target.value) || 0; scheduleDraw(false); });
}

var contrastEl = document.getElementById('contrastSlider');
if (contrastEl) {
  contrast = parseFloat(contrastEl.value) || 1;
  contrastEl.addEventListener('input',  function (e) { contrast = parseFloat(e.target.value) || 1; scheduleDraw(true); });
  contrastEl.addEventListener('change', function (e) { contrast = parseFloat(e.target.value) || 1; scheduleDraw(false); });
}

// -------------------- Color / Gradient mutual exclusion --------------------
var gradientRow = document.getElementById('gradientRow');
var colorRow    = (function() {
  var el = document.getElementById('colorPicker');
  return el ? el.closest('.control-row') : null;
})();

var activeMode = 'none';

function setActiveMode(mode) {
  activeMode = mode;
  gradientEnabled = (mode === 'gradient');
  if (colorRow)    colorRow.classList.toggle('inactive', mode === 'gradient');
  if (gradientRow) gradientRow.classList.toggle('inactive', mode === 'color');
}

// -------------------- UI: Color --------------------
var colorEl = document.getElementById('colorPicker');
if (colorEl) {
  textColorHex = colorEl.value || '#000000';
  colorEl.addEventListener('input', function (e) {
    textColorHex = e.target.value || '#000000';
    setActiveMode('color');
    scheduleDraw(false);
  });
}

// -------------------- UI: Gradient --------------------
var gradientTypeBtn      = document.getElementById('gradientTypeBtn');
var gradientTypeDropdown = document.getElementById('gradientTypeDropdown');
var gradientTypeLabel    = document.getElementById('gradientTypeLabel');
var gradPreview          = document.getElementById('gradientPreview');
var gradA                = document.getElementById('gradA');
var gradB                = document.getElementById('gradB');

function closeAllDropdowns(except) {
  [typefaceDropdown, gradientTypeDropdown, saveDropdown].forEach(function (d) {
    if (d && d !== except) d.classList.remove('open');
  });
}

document.addEventListener('click', function () {
  closeAllDropdowns(null);
});

if (gradientTypeBtn) {
  gradientTypeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeAllDropdowns(gradientTypeDropdown);
    gradientTypeDropdown.classList.toggle('open');
  });
}

if (gradientTypeDropdown) {
  gradientTypeDropdown.querySelectorAll('.grad-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      gradientType = opt.dataset.value;
      gradientTypeLabel.textContent = opt.textContent;
      gradientTypeDropdown.classList.remove('open');
      setActiveMode('gradient');
      scheduleDraw(false);
    });
  });
}

[gradA, gradB].forEach(function (el) {
  if (!el) return;
  el.addEventListener('input', function () {
    setActiveMode('gradient');
    scheduleDraw(false);
  });
});

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function lerpColor(hexA, hexB, t) {
  var a = hexToRgb(hexA), b = hexToRgb(hexB);
  return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')';
}

function getGradientColor(nx, ny) {
  if (activeMode !== 'gradient') return textColorHex;
  var a = gradA.value, b = gradB.value;
  if (gradientType === 'linear') {
    return lerpColor(a, b, nx);
  } else {
    var dx = nx - 0.5, dy = ny - 0.5;
    var t  = Math.min(1, Math.sqrt(dx*dx + dy*dy) * 2);
    return lerpColor(a, b, t);
  }
}

// -------------------- UI: Save --------------------
var saveDropdown = document.getElementById('saveDropdown');
var saveBtn      = document.getElementById('saveBtn');

if (saveBtn) {
  saveBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeAllDropdowns(saveDropdown);
    saveDropdown.classList.toggle('open');
  });
}

if (saveDropdown) {
  saveDropdown.querySelector('[data-format="png"]').addEventListener('click', function () {
    saveDropdown.classList.remove('open');
    savePNG();
  });
  saveDropdown.querySelector('[data-format="svg"]').addEventListener('click', function () {
    saveDropdown.classList.remove('open');
    saveSVG();
  });
}

function savePNG() {
  var canvas = document.getElementById('canvas');
  var link   = document.createElement('a');
  link.download = 'image-sampler.png';
  link.href      = canvas.toDataURL('image/png');
  link.click();
}

function saveSVG() {
  var svg  = paper.project.exportSVG({ asString: true });
  var blob = new Blob([svg], { type: 'image/svg+xml' });
  var url  = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.download = 'image-sampler.svg';
  link.href      = url;
  link.click();
  URL.revokeObjectURL(url);
}

// -------------------- Resize --------------------
function resizeAndRedraw() {
  var canvas = document.getElementById('canvas');
  if (!canvas) return;
  paper.view.viewSize = new paper.Size(canvas.clientWidth, canvas.clientHeight);
  if (refMinSize === null) {
    refMinSize = Math.min(paper.view.size.width, paper.view.size.height);
  }
  if (lastImg) scheduleDraw(false);
}

window.addEventListener('resize', resizeAndRedraw);
resizeAndRedraw();

// ============================================================
//  MAIN DRAW
// ============================================================
function drawFromImage(img, res) {
  res = res || 120;

  paper.project.activeLayer.removeChildren();

  var padding = 30;
  var view    = paper.view;

  if (refMinSize === null) {
    refMinSize = Math.min(view.size.width, view.size.height);
  }
  var currentMin  = Math.min(view.size.width, view.size.height);
  var canvasScale = currentMin / refMinSize;

  var openers    = ['the','a','one','this','that','every','no','my','thy','our','some','each','only','but','and','even','perhaps'];
  var adjectives = ['undead','hollow','forgotten','ancient','fading','cursed','sunless','ashen','nameless','kindled','dark','lost','pale','deep','ruined','twisted','silent','linked','first','final','eternal','forsaken','abyssal','lordless'];
  var nouns      = ['flame','soul','ash','bonfire','abyss','throne','bell','cinder','lord','knight','fog','ember','hollow','pilgrim','ring','grave','cathedral','sign','sword','covenant','humanity','sun','phantom','serpent','kiln'];
  var verbs      = ['fades','links','crumbles','waits','burns','falls','returns','kindles','remains','rests','rises','seeks','endures','withers','beckons','consumes','persists','shatters','rings'];
  var endings    = ['once','in darkness','without end','alone','forever','at last','in silence','still','therefore'];

  function randomWordToken() {
    var roll = Math.random();
    if (roll < 0.20) return pick(openers);
    if (roll < 0.45) return pick(adjectives);
    if (roll < 0.75) return pick(nouns);
    if (roll < 0.95) return pick(verbs);
    return pick(endings);
  }

  function fitFontSizeToCell(word, cellW, cellH) {
    var maxH = cellH * 0.95;
    var maxW = cellW * 0.95;
    var est  = maxW / (Math.max(1, word.length) * 0.6);
    return Math.max(6, Math.min(maxH, est));
  }

  var customWords = (textMode === 'custom') ? getWordsFromCustomText() : null;

  var offscreen    = document.createElement('canvas');
  offscreen.width  = res;
  offscreen.height = res;
  var ctx = offscreen.getContext('2d');

  var m  = Math.min(img.width, img.height);
  var sx = (img.width  - m) / 2;
  var sy = (img.height - m) / 2;
  ctx.drawImage(img, sx, sy, m, m, 0, 0, res, res);

  var imageData = ctx.getImageData(0, 0, res, res);
  var data      = imageData.data;

  if (contrast !== 1) {
    for (var p = 0; p < data.length; p += 4) {
      for (var ch = 0; ch < 3; ch++) {
        var val = data[p+ch] / 255;
        val = ((val - 0.5) * contrast) + 0.5;
        data[p+ch] = Math.max(0, Math.min(255, Math.round(val * 255)));
      }
    }
  }

  var bg = new paper.Path.Rectangle(view.bounds);
  bg.fillColor = '#e0e0e0';

  var gridW = view.size.width  - padding * 2;
  var gridH = view.size.height - padding * 2;
  var cellW = gridW / res;
  var cellH = gridH / res;

  for (var i = 0; i < res; i++) {
    for (var j = 0; j < res; j++) {

      var idx        = (i * res + j) * 4;
      var r          = data[idx];
      var g          = data[idx + 1];
      var b          = data[idx + 2];
      var brightness = (r + g + b) / 3;
      var darkness   = 1 - (brightness / 255);

      var x  = padding + j * cellW + cellW / 2;
      var y  = padding + i * cellH + cellH / 2;
      var nx = j / (res - 1);
      var ny = i / (res - 1);

      var count = Math.floor(darkness * maxOverlap);
      if (count === 0 && Math.random() < 0.12) count = 1;

      for (var k = 0; k < count; k++) {

        var word = (textMode === 'custom' && customWords) ? pick(customWords) : randomWordToken();

        if (brightness > 210 && word.length > 2) {
          var take  = (Math.random() < 0.5) ? 1 : 2;
          var start = Math.floor(Math.random() * (word.length - take + 1));
          word = word.substring(start, start + take);
        }

        if (word.length > 10 && Math.random() < 0.7) word = pick(nouns);

        var base        = fitFontSizeToCell(word, cellW, cellH) * (textScale / canvasScale);
        var darkBoost   = 1 + (darkness * 1.8 * layering);
        var jitterMin   = Math.max(0.2, 1 - (0.35 * layering));
        var jitterMax   = 1 + (0.85 * layering);
        var layerJitter = rand(jitterMin, jitterMax);

        var fontSize = Math.min(base * darkBoost * layerJitter, cellH * 4.0);

        var ox = rand(-cellW * 0.45, cellW * 0.45);
        var oy = rand(-cellH * 0.45, cellH * 0.45);

        var text = new paper.PointText(new paper.Point(x + ox, y + oy + fontSize * 0.35));
        text.content       = word;
        text.fontSize      = fontSize;
        text.fontFamily    = currentFont;
        text.justification = 'center';

        var alpha = 0.08 + darkness * 0.60;
        alpha = alpha / Math.max(1, fontSize / base);
        alpha = Math.max(0.03, Math.min(0.8, alpha));

        var ink = new paper.Color(getGradientColor(nx, ny));
        ink.alpha      = alpha;
        text.fillColor = ink;
      }
    }
  }

  paper.view.draw();
}