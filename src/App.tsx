import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleHelp,
  Crown,
  Flower2,
  Gem,
  Heart,
  Leaf,
  Pencil,
  Share2,
  Sparkles,
  Star,
  Sun,
  Undo2,
  Users,
  X,
} from "lucide-react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

type Shape = "petal" | "dot" | "leaf" | "diamond" | "star" | "diya";
type TemplateId = "festival" | "lotus" | "sunrise" | "mehndi";
type Motif = {
  id: string;
  x: number;
  y: number;
  color: string;
  kind: Shape;
  rotation: number;
  author: string;
};
type Person = { name: string; color: string };

const templates: {
  id: TemplateId;
  name: string;
  subtitle: string;
  color: string;
}[] = [
  {
    id: "festival",
    name: "Festival",
    subtitle: "Petal glow",
    color: "#e8a248",
  },
  { id: "lotus", name: "Lotus", subtitle: "Soft bloom", color: "#d95770" },
  { id: "sunrise", name: "Sunrise", subtitle: "Golden rays", color: "#e8844b" },
  { id: "mehndi", name: "Mehndi", subtitle: "Garden vines", color: "#66875c" },
];
const shapes: { id: Shape; name: string; icon: typeof Flower2 }[] = [
  { id: "petal", name: "Petal", icon: Flower2 },
  { id: "leaf", name: "Leaf", icon: Leaf },
  { id: "diamond", name: "Diamond", icon: Gem },
  { id: "star", name: "Star", icon: Star },
  { id: "diya", name: "Diya", icon: Sun },
  { id: "dot", name: "Dot", icon: Sparkles },
];

const colors = [
  { name: "Marigold", value: "#e89a28" },
  { name: "Rose", value: "#d95770" },
  { name: "Peacock", value: "#247e78" },
  { name: "Indigo", value: "#5559a8" },
  { name: "Coral", value: "#eb7253" },
  { name: "Leaf", value: "#78924e" },
];
function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function FlowerMark({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-30 -30 60 60" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={i}
          cx="0"
          cy="-14"
          rx="6.4"
          ry="12"
          fill={color}
          transform={`rotate(${i * 45})`}
        />
      ))}
      <circle r="5" fill="#f7c85d" />
      <circle r="2" fill="#fff4d9" />
    </svg>
  );
}

function Stamp({ shape, color }: { shape: Shape; color: string }) {
  if (shape === "dot")
    return (
      <>
        <circle r="8" fill={color} opacity=".23" />
        <circle r="4.5" fill={color} stroke="#fff8ec" strokeWidth="1.5" />
      </>
    );
  if (shape === "leaf")
    return (
      <>
        <path
          d="M0 12C-15 4-12-10 1-14C14-8 13 5 0 12Z"
          fill={color}
          stroke="#fff8ec"
          strokeWidth="1.5"
        />
        <path d="M-7 6 7-8" stroke="#fff8ec" strokeWidth="1.2" opacity=".85" />
      </>
    );
  if (shape === "diamond")
    return (
      <>
        <path
          d="M0-12 11 0 0 12-11 0Z"
          fill={color}
          stroke="#fff8ec"
          strokeWidth="1.5"
        />
        <path d="M0-7 6 0 0 7-6 0Z" fill="#fff8ec" opacity=".55" />
      </>
    );
  if (shape === "star")
    return (
      <>
        <path
          d="M0-13 3.2-4.2 12-4 5.2 1.6 7.8 10 0 5.4-7.8 10-5.2 1.6-12-4-3.2-4.2Z"
          fill={color}
          stroke="#fff8ec"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle r="2" fill="#fff8ec" />
      </>
    );
  if (shape === "diya")
    return (
      <>
        <path
          d="M-12 1Q0 15 12 1Q8 10 0 10Q-8 10-12 1Z"
          fill={color}
          stroke="#fff8ec"
          strokeWidth="1.5"
        />
        <path
          d="M0-13Q-7-5 0-2Q7-5 0-13Z"
          fill="#f6c85e"
          stroke={color}
          strokeWidth="1"
        />
        <path
          d="M-7 2Q0 5 7 2"
          fill="none"
          stroke="#fff8ec"
          strokeWidth="1.2"
        />
      </>
    );
  return (
    <>
      <circle r="15" fill={color} opacity=".14" />
      {Array.from({ length: 6 }, (_, j) => (
        <ellipse
          key={j}
          cx="0"
          cy="-7"
          rx="3.4"
          ry="6.2"
          fill={color}
          transform={`rotate(${j * 60})`}
        />
      ))}
      <circle r="2.6" fill="#f6c85e" />
    </>
  );
}

