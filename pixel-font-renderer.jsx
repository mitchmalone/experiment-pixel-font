import { useState, useEffect, useRef, useCallback } from "react";

const FONT_CATEGORIES = [
  {
    label: "Blackletter & Fraktur",
    fonts: [
      { name: "UnifrakturMaguntia", label: "UnifrakturMaguntia", weight: "400", url: "https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap" },
      { name: "UnifrakturCook", label: "UnifrakturCook", weight: "700", url: "https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap" },
      { name: "Fruktur", label: "Fruktur", weight: "400", url: "https://fonts.googleapis.com/css2?family=Fruktur&display=swap" },
      { name: "Grenze Gotisch", label: "Grenze Gotisch", weight: "700", url: "https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@700&display=swap" },
      { name: "Grenze", label: "Grenze", weight: "700", url: "https://fonts.googleapis.com/css2?family=Grenze:wght@700&display=swap" },
      { name: "Texturina", label: "Texturina", weight: "700", url: "https://fonts.googleapis.com/css2?family=Texturina:wght@700&display=swap" },
    ],
  },
  {
    label: "Gothic & Medieval",
    fonts: [
      { name: "Pirata One", label: "Pirata One", weight: "400", url: "https://fonts.googleapis.com/css2?family=Pirata+One&display=swap" },
      { name: "MedievalSharp", label: "MedievalSharp", weight: "400", url: "https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap" },
      { name: "Almendra", label: "Almendra", weight: "700", url: "https://fonts.googleapis.com/css2?family=Almendra:wght@700&display=swap" },
      { name: "Almendra Display", label: "Almendra Display", weight: "400", url: "https://fonts.googleapis.com/css2?family=Almendra+Display&display=swap" },
      { name: "Astloch", label: "Astloch", weight: "700", url: "https://fonts.googleapis.com/css2?family=Astloch:wght@700&display=swap" },
      { name: "Uncial Antiqua", label: "Uncial Antiqua", weight: "400", url: "https://fonts.googleapis.com/css2?family=Uncial+Antiqua&display=swap" },
    ],
  },
  {
    label: "Ornate & Display",
    fonts: [
      { name: "Cinzel Decorative", label: "Cinzel Decorative", weight: "700", url: "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" },
      { name: "Cinzel", label: "Cinzel", weight: "700", url: "https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" },
      { name: "Playfair Display", label: "Playfair Display", weight: "700", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" },
      { name: "Abril Fatface", label: "Abril Fatface", weight: "400", url: "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap" },
      { name: "Monoton", label: "Monoton", weight: "400", url: "https://fonts.googleapis.com/css2?family=Monoton&display=swap" },
      { name: "Bungee Shade", label: "Bungee Shade", weight: "400", url: "https://fonts.googleapis.com/css2?family=Bungee+Shade&display=swap" },
    ],
  },
  {
    label: "System Fonts",
    fonts: [
      { name: "serif", label: "System Serif", weight: "bold", url: null },
      { name: "sans-serif", label: "System Sans", weight: "bold", url: null },
      { name: "monospace", label: "Monospace", weight: "bold", url: null },
    ],
  },
];

const ALL_FONTS = FONT_CATEGORIES.flatMap((c) => c.fonts);

function loadFont(font) {
  return new Promise((resolve) => {
    if (!font.url) return resolve();
    if (document.querySelector(`link[href="${font.url}"]`)) return resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = font.url;
    link.onload = () => setTimeout(resolve, 400);
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

function pixelateChar({ char, fontFamily, fontWeight, gridSize, offsetX = 0, offsetY = 0, scale = 1.0, threshold = 128 }) {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, gridSize, gridSize);
  const fontSize = gridSize * scale;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, gridSize / 2 + offsetX, gridSize / 2 + offsetY);
  const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
  const pixels = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      const i = (y * gridSize + x) * 4;
      const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      row.push(brightness < threshold ? 1 : 0);
    }
    pixels.push(row);
  }
  return pixels;
}

function renderSmooth({ char, fontFamily, fontWeight, size, offsetX = 0, offsetY = 0, scale = 1.0 }) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);
  const fontSize = size * scale;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, size / 2 + offsetX * (size / 20), size / 2 + offsetY * (size / 20));
  return canvas.toDataURL();
}

const PixelGrid = ({ pixels, cellSize, gap, showGrid, color = "#0a0a0a" }) => {
  const gridSize = pixels.length;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gap: `${gap}px`,
        width: "fit-content",
      }}
    >
      {pixels.flat().map((filled, i) => (
        <div
          key={i}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: filled ? color : showGrid ? "rgba(0,0,0,0.04)" : "transparent",
            borderRadius: gap > 1 ? 1 : 0,
            transition: "background-color 0.12s ease",
          }}
        />
      ))}
    </div>
  );
};

