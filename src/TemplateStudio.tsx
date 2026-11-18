import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
  ArrowDownToLine,
  Check,
  Eraser,
  Image as ImageIcon,
  Pencil,
  Sparkles,
  Undo2,
  Wand2,
} from "lucide-react";
import { templateImages } from "./templates";
import type { TemplateImageId } from "./templates";

type FillRecord = { x: number; y: number; color: string };

// Tolerance used to decide whether two pixels belong to the same region.
const FILL_TOLERANCE = 36;
// Number of fill steps processed per animation frame (keeps the UI responsive).
const FILL_CHUNK = 4000;

function createColorOutline(source: HTMLCanvasElement): ImageData {
  const maxSide = 320;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const size = width * height;
  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = width;
  analysisCanvas.height = height;
  const analysisContext = analysisCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!analysisContext) throw new Error("Unable to create analysis canvas");

  // Blur and downsample first so color texture does not become linework.
  analysisContext.imageSmoothingEnabled = true;
  analysisContext.fillStyle = "white";
  analysisContext.fillRect(0, 0, width, height);
  analysisContext.filter = "blur(1.2px)";
  analysisContext.drawImage(source, 0, 0, width, height);
  analysisContext.filter = "none";
  const analysis = analysisContext.getImageData(0, 0, width, height);
  const pixels = analysis.data;
  const paletteSize = 4;
  const palette = new Uint8Array(paletteSize ** 3 * 3);
  for (let r = 0; r < paletteSize; r += 1) {
    for (let g = 0; g < paletteSize; g += 1) {
      for (let b = 0; b < paletteSize; b += 1) {
        const label = r * paletteSize ** 2 + g * paletteSize + b;
        const p = label * 3;
        palette[p] = Math.min(255, r * 64 + 32);
        palette[p + 1] = Math.min(255, g * 64 + 32);
        palette[p + 2] = Math.min(255, b * 64 + 32);
      }
    }
  }

  // A compact RGB palette merges nearby shades into fillable color regions.
  const labelCount = paletteSize ** 3;
  const labels = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) {
    const p = i * 4;
    if (pixels[p + 3] < 128) {
      labels[i] = labelCount - 1;
      continue;
    }
    const r = Math.min(paletteSize - 1, Math.floor(pixels[p] / 64));
    const g = Math.min(paletteSize - 1, Math.floor(pixels[p + 1] / 64));
    const b = Math.min(paletteSize - 1, Math.floor(pixels[p + 2] / 64));
    labels[i] = r * paletteSize ** 2 + g * paletteSize + b;
  }

  let smoothed = labels;
  const neighborhoodLabels = new Uint8Array(9);
  const neighborhoodCounts = new Uint8Array(9);
  for (let pass = 0; pass < 3; pass += 1) {
    const filtered = smoothed.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        let unique = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const label = smoothed[index + dy * width + dx];
            let slot = 0;
            while (slot < unique && neighborhoodLabels[slot] !== label) slot += 1;
            if (slot === unique) {
              neighborhoodLabels[unique] = label;
              neighborhoodCounts[unique] = 0;
              unique += 1;
            }
            neighborhoodCounts[slot] += 1;
          }
        }
        let bestLabel = smoothed[index];
        let bestCount = 0;
        for (let slot = 0; slot < unique; slot += 1) {
          if (neighborhoodCounts[slot] > bestCount) {
            bestLabel = neighborhoodLabels[slot];
            bestCount = neighborhoodCounts[slot];
          }
        }
        if (bestCount >= 5) filtered[index] = bestLabel;
      }
    }
    smoothed = filtered;
  }

  const merged = smoothed.slice();
  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  const neighborCounts = new Uint16Array(labelCount);
  const minRegionSize = Math.max(12, Math.floor(size * 0.0005));
  for (let start = 0; start < size; start += 1) {
    if (visited[start]) continue;
    const label = smoothed[start];
    let head = 0;
    let tail = 1;
    queue[0] = start;
    visited[start] = 1;
    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const left = x > 0 ? index - 1 : -1;
      const right = x + 1 < width ? index + 1 : -1;
      const top = index >= width ? index - width : -1;
      const bottom = index + width < size ? index + width : -1;
      if (left >= 0 && !visited[left] && smoothed[left] === label) {
        visited[left] = 1;
        queue[tail++] = left;
      }
      if (right >= 0 && !visited[right] && smoothed[right] === label) {
        visited[right] = 1;
        queue[tail++] = right;
      }
      if (top >= 0 && !visited[top] && smoothed[top] === label) {
        visited[top] = 1;
        queue[tail++] = top;
      }
      if (bottom >= 0 && !visited[bottom] && smoothed[bottom] === label) {
        visited[bottom] = 1;
        queue[tail++] = bottom;
      }
    }

    if (tail >= minRegionSize) continue;
    neighborCounts.fill(0);
    for (let item = 0; item < tail; item += 1) {
      const index = queue[item];
      const x = index % width;
      if (x > 0 && smoothed[index - 1] !== label) {
        neighborCounts[smoothed[index - 1]] += 1;
      }
      if (x + 1 < width && smoothed[index + 1] !== label) {
        neighborCounts[smoothed[index + 1]] += 1;
      }
      if (index >= width && smoothed[index - width] !== label) {
        neighborCounts[smoothed[index - width]] += 1;
      }
      if (index + width < size && smoothed[index + width] !== label) {
        neighborCounts[smoothed[index + width]] += 1;
      }
    }
    let replacement = label;
    let replacementCount = 0;
    for (let candidate = 0; candidate < labelCount; candidate += 1) {
      if (neighborCounts[candidate] > replacementCount) {
        replacement = candidate;
        replacementCount = neighborCounts[candidate];
      }
    }
    if (replacement !== label) {
      for (let item = 0; item < tail; item += 1) {
        merged[queue[item]] = replacement;
      }
    }
  }

  // Trace transitions between the cleaned color regions, not every gradient.
  const edgeMap = new Uint8Array(size);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const label = merged[index];
      if (x + 1 < width && merged[index + 1] !== label) edgeMap[index] = 1;
      if (y + 1 < height && merged[index + width] !== label) edgeMap[index] = 1;
    }
  }

  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = width;
  outlineCanvas.height = height;
  const outlineContext = outlineCanvas.getContext("2d");
  if (!outlineContext) throw new Error("Unable to create outline canvas");
  const outline = outlineContext.createImageData(width, height);
  for (let i = 0; i < size; i += 1) {
    const value = edgeMap[i] ? 0 : 255;
    const p = i * 4;
    outline.data[p] = value;
    outline.data[p + 1] = value;
    outline.data[p + 2] = value;
    outline.data[p + 3] = 255;
  }
  outlineContext.putImageData(outline, 0, 0);

  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = source.width;
  resultCanvas.height = source.height;
  const resultContext = resultCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!resultContext) throw new Error("Unable to create result canvas");
  resultContext.imageSmoothingEnabled = false;
  resultContext.fillStyle = "white";
  resultContext.fillRect(0, 0, source.width, source.height);
  resultContext.drawImage(outlineCanvas, 0, 0, source.width, source.height);
  return resultContext.getImageData(0, 0, source.width, source.height);
}