function TemplateOrnament({
  template,
  count,
  radius,
  color,
}: {
  template: TemplateId;
  count: number;
  radius: number;
  color: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <g
          key={`${template}-${i}`}
          transform={`rotate(${(i * 360) / count} 320 320)`}
        >
          {template === "sunrise" ? (
            <>
              <path
                d={`M320 ${320 - radius - 25} L${320 + 13} ${320 - radius + 10} L${320 - 13} ${320 - radius + 10}Z`}
                fill={color}
                opacity=".75"
              />
              <circle cx="320" cy={320 - radius - 12} r="2.5" fill="#fff8e8" />
            </>
          ) : template === "mehndi" ? (
            <>
              <path
                d={`M320 ${320 - radius - 20}C${320 + 22} ${320 - radius - 7} ${320 + 16} ${320 - radius + 18} 320 ${320 - radius + 22}C${320 - 16} ${320 - radius + 18} ${320 - 22} ${320 - radius - 7} 320 ${320 - radius - 20}Z`}
                fill={color}
                opacity=".72"
                stroke="#fff8e8"
                strokeWidth="1.2"
              />
              <path
                d={`M320 ${320 - radius - 12}Q${320 + 2} ${320 - radius + 2} 320 ${320 - radius + 13}`}
                fill="none"
                stroke="#fff8e8"
                strokeWidth="1"
              />
            </>
          ) : (
            <>
              <ellipse
                cx="320"
                cy={320 - radius}
                rx={template === "lotus" ? 10 : 8}
                ry={template === "lotus" ? 26 : 20}
                fill={color}
                opacity=".72"
                stroke="#fff8e8"
                strokeWidth="1.2"
              />
              <ellipse
                cx="320"
                cy={320 - radius}
                rx="2.5"
                ry="9"
                fill="#fff8e8"
                opacity=".65"
              />
            </>
          )}
        </g>
      ))}
    </>
  );
}

