export type LogoPalette = { primaryColor: string; secondaryColor: string; accentColor: string };
type Color = { r: number; g: number; b: number; count: number };
const hex = (color: Pick<Color, "r" | "g" | "b">) =>
  `#${[color.r, color.g, color.b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
const saturation = (color: Color) =>
  Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);

/** Ignore transparent pixels and near-white backgrounds; group nearby colors so
 * anti-aliased edges do not dominate the logo's actual brand colors. */
export function paletteFromPixels(pixels: ArrayLike<number>): LogoPalette {
  const groups = new Map<string, Color>();
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const [r, g, b, alpha] = [
      pixels[index],
      pixels[index + 1],
      pixels[index + 2],
      pixels[index + 3],
    ];
    if (alpha < 192 || Math.min(r, g, b) > 235) continue;
    const key = [r, g, b].map((value) => Math.floor(value / 32)).join(":");
    const group = groups.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    group.r += r;
    group.g += g;
    group.b += b;
    group.count++;
    groups.set(key, group);
  }
  const colors = [...groups.values()].map((color) => ({
    ...color,
    r: color.r / color.count,
    g: color.g / color.count,
    b: color.b / color.count,
  }));
  const chromatic = colors.filter((color) => saturation(color) > 35);
  const candidates = chromatic.length ? chromatic : colors;
  candidates.sort(
    (a, b) => b.count * (1 + saturation(b) / 255) - a.count * (1 + saturation(a) / 255),
  );
  const primary = candidates[0];
  if (!primary)
    throw new Error(
      "This logo has no usable colors. Try a logo with a visible color or dark mark.",
    );
  const accent =
    candidates.find(
      (color) =>
        color.count >= primary.count * 0.05 &&
        Math.hypot(color.r - primary.r, color.g - primary.g, color.b - primary.b) > 100,
    ) ?? primary;
  return {
    primaryColor: hex(primary),
    accentColor: hex(accent),
    secondaryColor: hex({
      r: primary.r * 0.25 + 255 * 0.75,
      g: primary.g * 0.25 + 255 * 0.75,
      b: primary.b * 0.25 + 255 * 0.75,
    }),
  };
}

export async function extractLogoPalette(url: string): Promise<LogoPalette> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = url;
  try {
    await image.decode();
    const canvas = document.createElement("canvas");
    const scale = 128 / Math.max(image.naturalWidth, image.naturalHeight);
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return paletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This logo")) throw error;
    throw new Error("This logo could not be analyzed. Upload the logo file, then try again.");
  }
}
