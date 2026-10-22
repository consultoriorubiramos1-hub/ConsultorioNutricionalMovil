const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Herramientas de imagen ya incluidas en las dependencias de Expo CLI.
const { createRequire } = require('node:module');
const imageRequire = createRequire(require.resolve('@expo/image-utils'));
const Jimp = imageRequire('jimp-compact');

const images = path.resolve(__dirname, '../assets/images');
const sourcePath = path.join(images, 'logo-rubi.png');
const size = 1024;

function hasVisiblePixelInColumn(image, x) {
  for (let y = 0; y < image.bitmap.height; y++) {
    if (image.bitmap.data[(y * image.bitmap.width + x) * 4 + 3]) return true;
  }
  return false;
}

function extractOriginalSymbol(image) {
  // El PNG original tiene el símbolo a la izquierda y una franja transparente
  // antes del nombre. Solo se extraen sus píxeles; no se dibuja otro símbolo.
  let left = 0;
  while (left < image.bitmap.width && !hasVisiblePixelInColumn(image, left)) left++;
  let right = left;
  while (right < image.bitmap.width && hasVisiblePixelInColumn(image, right)) right++;
  assert.ok(right < image.bitmap.width / 3, 'Revisar la separación del símbolo en el logo original.');

  let top = image.bitmap.height;
  let bottom = -1;
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = left; x < right; x++) {
      if (image.bitmap.data[(y * image.bitmap.width + x) * 4 + 3]) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  assert.ok(bottom >= top, 'No se encontró el símbolo original.');
  return image.clone().crop(left, top, right - left, bottom - top + 1);
}

function centered(image, maxSide, background = 0x00000000) {
  const ratio = maxSide / Math.max(image.bitmap.width, image.bitmap.height);
  const width = Math.round(image.bitmap.width * ratio);
  const height = Math.round(image.bitmap.height * ratio);
  const resized = image.clone().resize(width, height, Jimp.RESIZE_BICUBIC);
  return new Jimp(size, size, background).composite(resized, Math.floor((size - width) / 2), Math.floor((size - height) / 2));
}

async function generate() {
  const originalBytes = fs.readFileSync(sourcePath);
  const original = await Jimp.read(originalBytes);
  const symbol = extractOriginalSymbol(original);

  // iOS y Android antiguo: imagen opaca, cuadrada, sin esquinas precortadas.
  const icon = centered(symbol, 760, 0xffffffff).colorType(2);
  // 592/1024 * 108 = 62.44 dp: dentro de la zona segura de 66 dp de Android.
  const foreground = centered(symbol, 592);
  const background = new Jimp(size, size, 0xffffffff).colorType(2);
  const monochrome = foreground.clone().scan(0, 0, size, size, function (_x, _y, index) {
    // La máscara conserva exactamente el alfa del símbolo a color.
    this.bitmap.data[index] = 255;
    this.bitmap.data[index + 1] = 255;
    this.bitmap.data[index + 2] = 255;
  });
  // Logo completo en un lienzo transparente para los generadores nativos.
  const splash = centered(original, size);

  const assets = {
    'icon.png': icon,
    'android-icon-foreground.png': foreground,
    'android-icon-background.png': background,
    'android-icon-monochrome.png': monochrome,
    'splash-icon.png': splash,
  };
  for (const [name, image] of Object.entries(assets)) {
    assert.equal(image.bitmap.width, size);
    assert.equal(image.bitmap.height, size);
    await image.writeAsync(path.join(images, name));
    console.log(`${name}: ${size} x ${size} PNG`);
  }
  assert.deepEqual(fs.readFileSync(sourcePath), originalBytes, 'El logo original debe permanecer intacto.');
  console.log(`Símbolo extraído del original: ${symbol.bitmap.width} x ${symbol.bitmap.height} px. Logo fuente sin cambios.`);
}

generate().catch((error) => { console.error(error); process.exitCode = 1; });