function App() {
  const roomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const found = params.get("room");
    if (found) return found;
    const created = `rangoli-${makeId()}`;
    params.set("room", created);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
    return created;
  }, []);
  const [username, setUsername] = useState(() => {
    try {
      return (
        localStorage.getItem("rangoli-username")?.trim() || "Rangoli maker"
      );
    } catch {
      return "Rangoli maker";
    }
  });
  const [nameDraft, setNameDraft] = useState(username);
  const [nameOpen, setNameOpen] = useState(false);
  const motifsRef = useRef<Y.Array<Motif> | null>(null);
  const awarenessRef = useRef<{
    setLocalStateField: (field: string, value: unknown) => void;
  } | null>(null);
  const [motifs, setMotifs] = useState<Motif[]>([]);
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [symmetry, setSymmetry] = useState(8);
  const [rotation, setRotation] = useState(0);
  const [tool, setTool] = useState<Shape>("petal");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("festival");
  const [people, setPeople] = useState<Person[]>([]);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState("You joined the circle");
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const sharedMotifs = doc.getArray<Motif>("motifs");
    const sharedDesign = doc.getMap<TemplateId>("design");
    motifsRef.current = sharedMotifs;
    const provider = new WebrtcProvider(roomId, doc);
    awarenessRef.current = provider.awareness;

    const refreshMotifs = () => setMotifs(sharedMotifs.toArray());
    const refreshDesign = () => {
      const template = sharedDesign.get("template");
      if (template && templates.some(option => option.id === template))
        setSelectedTemplate(template);
    };
    const refreshPeople = () => {
      const active = Array.from(provider.awareness.getStates().values())
        .map(state => state.user as Person | undefined)
        .filter((person): person is Person =>
          Boolean(person?.name && person?.color),
        );
      setPeople(active);
    };
    const onSync = () => setConnected(true);
    sharedMotifs.observe(refreshMotifs);
    sharedDesign.observe(refreshDesign);
    provider.awareness.on("change", refreshPeople);
    provider.on("synced", onSync);
    refreshMotifs();
    if (!sharedDesign.has("template")) sharedDesign.set("template", "festival");
    refreshDesign();
    refreshPeople();

    return () => {
      sharedMotifs.unobserve(refreshMotifs);
      sharedDesign.unobserve(refreshDesign);
      provider.awareness.off("change", refreshPeople);
      provider.off("synced", onSync);
      provider.destroy();
      awarenessRef.current = null;
      doc.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    awarenessRef.current?.setLocalStateField("user", {
      name: username,
      color: selectedColor,
    });
    try {
      localStorage.setItem("rangoli-username", username);
    } catch {
      // The edited name still applies for this tab if storage is unavailable.
    }
  }, [username, selectedColor]);

  function addMotif(event: MouseEvent<SVGSVGElement>) {
    if (!motifsRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 640;
    const y = ((event.clientY - bounds.top) / bounds.height) * 640;
    motifsRef.current.push([
      {
        id: makeId(),
        x,
        y,
        color: selectedColor,
        kind: tool,
        rotation,
        author: username,
      },
    ]);
    const colorName =
      colors.find(color => color.value === selectedColor)?.name.toLowerCase() ??
      "colorful";
    const shapeName =
      shapes.find(shape => shape.id === tool)?.name.toLowerCase() ?? "shapes";
    const pluralShape = shapeName === "leaf" ? "leaves" : `${shapeName}s`;
    setActivity(`You added ${colorName} ${pluralShape}`);
  }

  function chooseTemplate(template: TemplateId) {
    setSelectedTemplate(template);
    const doc = motifsRef.current?.doc;
    doc?.getMap<TemplateId>("design").set("template", template);
    setActivity(
      `You chose the ${templates.find(item => item.id === template)?.name} template`,
    );
  }

  function undoLast() {
    const shared = motifsRef.current;
    if (!shared?.length) return;
    shared.delete(shared.length - 1, 1);
    setActivity("You undid the last flourish");
  }

  function clearCanvas() {
    const shared = motifsRef.current;
    if (!shared?.length) return;
    shared.delete(0, shared.length);
    setActivity("The canvas is ready for a fresh start");
  }

  async function copyInvite() {
    const invite = new URL(window.location.href);
    invite.searchParams.set("room", roomId);
    try {
      await navigator.clipboard.writeText(invite.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this studio invite link:", invite.toString());
    }
  }

  function getArtworkSvg() {
    const svg = document.querySelector(".rangoli-art");
    if (!svg) return null;
    const artwork = svg.cloneNode(true) as SVGSVGElement;
    artwork.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(artwork);
  }

  function downloadArtwork() {
    const serialized = getArtworkSvg();
    if (!serialized) return;
    const blob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "our-rangoli.svg";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUsername = nameDraft.trim().replace(/\s+/g, " ");
    if (nextUsername.length < 2 || nextUsername.length > 30) return;
    setUsername(nextUsername);
    setNameOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Rangoli studio home">
          <span className="brand-flower">
            <FlowerMark color="#e89a28" size={30} />
          </span>
          <span className="brand-name">
            rangoli<span>.</span>
          </span>
          <span className="brand-divider" />
          <span className="brand-studio">circle studio</span>
        </a>
        <div className="top-actions">
          <button
            className="icon-button help-button"
            onClick={() => setHelpOpen(true)}
            aria-label="How to use the studio"
          >
            <CircleHelp size={18} />
          </button>
          <div
            className="presence-pill"
            title={
              connected ? "Connected to this studio" : "Connecting to studio"
            }
          >
            <span className={`live-dot ${connected ? "is-live" : ""}`} />
            <span>{connected ? "Live studio" : "Joining studio"}</span>
          </div>
          <div
            className="avatar-stack"
            aria-label={`${people.length} people in the studio`}
          >
            {people.slice(0, 3).map((person, index) => (
              <span
                className="avatar"
                key={`${person.name}-${index}`}
                style={{ background: person.color }}
                title={person.name}
              >
                {person.name.charAt(0).toUpperCase()}
              </span>
            ))}
            {people.length > 3 && (
              <span className="avatar avatar-extra">+{people.length - 3}</span>
            )}
          </div>
          <span className="people-count">
            <Users size={15} /> {people.length} here
          </span>
          <button
            className="username-button"
            onClick={() => {
              setNameDraft(username);
              setNameOpen(true);
            }}
            title="Edit your username"
          >
            <span>{username}</span>
            <Pencil size={13} />
          </button>
          <button className="share-button" onClick={copyInvite}>
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? "Link copied" : "Invite friends"}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="project-label">
            <span className="eyebrow">YOUR SHARED CANVAS</span>
            <button className="more-button" aria-label="Project options">
              <ChevronDown size={15} />
            </button>
          </div>
          <h1>
            {selectedTemplate === "festival" ? (
              <>
                Festival of
                <br />
                little lights
              </>
            ) : (
              `${templates.find(item => item.id === selectedTemplate)?.name} garden`
            )}
          </h1>
          <p className="project-subtitle">
            {templates.find(item => item.id === selectedTemplate)?.subtitle} ·
            made together
          </p>
          <div className="project-meta">
            <span className="status-badge">
              <span /> In progress
            </span>
            <span className="meta-separator">·</span>
            <span>{Math.max(motifs.length, 12)} details</span>
          </div>

          <section className="tool-section template-section">
            <div className="section-heading">
              <span>Start with a template</span>
              <span className="color-label">
                {templates.find(item => item.id === selectedTemplate)?.name}
              </span>
            </div>
            <div
              className="template-grid"
              role="group"
              aria-label="Choose a shared Rangoli template"
            >
              {templates.map(template => (
                <button
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? "selected" : ""}`}
                  onClick={() => chooseTemplate(template.id)}
                  aria-pressed={selectedTemplate === template.id}
                >
                  <svg
                    className="template-preview"
                    viewBox="0 0 36 36"
                    aria-hidden="true"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="#fffaf0"
                      stroke="#e9d9bd"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="10"
                      fill="none"
                      stroke={template.color}
                      strokeDasharray="1 2"
                    />
                    {Array.from(
                      { length: template.id === "sunrise" ? 8 : 6 },
                      (_, i) => (
                        <ellipse
                          key={i}
                          cx="18"
                          cy="8"
                          rx="2"
                          ry="5"
                          fill={template.color}
                          opacity=".78"
                          transform={`rotate(${i * (template.id === "sunrise" ? 45 : 60)} 18 18)`}
                        />
                      ),
                    )}
                    <circle cx="18" cy="18" r="3" fill={template.color} />
                  </svg>
                  <span className="template-copy">
                    <strong>{template.name}</strong>
                    <small>{template.subtitle}</small>
                  </span>
                  {selectedTemplate === template.id && (
                    <Check className="template-check" size={13} />
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="tool-section">
            <div className="section-heading">
              <span>Pick a color</span>
              <span className="color-label">
                {colors.find(color => color.value === selectedColor)?.name}
              </span>
            </div>
            <div
              className="color-palette"
              role="group"
              aria-label="Choose a color"
            >
              {colors.map(color => (
                <button
                  key={color.value}
                  className={`color-swatch ${selectedColor === color.value ? "selected" : ""}`}
                  style={{ "--swatch": color.value } as CSSProperties}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                  aria-label={`${color.name} color`}
                />
              ))}
            </div>
          </section>

          <section className="tool-section tool-section-line">
            <div className="section-heading">
              <span>Choose a shape</span>
            </div>
            <div
              className="shape-grid"
              role="group"
              aria-label="Choose a drawing shape"
            >
              {shapes.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  className={`shape-choice ${tool === id ? "active" : ""}`}
                  onClick={() => setTool(id)}
                  aria-pressed={tool === id}
                >
                  <Icon size={15} />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="tool-section symmetry-section">
            <div className="section-heading">
              <span>Symmetry</span>
              <span className="color-label">{symmetry}-fold</span>
            </div>
            <div
              className="symmetry-options"
              role="group"
              aria-label="Choose symmetry"
            >
              {[4, 6, 8, 12].map(number => (
                <button
                  key={number}
                  className={symmetry === number ? "chosen" : ""}
                  onClick={() => setSymmetry(number)}
                >
                  {number}
                </button>
              ))}
            </div>
          </section>

          <section className="tool-section rotation-section">
            <div className="section-heading">
              <span>Angle adjustment</span>
              <span className="color-label">{rotation}°</span>
            </div>
            <div className="rotation-control">
              <input
                type="range"
                min="0"
                max="345"
                step="15"
                value={rotation}
                onChange={event => setRotation(Number(event.target.value))}
                aria-label="Rotate the selected shape"
                style={
                  {
                    "--range-progress": `${(rotation / 345) * 100}%`,
                  } as CSSProperties
                }
              />
              <div className="rotation-ends">
                <span>0°</span>
                <span>345°</span>
              </div>
            </div>
            <span className="outward-note">
              Shapes automatically face outward
            </span>
          </section>

          <div className="sidebar-bottom">
            <div className="tip-card">
              <span className="tip-icon">
                <Sparkles size={16} />
              </span>
              <p>
                <strong>Little tip</strong>
                <br />
                Every mark repeats around the circle. Tap anywhere and see the
                magic.
              </p>
            </div>
            <button className="mini-invite" onClick={copyInvite}>
              <Users size={16} /> Bring someone in <span>↗</span>
            </button>
          </div>
        </aside>

        <section className="studio-area" aria-label="Shared rangoli workspace">
          <div className="studio-heading">
            <div>
              <span className="eyebrow">MADE BETTER TOGETHER</span>
              <h2>Our Rangoli</h2>
            </div>
            <div className="studio-actions">
              <button
                className="quiet-button"
                onClick={undoLast}
                disabled={!motifs.length}
              >
                <Undo2 size={16} /> Undo
              </button>
              <button className="quiet-button" onClick={downloadArtwork}>
                <ArrowDownToLine size={16} /> Save art
              </button>
              <button
                className="more-button clear-button"
                onClick={clearCanvas}
                title="Clear custom marks"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="canvas-wrap">
            <div className="canvas-note">
              <span className="note-spark">✳</span>
              <span>Click anywhere to add a flourish</span>
            </div>
            <svg
              className="rangoli-art"
              viewBox="0 0 640 640"
              role="img"
              aria-label="Interactive symmetrical Rangoli canvas. Click to add petals or dots."
              onClick={addMotif}
            >
              <defs>
                <radialGradient id="canvasGlow">
                  <stop stopColor="#fffaf0" />
                  <stop offset="1" stopColor="#fcf8ef" />
                </radialGradient>
                <pattern
                  id="tinyDots"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="1" fill="#e8ddc9" opacity=".52" />
                </pattern>
              </defs>
              <circle cx="320" cy="320" r="302" fill="url(#canvasGlow)" />
              <circle cx="320" cy="320" r="298" fill="url(#tinyDots)" />
              <circle
                cx="320"
                cy="320"
                r="283"
                fill="none"
                stroke="#e9d9bd"
                strokeWidth="1"
                strokeDasharray="2 8"
              />
              <circle
                cx="320"
                cy="320"
                r="258"
                fill="none"
                stroke="#e9d9bd"
                strokeWidth="1"
              />
              <circle
                cx="320"
                cy="320"
                r="225"
                fill="none"
                stroke="#eadfcf"
                strokeWidth="1"
                strokeDasharray="1 7"
              />
              <circle
                cx="320"
                cy="320"
                r="174"
                fill="none"
                stroke="#eee2d0"
                strokeWidth="1"
              />
              <TemplateOrnament
                template={selectedTemplate}
                count={selectedTemplate === "mehndi" ? 12 : 8}
                radius={selectedTemplate === "sunrise" ? 259 : 238}
                color={
                  templates.find(item => item.id === selectedTemplate)?.color ??
                  "#e8a248"
                }
              />
              {Array.from({ length: 24 }, (_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x = 320 + Math.cos(angle) * 270;
                const y = 320 + Math.sin(angle) * 270;
                return (
                  <circle
                    key={`bead-${i}`}
                    cx={x}
                    cy={y}
                    r={i % 3 === 0 ? 3.3 : 2}
                    fill={i % 3 === 0 ? "#e8a248" : "#d9c5a6"}
                  />
                );
              })}
              {selectedTemplate === "festival" &&
                Array.from({ length: 8 }, (_, i) => (
                  <g key={`guide-${i}`} transform={`rotate(${i * 45} 320 320)`}>
                    <path
                      d="M320 75 C294 111 294 145 320 167 C346 145 346 111 320 75Z"
                      fill="#f6e8cb"
                      stroke="#e8d4ad"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M320 88 Q311 120 320 148"
                      fill="none"
                      stroke="#e8a248"
                      strokeWidth="1.5"
                      opacity=".62"
                    />
                    <circle cx="320" cy="80" r="3" fill="#e89a28" />
                  </g>
                ))}
              {selectedTemplate === "lotus" && (
                <TemplateOrnament
                  template="lotus"
                  count={16}
                  radius={188}
                  color="#d95770"
                />
              )}
              {selectedTemplate === "sunrise" &&
                Array.from({ length: 16 }, (_, i) => (
                  <g
                    key={`sun-orbit-${i}`}
                    transform={`rotate(${i * 22.5} 320 320)`}
                  >
                    <circle
                      cx="320"
                      cy="195"
                      r="5"
                      fill="#f3dba9"
                      stroke="#e8844b"
                      strokeWidth="1.2"
                    />
                    <circle cx="320" cy="195" r="1.7" fill="#fff8e8" />
                  </g>
                ))}
              {selectedTemplate === "mehndi" && (
                <TemplateOrnament
                  template="mehndi"
                  count={16}
                  radius={187}
                  color="#66875c"
                />
              )}
              {selectedTemplate !== "sunrise" &&
                Array.from(
                  { length: selectedTemplate === "mehndi" ? 12 : 16 },
                  (_, i) => (
                    <g
                      key={`inner-${i}`}
                      transform={`rotate(${(i * 360) / (selectedTemplate === "mehndi" ? 12 : 16)} 320 320)`}
                    >
                      <ellipse
                        cx="320"
                        cy="193"
                        rx="11"
                        ry="25"
                        fill={
                          selectedTemplate === "lotus"
                            ? i % 2
                              ? "#f4d7e1"
                              : "#f1bac9"
                            : selectedTemplate === "mehndi"
                              ? i % 2
                                ? "#e4ead5"
                                : "#d6e4d8"
                              : i % 2
                                ? "#f4d7cc"
                                : "#d6e4d8"
                        }
                        stroke={
                          selectedTemplate === "lotus"
                            ? "#d95770"
                            : selectedTemplate === "mehndi"
                              ? "#78924e"
                              : i % 2
                                ? "#dc9587"
                                : "#8caf91"
                        }
                        strokeWidth="1.2"
                      />
                      <circle cx="320" cy="193" r="3" fill="#fff9ed" />
                    </g>
                  ),
                )}
              <circle
                cx="320"
                cy="320"
                r="91"
                fill="#fffaf0"
                stroke="#e6bd79"
                strokeWidth="1.5"
              />
              <circle
                cx="320"
                cy="320"
                r="78"
                fill="none"
                stroke="#ebd8b8"
                strokeWidth="1"
                strokeDasharray="1 6"
              />
              {Array.from({ length: 12 }, (_, i) => (
                <g key={`center-${i}`} transform={`rotate(${i * 30} 320 320)`}>
                  <ellipse
                    cx="320"
                    cy="283"
                    rx="9"
                    ry="22"
                    fill={
                      selectedTemplate === "lotus"
                        ? i % 2
                          ? "#d95770"
                          : "#e89a28"
                        : selectedTemplate === "mehndi"
                          ? i % 2
                            ? "#66875c"
                            : "#e89a28"
                          : selectedTemplate === "sunrise"
                            ? i % 2
                              ? "#e8844b"
                              : "#e8a248"
                            : i % 2
                              ? "#e89a28"
                              : "#d95770"
                    }
                    opacity=".88"
                  />
                </g>
              ))}
              <circle cx="320" cy="320" r="17" fill="#247e78" />
              <circle cx="320" cy="320" r="8" fill="#f8d46d" />
              <circle cx="320" cy="320" r="3" fill="#fff8e8" />
              {motifs.map(motif =>
                Array.from({ length: symmetry }, (_, i) => {
                  const angle = (i * 360) / symmetry;
                  const radians = (angle * Math.PI) / 180;
                  const dx = motif.x - 320;
                  const dy = motif.y - 320;
                  const x =
                    320 + dx * Math.cos(radians) - dy * Math.sin(radians);
                  const y =
                    320 + dx * Math.sin(radians) + dy * Math.cos(radians);
                  const outwardAngle =
                    Math.hypot(dx, dy) < 1
                      ? 0
                      : (Math.atan2(dy, dx) * 180) / Math.PI + 90;
                  return (
                    <g
                      key={`${motif.id}-${i}`}
                      transform={`translate(${x} ${y}) rotate(${outwardAngle + angle + (motif.rotation ?? 0)})`}
                      pointerEvents="none"
                    >
                      <Stamp shape={motif.kind} color={motif.color} />
                    </g>
                  );
                }),
              )}
            </svg>
            <div className="canvas-bottom-note">
              <span className="mini-flower">
                <FlowerMark color="#e89a28" size={19} />
              </span>
              <span>A shared canvas, blooming in real time</span>
            </div>
          </div>

          <div className="activity-bar">
            <p>
              <strong>
                {activity.startsWith("You") ? "You" : activity.split(" ")[0]}
              </strong>{" "}
              {activity.startsWith("You")
                ? activity.slice(4)
                : activity.slice(activity.indexOf(" ") + 1)}
            </p>
            <span className="activity-time">just now</span>
            <button
              className="heart-button"
              aria-label="Send appreciation"
              onClick={() => setActivity("You sent a little love to the group")}
            >
              <Heart size={17} />
            </button>
          </div>
        </section>

        <aside className="right-rail">
          <div className="rail-title">
            <span className="eyebrow">IN THIS CIRCLE</span>
            <span className="count-chip">{people.length}</span>
          </div>
          <div className="people-list">
            {people.slice(0, 5).map((person, i) => (
              <div className="person-row" key={`${person.name}-${i}`}>
                <span
                  className="avatar person-avatar"
                  style={{ background: person.color }}
                >
                  {person.name.charAt(0).toUpperCase()}
                </span>
                <span className="person-name">{person.name}</span>
                <span className="person-online" />
              </div>
            ))}
            {people.length === 0 && (
              <p className="people-empty">Waiting for people to join…</p>
            )}
          </div>
          <button className="rail-invite" onClick={copyInvite}>
            <span className="plus-symbol">+</span> Invite a friend
          </button>
          <div className="rail-divider" />
          <div className="activity-title">
            <span className="eyebrow">LITTLE MOMENTS</span>
          </div>
          <div className="moment live-moment">
            <span className="moment-icon live-moment-icon">
              <span />
            </span>
            <p>
              <strong>
                {activity.startsWith("You") ? "You" : activity.split(" ")[0]}
              </strong>{" "}
              {activity.startsWith("You")
                ? activity.slice(4)
                : activity.slice(activity.indexOf(" ") + 1)}
              <small>just now</small>
            </p>
          </div>
          <div className="circle-card">
            <span className="circle-card-icon">
              <Crown size={16} />
            </span>
            <strong>Good things grow together.</strong>
            <p>Every little detail is part of the story you’re making.</p>
            <div className="tiny-flowers">
              <FlowerMark color="#d95770" size={18} />
              <FlowerMark color="#e89a28" size={18} />
              <FlowerMark color="#247e78" size={18} />
            </div>
          </div>
          <div className="room-code">
            ROOM <span>{roomId.slice(-7).toUpperCase()}</span>
          </div>
        </aside>
      </div>

      {helpOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setHelpOpen(false)}
        >
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setHelpOpen(false)}
              aria-label="Close help"
            >
              <X size={18} />
            </button>
            <span className="modal-flower">
              <FlowerMark color="#e89a28" size={37} />
            </span>
            <span className="eyebrow">A LITTLE GUIDE</span>
            <h2 id="help-title">Make something lovely.</h2>
            <p>
              Pick a color and choose petals or dots. Tap anywhere on the
              Rangoli and your mark will bloom in {symmetry}-fold symmetry.
            </p>
            <p>
              Invite friends to the same studio link to create together.
              Everyone’s marks appear on the shared canvas as they’re made.
            </p>
            <button
              className="share-button modal-done"
              onClick={() => setHelpOpen(false)}
            >
              <Check size={16} /> Got it
            </button>
          </section>
        </div>
      )}
      {nameOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setNameOpen(false)}
        >
          <section
            className="help-modal username-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="username-title"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setNameOpen(false)}
              aria-label="Close username editor"
            >
              <X size={18} />
            </button>
            <span className="modal-flower username-modal-icon">
              <Pencil size={25} />
            </span>
            <span className="eyebrow">YOUR STUDIO NAME</span>
            <h2 id="username-title">What should we call you?</h2>
            <p>Your name is shown to everyone in this Rangoli circle.</p>
            <form className="username-form" onSubmit={saveUsername}>
              <label htmlFor="studio-username">Username</label>
              <input
                id="studio-username"
                type="text"
                autoComplete="nickname"
                maxLength={30}
                minLength={2}
                placeholder="Your name"
                value={nameDraft}
                onChange={event => setNameDraft(event.target.value)}
                required
              />
              <button className="share-button username-submit" type="submit">
                <Check size={16} /> Save name
              </button>
            </form>
          </section>
        </div>
      )}
      <footer className="mobile-footer">
        <button onClick={undoLast} disabled={!motifs.length}>
          <Undo2 size={17} /> Undo
        </button>
        <button onClick={copyInvite}>
          <Share2 size={17} /> Invite
        </button>
        <button onClick={downloadArtwork}>
          <ArrowDownToLine size={17} /> Save
        </button>
      </footer>
    </main>
  );
}

export default App;