function createPencilSketch(source: HTMLCanvasElement): ImageData {
  const { width, height } = source;

  // 1. Grayscale base layer.
  const grayCanvas = document.createElement("canvas");
  grayCanvas.width = width;
  grayCanvas.height = height;
  const grayCtx = grayCanvas.getContext("2d");
  if (!grayCtx) throw new Error("Unable to create grayscale canvas");
  grayCtx.filter = "grayscale(1)";
  grayCtx.drawImage(source, 0, 0);
  grayCtx.filter = "none";

  // 2. Inverted + blurred "dodge" layer. Blending this with the grayscale
  // base using color-dodge reproduces the classic pencil-sketch look: strong
  // edges stay dark while flat areas lighten into soft graphite shading.
  const blurRadius = Math.max(4, Math.round(Math.min(width, height) / 60));
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = width;
  blurCanvas.height = height;
  const blurCtx = blurCanvas.getContext("2d");
  if (!blurCtx) throw new Error("Unable to create blur canvas");
  blurCtx.filter = `invert(1) blur(${blurRadius}px)`;
  blurCtx.drawImage(grayCanvas, 0, 0);
  blurCtx.filter = "none";

  // 3. Color-dodge blend the two layers to get the pencil shading.
  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = width;
  resultCanvas.height = height;
  const resultCtx = resultCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!resultCtx) throw new Error("Unable to create result canvas");
  resultCtx.drawImage(grayCanvas, 0, 0);
  resultCtx.globalCompositeOperation = "color-dodge";
  resultCtx.drawImage(blurCanvas, 0, 0);
  resultCtx.globalCompositeOperation = "source-over";

  return resultCtx.getImageData(0, 0, width, height);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(
    clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean,
    16,
  );
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Queue-based flood fill over an ImageData buffer. Marks covered pixels with a
 * unique tag so overlapping fills can be undone. Runs in chunks on
 * requestAnimationFrame so the canvas stays responsive on large images.
 */