export default function PixelFontRenderer() {
  const [char, setChar] = useState("A");
  const [gridSize, setGridSize] = useState(24);
  const [selectedFont, setSelectedFont] = useState(ALL_FONTS[0]);
  const [fontsLoaded, setFontsLoaded] = useState(new Set());
  const [pixels, setPixels] = useState([]);
  const [smoothImg, setSmoothImg] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gap, setGap] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(0.85);
  const [threshold, setThreshold] = useState(128);
  const [view, setView] = useState("side-by-side");
  const [pixelColor, setPixelColor] = useState("#0a0a0a");
  const [customFontName, setCustomFontName] = useState("");
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [customFonts, setCustomFonts] = useState([]);
  const [fontSearch, setFontSearch] = useState("");

  useEffect(() => {
    ALL_FONTS.forEach((f) => {
      loadFont(f).then(() => setFontsLoaded((prev) => new Set([...prev, f.name])));
    });
  }, []);

  const generate = useCallback(() => {
    if (!char || !selectedFont) return;
    const p = pixelateChar({
      char, fontFamily: selectedFont.name, fontWeight: selectedFont.weight || "bold",
      gridSize, offsetX, offsetY, scale, threshold,
    });
    setPixels(p);
    const img = renderSmooth({
      char, fontFamily: selectedFont.name, fontWeight: selectedFont.weight || "bold",
      size: 400, offsetX, offsetY, scale,
    });
    setSmoothImg(img);
  }, [char, selectedFont, gridSize, offsetX, offsetY, scale, threshold]);

  useEffect(() => { generate(); }, [generate]);

  const addCustomFont = async () => {
    if (!customFontName.trim()) return;
    setLoadingCustom(true);
    const url = customFontUrl.trim() || `https://fonts.googleapis.com/css2?family=${encodeURIComponent(customFontName.trim())}&display=swap`;
    const newFont = { name: customFontName.trim(), label: `✦ ${customFontName.trim()}`, weight: "400", url };
    await loadFont(newFont);
    setCustomFonts((prev) => [...prev, newFont]);
    setSelectedFont(newFont);
    setCustomFontName("");
    setCustomFontUrl("");
    setLoadingCustom(false);
  };

  const exportSVG = () => {
    if (!pixels.length) return;
    const cs = 10, g = gap;
    const size = pixels.length * (cs + g) - g;
    let rects = "";
    for (let y = 0; y < pixels.length; y++)
      for (let x = 0; x < pixels[y].length; x++)
        if (pixels[y][x])
          rects += `<rect x="${x * (cs + g)}" y="${y * (cs + g)}" width="${cs}" height="${cs}" fill="${pixelColor}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = `pixel-${char}-${gridSize}px.svg`;
    a.click();
  };

  const exportPNG = () => {
    if (!pixels.length) return;
    const cs = 10, g = gap;
    const size = pixels.length * (cs + g) - g;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = pixelColor;
    for (let y = 0; y < pixels.length; y++)
      for (let x = 0; x < pixels[y].length; x++)
        if (pixels[y][x])
          ctx.fillRect(x * (cs + g), y * (cs + g), cs, cs);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `pixel-${char}-${gridSize}px.png`;
    a.click();
  };

  const exportCSS = () => {
    if (!pixels.length) return;
    let shadows = [];
    for (let y = 0; y < pixels.length; y++)
      for (let x = 0; x < pixels[y].length; x++)
        if (pixels[y][x])
          shadows.push(`${x}em ${y}em 0 ${pixelColor}`);
    navigator.clipboard.writeText(`.pixel-char {\n  width: 1em;\n  height: 1em;\n  box-shadow:\n    ${shadows.join(",\n    ")};\n}`);
    alert("CSS box-shadow copied to clipboard!");
  };

  const cellSize = Math.min(20, Math.max(4, Math.floor(340 / gridSize)));
  const allFonts = [...ALL_FONTS, ...customFonts];
  const filteredCategories = fontSearch.trim()
    ? [{ label: "Search Results", fonts: allFonts.filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase())) }]
    : [...FONT_CATEGORIES, ...(customFonts.length ? [{ label: "Custom Fonts", fonts: customFonts }] : [])];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f3", fontFamily: "'IBM Plex Mono', monospace", color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: 28, borderBottom: "2px solid #1a1a1a", paddingBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>
            Pixel Font Renderer
          </h1>
          <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
            TTF → pixel grid · 18 built-in blackletter &amp; gothic fonts · add any Google Font
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>
          {/* Left panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 10 }}>
              <div>
                <Label>Char</Label>
                <input type="text" value={char}
                  onChange={(e) => setChar(e.target.value.slice(-1) || "A")}
                  maxLength={1}
                  style={{
                    width: "100%", fontSize: 36, fontWeight: 600, textAlign: "center",
                    padding: "6px", border: "2px solid #1a1a1a", background: "white",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <Label>Search fonts</Label>
                <input type="text" value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  placeholder="Filter..."
                  style={{
                    width: "100%", padding: "10px 8px", fontSize: 12,
                    border: "2px solid #1a1a1a", background: "white",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{
              border: "2px solid #1a1a1a", background: "white",
              maxHeight: 280, overflowY: "auto",
            }}>
              {filteredCategories.map((cat) => (
                <div key={cat.label}>
                  <div style={{
                    fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                    color: "#999", padding: "8px 10px 4px", background: "#fafaf8",
                    borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 1,
                  }}>
                    {cat.label}
                  </div>
                  {cat.fonts.map((f) => (
                    <button key={f.name + f.label} onClick={() => setSelectedFont(f)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "7px 10px", fontSize: 12, fontFamily: "inherit",
                        border: "none", borderBottom: "1px solid #f0f0f0",
                        background: selectedFont?.name === f.name ? "#1a1a1a" : "transparent",
                        color: selectedFont?.name === f.name ? "white" : "#1a1a1a",
                        cursor: "pointer",
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #ddd", padding: 10, background: "white" }}>
              <Label>Add any Google Font</Label>
              <input type="text" value={customFontName}
                onChange={(e) => setCustomFontName(e.target.value)}
                placeholder='Font name, e.g. "Eagle Lake"'
                onKeyDown={(e) => e.key === "Enter" && addCustomFont()}
                style={inputStyle}
              />
              <input type="text" value={customFontUrl}
                onChange={(e) => setCustomFontUrl(e.target.value)}
                placeholder="CSS URL (optional — auto-generated)"
                style={{ ...inputStyle, marginTop: 4, fontSize: 10, color: "#888" }}
              />
              <button onClick={addCustomFont}
                disabled={!customFontName.trim() || loadingCustom}
                style={{ ...btnStyle, width: "100%", marginTop: 6, opacity: !customFontName.trim() ? 0.4 : 1 }}>
                {loadingCustom ? "Loading..." : "+ Add Font"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <Label>Grid: {gridSize}×{gridSize}</Label>
                <input type="range" min={8} max={64} value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#1a1a1a" }} />
              </div>
              <div>
                <Label>Scale: {Math.round(scale * 100)}%</Label>
                <input type="range" min={40} max={160} value={Math.round(scale * 100)}
                  onChange={(e) => setScale(Number(e.target.value) / 100)}
                  style={{ width: "100%", accentColor: "#1a1a1a" }} />
              </div>
              <div>
                <Label>Threshold: {threshold}</Label>
                <input type="range" min={32} max={224} value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#1a1a1a" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <Label>X Offset: {offsetX}</Label>
                  <input type="range" min={-10} max={10} value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#1a1a1a" }} />
                </div>
                <div>
                  <Label>Y Offset: {offsetY}</Label>
                  <input type="range" min={-10} max={10} value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#1a1a1a" }} />
                </div>
              </div>
              <div>
                <Label>Gap: {gap}px</Label>
                <input type="range" min={0} max={4} value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#1a1a1a" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <div>
                  <Label>Color</Label>
                  <input type="color" value={pixelColor} onChange={(e) => setPixelColor(e.target.value)}
                    style={{ width: "100%", height: 30, border: "2px solid #1a1a1a", cursor: "pointer", padding: 1 }} />
                </div>
                <button onClick={() => setShowGrid(!showGrid)}
                  style={{ ...btnStyle, marginTop: 18, fontSize: 10, padding: "6px 4px",
                    background: showGrid ? "#1a1a1a" : "white", color: showGrid ? "white" : "#1a1a1a" }}>
                  Grid {showGrid ? "On" : "Off"}
                </button>
                <select value={view} onChange={(e) => setView(e.target.value)}
                  style={{ ...btnStyle, marginTop: 18, fontSize: 10, padding: "6px 2px" }}>
                  <option value="side-by-side">Compare</option>
                  <option value="pixel">Pixel</option>
                  <option value="smooth">Smooth</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #ddd", paddingTop: 12, display: "flex", gap: 6 }}>
              <button onClick={exportSVG} style={{ ...btnStyle, flex: 1 }}>SVG</button>
              <button onClick={exportPNG} style={{ ...btnStyle, flex: 1 }}>PNG</button>
              <button onClick={exportCSS} style={{ ...btnStyle, flex: 1 }}>CSS</button>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "flex", gap: 24, justifyContent: "center", alignItems: "center",
              flexWrap: "wrap", background: "white", border: "2px solid #1a1a1a",
              padding: 28, minHeight: 380,
            }}>
              {(view === "pixel" || view === "side-by-side") && pixels.length > 0 && (
                <div style={{ textAlign: "center" }}>
                  <PixelGrid pixels={pixels} cellSize={cellSize} gap={gap} showGrid={showGrid} color={pixelColor} />
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {gridSize}×{gridSize} · {selectedFont?.label}
                  </div>
                </div>
              )}
              {(view === "smooth" || view === "side-by-side") && smoothImg && (
                <div style={{ textAlign: "center" }}>
                  <img src={smoothImg} alt={`Smooth ${char}`}
                    style={{ width: gridSize * (cellSize + gap) - gap, height: gridSize * (cellSize + gap) - gap, imageRendering: "auto" }} />
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Vector</div>
                </div>
              )}
            </div>

            <div style={{ background: "white", border: "2px solid #1a1a1a", padding: 20 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 14 }}>
                Resolution Comparison
              </div>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
                {[8, 12, 16, 24, 32, 48].map((size) => {
                  const p = pixelateChar({
                    char, fontFamily: selectedFont.name, fontWeight: selectedFont.weight || "bold",
                    gridSize: size, offsetX, offsetY, scale, threshold,
                  });
                  const cs = Math.max(2, Math.floor(110 / size));
                  return (
                    <div key={size} style={{ textAlign: "center" }}>
                      <PixelGrid pixels={p} cellSize={cs} gap={size <= 12 ? 1 : 0} showGrid={false} color={pixelColor} />
                      <div style={{ fontSize: 9, color: "#bbb", marginTop: 5 }}>{size}px</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "white", border: "2px solid #1a1a1a", padding: 20 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 14 }}>
                All Blackletter &amp; Gothic Fonts · "{char}" at 16px
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
                {FONT_CATEGORIES.slice(0, 2).flatMap(c => c.fonts).map((f) => {
                  const p = pixelateChar({
                    char, fontFamily: f.name, fontWeight: f.weight || "bold",
                    gridSize: 16, offsetX: 0, offsetY: 0, scale, threshold,
                  });
                  return (
                    <button key={f.name} onClick={() => setSelectedFont(f)}
                      style={{
                        background: selectedFont?.name === f.name ? "#f5f0eb" : "transparent",
                        border: selectedFont?.name === f.name ? "2px solid #1a1a1a" : "2px solid #eee",
                        padding: 8, cursor: "pointer", textAlign: "center",
                        transition: "all 0.15s ease",
                      }}>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <PixelGrid pixels={p} cellSize={5} gap={0} showGrid={false} color={pixelColor} />
                      </div>
                      <div style={{
                        fontSize: 8, color: "#888", marginTop: 6,
                        fontFamily: "'IBM Plex Mono', monospace",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {f.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#f0ede8", padding: 16, fontSize: 11, lineHeight: 1.7, color: "#666" }}>
              <strong style={{ color: "#1a1a1a" }}>Adding more fonts:</strong> Type any Google Font name
              into the "Add any Google Font" field — the CSS URL is auto-generated. Try these gothic/medieval options:{" "}
              <code style={codeStyle}>Eagle Lake</code>,{" "}
              <code style={codeStyle}>IM Fell English SC</code>,{" "}
              <code style={codeStyle}>Almendra SC</code>,{" "}
              <code style={codeStyle}>New Rocker</code>,{" "}
              <code style={codeStyle}>Ewert</code>,{" "}
              <code style={codeStyle}>Risque</code>,{" "}
              <code style={codeStyle}>Metamorphous</code>,{" "}
              <code style={codeStyle}>Jolly Lodger</code>.
              For non-Google fonts, paste a full CSS URL instead.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Label = ({ children }) => (
  <div style={{
    fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
    color: "#999", marginBottom: 4, fontWeight: 500,
  }}>{children}</div>
);

const inputStyle = {
  width: "100%", padding: "6px 8px", fontSize: 11,
  border: "1px solid #ccc", fontFamily: "'IBM Plex Mono', monospace",
  boxSizing: "border-box",
};

const btnStyle = {
  padding: "7px 10px", fontSize: 11,
  fontFamily: "'IBM Plex Mono', monospace",
  textTransform: "uppercase", letterSpacing: "0.06em",
  border: "2px solid #1a1a1a", background: "white",
  color: "#1a1a1a", cursor: "pointer",
};

const codeStyle = { background: "#e0ddd8", padding: "1px 5px", borderRadius: 2 };