function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: string,
  tag: number,
  onProgress: () => void,
): Promise<void> {
  const { width, height, data } = imageData;
  const fillRgb = hexToRgb(fillColor);
  const startPos = (startY * width + startX) * 4;
  const targetR = data[startPos];
  const targetG = data[startPos + 1];
  const targetB = data[startPos + 2];
  const targetA = data[startPos + 3];

  // If the point we clicked is fully transparent, do nothing.
  if (targetA === 0) return Promise.resolve();

  const filled = new Uint8Array(width * height);
  const queue: number[] = [startY * width + startX];
  const matched: number[] = [];

  function matches(pos: number) {
    const p = pos * 4;
    return (
      Math.abs(data[p] - targetR) <= FILL_TOLERANCE &&
      Math.abs(data[p + 1] - targetG) <= FILL_TOLERANCE &&
      Math.abs(data[p + 2] - targetB) <= FILL_TOLERANCE
    );
  }

  return new Promise(resolve => {
    const step = () => {
      let count = 0;
      while (queue.length && count < FILL_CHUNK) {
        const pos = queue.pop()!;
        if (filled[pos]) continue;
        if (!matches(pos)) continue;
        filled[pos] = tag;
        matched.push(pos);
        count += 1;

        const x = pos % width;
        const y = (pos - x) / width;
        if (x > 0) queue.push(pos - 1);
        if (x < width - 1) queue.push(pos + 1);
        if (y > 0) queue.push(pos - width);
        if (y < height - 1) queue.push(pos + width);
      }

      // Commit the newly matched pixels to the ImageData.
      for (let i = 0; i < matched.length; i += 1) {
        const p = matched[i] * 4;
        data[p] = fillRgb[0];
        data[p + 1] = fillRgb[1];
        data[p + 2] = fillRgb[2];
        data[p + 3] = 255;
      }
      matched.length = 0;

      if (queue.length) {
        requestAnimationFrame(step);
      } else {
        filled.fill(0);
        onProgress();
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

const templateColors = [
  { name: "Marigold", value: "#e89a28" },
  { name: "Rose", value: "#d95770" },
  { name: "Peacock", value: "#247e78" },
  { name: "Indigo", value: "#5559a8" },
  { name: "Coral", value: "#eb7253" },
  { name: "Leaf", value: "#78924e" },
  { name: "Crimson", value: "#c0392b" },
  { name: "Sky", value: "#3b82c4" },
  { name: "Amber", value: "#f0a04b" },
  { name: "Lavender", value: "#8e6fb3" },
];

export default function TemplateStudio({
  onBack,
}: {
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<HTMLImageElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateImageId>("classic-rangoli");
  const [selectedColor, setSelectedColor] = useState(templateColors[0].value);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fills, setFills] = useState<FillRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(0);
  const [converting, setConverting] = useState(false);
  const [sketching, setSketching] = useState(false);
  const tagRef = useRef(1);

  const templateUrl = useMemo(() => {
    const found = templateImages.find(t => t.id === selectedTemplate);
    return found ? found.src : "";
  }, [selectedTemplate]);

  // Draw the base template, then replay every fill from `list` on top of it.
  function replayFills(list: FillRecord[]) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx || !baseRef.current) return;
    const c = canvas;
    const cCtx = ctx;

    cCtx.clearRect(0, 0, c.width, c.height);
    cCtx.drawImage(baseRef.current, 0, 0, c.width, c.height);

    async function apply(index: number) {
      if (index >= list.length) return;
      const { x, y, color } = list[index];
      const imageData = cCtx.getImageData(0, 0, c.width, c.height);
      const tag = tagRef.current++;
      await floodFill(imageData, x, y, color, tag, () => {
        cCtx.putImageData(imageData, 0, 0);
      });
      await apply(index + 1);
    }
    void apply(0);
  }

  useEffect(() => {
    if (!templateUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = templateUrl;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let active = true;

    image.onload = () => {
      if (!active) return;
      baseRef.current = image;
      // Fit the canvas to the image while capping the working resolution.
      let scale = 1;
      const MAX = 900;
      if (Math.max(image.naturalWidth, image.naturalHeight) > MAX) {
        scale = MAX / Math.max(image.naturalWidth, image.naturalHeight);
      }
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      setFills([]);
      setApplied(0);
      setImageLoaded(true);
    };

    image.onerror = () => {
      if (active) setImageLoaded(false);
    };

    return () => {
      active = false;
    };
  }, [templateUrl]);

  function undoFill() {
    if (!fills.length || busy) return;
    const nextFills = fills.slice(0, -1);
    setFills(nextFills);
    setApplied(nextFills.length);
    setBusy(true);
    // Give React a tick to update state, then rebuild from the base image.
    window.setTimeout(() => {
      replayFills(nextFills);
      setBusy(false);
    }, 20);
  }

  async function applyFill(event: MouseEvent<HTMLCanvasElement>) {
    if (busy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(
      ((event.clientX - rect.left) / rect.width) * canvas.width,
    );
    const y = Math.round(
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    );

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tag = tagRef.current++;
    setBusy(true);
    await floodFill(imageData, x, y, selectedColor, tag, () => {
      ctx.putImageData(imageData, 0, 0);
      setFills(prev => [...prev, { x, y, color: selectedColor }]);
      setApplied(count => count + 1);
      setBusy(false);
    });
  }

  async function convertToOutline() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const template = templateImages.find(item => item.id === selectedTemplate);
    if (!canvas || !ctx || !template) return;

    setConverting(true);
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (template.kind === "line-art") {
        const { data } = imageData;
        for (let i = 0; i < data.length; i += 4) {
          const luminance =
            data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
          const value = luminance < 190 ? 0 : 255;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
      } else {
        ctx.putImageData(createColorOutline(canvas), 0, 0);
      }
      setFills([]);
      setApplied(0);
    } catch (error) {
      console.error("Unable to convert template to outline:", error);
    } finally {
      setConverting(false);
    }
  }

  async function convertToPencilSketch() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;

    setSketching(true);
    try {
      ctx.putImageData(createPencilSketch(canvas), 0, 0);
      setFills([]);
      setApplied(0);
    } catch (error) {
      console.error("Unable to convert template to a pencil sketch:", error);
    } finally {
      setSketching(false);
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "rangoli-template.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function clearAll() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx || !baseRef.current) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseRef.current, 0, 0, canvas.width, canvas.height);
    setFills([]);
    setApplied(0);
  }

  return (
    <main className="template-shell">
      <header className="template-topbar">
        <div className="template-brand">
          <button
            className="template-back"
            onClick={onBack}
            aria-label="Back to circle studio"
          >
            ←
          </button>
          <span className="brand-flower">
            <Sparkles size={20} />
          </span>
          <span className="template-brand-name">Rangoli Template Studio</span>
        </div>
        <span className="template-brand-note">
          Pick a template · tap to flood-fill · make it yours
        </span>
      </header>

      <div className="template-layout">
        <aside className="template-sidebar">
          <div className="project-label">
            <span className="eyebrow">COLOR A TEMPLATE</span>
          </div>
          <h1 className="template-title">Choose your rangoli</h1>
          <p className="template-sub">
            Pick a design from the gallery, then tap any region to fill it with
            the color you choose.
          </p>

          <div
            className="template-picker"
            role="listbox"
            aria-label="Rangoli templates"
          >
            {templateImages.map(template => (
              <button
                key={template.id}
                className={`template-img-card ${
                  selectedTemplate === template.id ? "selected" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
                aria-pressed={selectedTemplate === template.id}
              >
                <img src={template.src} alt={template.name} />
                <span>{template.name}</span>
                {selectedTemplate === template.id && (
                  <Check className="template-img-check" size={14} />
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="template-stage" aria-label="Coloring canvas">
          <div className="studio-heading">
            <div>
              <span className="eyebrow">FILL WITH COLOR</span>
              <h2>
                {templateImages.find(t => t.id === selectedTemplate)?.name}
              </h2>
            </div>
            <div className="studio-actions">
              <button
                className="quiet-button"
                onClick={undoFill}
                disabled={!fills.length || busy}
              >
                <Undo2 size={16} /> Undo fill
              </button>
              <button
                className="quiet-button"
                onClick={clearAll}
                disabled={!imageLoaded}
              >
                <Eraser size={16} /> Reset
              </button>
              <button
                className="ghost-button"
                onClick={convertToOutline}
                disabled={!imageLoaded || converting}
                title="Turn the current image into a colorless outline you can color again"
              >
                <Wand2 size={16} />{" "}
                {converting ? "Converting…" : "Make outline"}
              </button>
              <button
                className="ghost-button"
                onClick={convertToPencilSketch}
                disabled={!imageLoaded || sketching}
                title="Turn the current image into a grayscale pencil-drawing look"
              >
                <Pencil size={16} />{" "}
                {sketching ? "Sketching…" : "Pencil sketch"}
              </button>
              <button
                className="share-button"
                onClick={download}
                disabled={!imageLoaded}
              >
                <ArrowDownToLine size={16} /> Save PNG
              </button>
            </div>
          </div>

          <div className="template-canvas-wrap">
            <div className="canvas-note">
              <span className="note-spark">✳</span>
              <span>
                {converting
                  ? "Outlining…"
                  : sketching
                    ? "Sketching…"
                    : busy
                      ? "Filling…"
                      : imageLoaded
                        ? "Click inside a region to fill it"
                        : "Loading template…"}
              </span>
            </div>
            <div className="template-canvas-frame">
              {!imageLoaded && (
                <div className="template-loading">
                  <ImageIcon size={28} />
                  <span>Loading template…</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="template-canvas"
                onClick={applyFill}
                role="img"
                aria-label="Rangoli template canvas. Click regions to flood-fill with the selected color."
                style={{ display: imageLoaded ? "block" : "none" }}
              />
            </div>
            <div className="canvas-bottom-note template-bottom-note">
              <span className="mini-flower">
                <Sparkles size={17} />
              </span>
              <span>
                Your fills stay on this device — download a PNG to keep them
              </span>
            </div>
          </div>
        </section>

        <aside className="template-color-rail">
          <div className="rail-title">
            <span className="eyebrow">PICK A COLOR</span>
          </div>
          <div className="template-color-grid">
            {templateColors.map(color => (
              <button
                key={color.value}
                className={`template-color-swatch ${
                  selectedColor === color.value ? "selected" : ""
                }`}
                style={{ "--swatch": color.value } as CSSProperties}
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
                aria-label={`${color.name} color`}
              />
            ))}
          </div>
          <div className="rail-divider" />
          <div className="activity-title">
            <span className="eyebrow">COLOR PICKS</span>
          </div>

          <div className="template-fill-count">
            <Pencil size={15} />
            <strong>{applied}</strong>
            <span>fill{applied === 1 ? "" : "s"} applied</span>
          </div>

          <div className="circle-card">
            <span className="circle-card-icon">
              <Wand2 size={16} />
            </span>
            <strong>Make a colorless template.</strong>
            <p>
              Use “Make outline” to strip the color so you can fill the design
              again from scratch.
            </p>
          </div>

          <div className="template-tip">
            <Sparkles size={14} />
            <span>
              Colors blend with what&apos;s already there, so overlapping fills
              mix naturally.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}