"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Music, Sparkles, Volume2, ArrowLeft, Video, Flame, Crown, Home, LayoutGrid, FolderOpen, User, ArrowRight } from "lucide-react";

interface Clip {
  id: string;
  name: string;
  url: string;
  duration: number;
  text: string;
  motion: "zoomIn" | "panRight" | "zoomOut" | "pulse";
}

const aiThumb = (p: string, seed: number) =>
  "https://" + "image.pollinations.ai/prompt/" + encodeURIComponent(p) + "?width=400&height=550&nologo=true&seed=" + seed;

const FEATURE_CARDS = [
  { id: "story", title: "AI Story", img: aiThumb("glowing golden fairy flying in dark enchanted forest, 3d digital art", 11), style: "3D Pixar animation style, magical glowing fairy tale forest, 8k", lines: ["In a hidden glowing forest, a tiny fairy found an ancient golden key!", "The night sky lit up with stardust as the secret portal opened!", "Her magical adventure across the clouds had just begun!"] },
  { id: "motion", title: "Motion Control", img: aiThumb("two cool kids hip hop dancing on sunny street, dynamic camera shot", 22), style: "Dynamic street dance action shot, vibrant lighting, wide angle, 8k", lines: ["Feel the rhythm take over every single move!", "Dynamic camera motion turns simple clips into viral reels!", "Create studio-level dance edits in seconds!"] },
  { id: "transform", title: "Character Transformation", img: aiThumb("futuristic silver and purple cybernetic armored superhero portrait", 33), style: "Futuristic cybernetic armor transformation, glowing neon energy, 8k", lines: ["One spark of energy awakened the cyber armor!", "Titanium and neon light fused together in mid-air!", "The ultimate AI guardian is ready for action!"] },
  { id: "collab", title: "Multi-Person Collab", img: aiThumb("happy young couple smiling together warm cinematic portrait", 44), style: "Cinematic warm portrait, golden hour glow, 8k photorealistic", lines: ["Two worlds collided under the golden sunset!", "Every frame tells a story worth sharing!", "Make your moments unforgettable with Gremora AI!"] },
];

const TRENDING_CARDS = [
  { title: "Iconic Moments", img: aiThumb("stylish elderly woman playing basketball in arena, dramatic sports photo", 55), style: "Dramatic sports arena photography, spotlight, 8k", lines: ["Age is just a number when passion leads the game!", "Every shot counts when the crowd is watching!", "Create iconic viral moments with AI!"] },
  { title: "Music Trends", img: aiThumb("wizard DJ wearing purple star robe at glowing neon music festival", 66), style: "Neon music festival stage, colorful laser lights, 8k", lines: ["Drop the beat and let the magic take control!", "Sync your visuals with trending festival vibes!", "Turn any idea into a music video!"] },
  { title: "Camera Moves", img: aiThumb("giant floating brick flying over highway, surreal cinematic camera move", 77), style: "Surreal cinematic action shot, dramatic sky, 8k", lines: ["Break the laws of physics with AI camera moves!", "Smooth tracking shots that hook viewers instantly!", "Direct your own blockbuster scene!"] },
];

const STORY_POSTERS = [
  { title: "Fruit People Story", badge: "BERRY ROYAL", img: aiThumb("3d pixar cute strawberry queen wearing golden crown in royal palace", 88), style: "3D Pixar animation style, cute strawberry royal character, palace lighting, 8k", lines: ["Welcome to Berry Royal, where the Strawberry Queen rules with kindness!", "A mysterious shadow threatened the sweet kingdom!", "With courage and magic, she saved Berry Royal forever!"] },
  { title: "AI Short Dramas", badge: "Still Yours", img: aiThumb("romantic couple looking at each other in rain at night, movie poster", 99), style: "Emotional romantic movie still, rain reflections, cinematic lighting, 8k", lines: ["Years passed, yet their hearts never forgot that rainy night!", "One unspoken promise brought them face to face again!", "Some love stories are written in the stars!"] },
  { title: "Fairy Tales", badge: "MAGIC", img: aiThumb("cute baby green dragon sitting on treasure chest in fantasy cave, 3d", 111), style: "3D fantasy fairy tale animation, cute baby dragon, glowing crystals, 8k", lines: ["Deep inside Crystal Cave lived a friendly little dragon!", "He guarded a secret map to the Sky Castle!", "Join the magical journey beyond the rainbow!"] },
];

export default function GremoraFilmoraClone() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [navTab, setNavTab] = useState<"home" | "templates" | "drafts" | "mine">("home");
  const [projectTitle, setProjectTitle] = useState("AI Story");
  const [artStyle, setArtStyle] = useState(FEATURE_CARDS.style);
  const [scriptText, setScriptText] = useState(FEATURE_CARDS.lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips;
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const buildVideo = (linesRaw: string, stylePrompt: string) => {
    const lines = linesRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const motions: ("zoomIn" | "panRight" | "zoomOut" | "pulse")[] = ["zoomIn", "panRight", "zoomOut", "pulse"];

    const built: Clip[] = lines.map((line, i) => {
      const id = "sc-" + Date.now() + "-" + i;
      const prompt = encodeURIComponent(`${stylePrompt}, ${line}`);
      const aiUrl = "https://" + "image.pollinations.ai/prompt/" + prompt + "?width=720&height=1280&nologo=true&seed=" + (300 + i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = aiUrl;
      mediaRef.current[id] = img;
      return { id, name: `Scene ${i + 1}`, url: aiUrl, duration: 4, text: line, motion: motions[i % motions.length] };
    });

    setClips(built);
    if (built) setSel(built.id);
  };

  const launchPreset = (title: string, style: string, lines: string[]) => {
    setProjectTitle(title);
    setArtStyle(style);
    const joined = lines.join("\n");
    setScriptText(joined);
    buildVideo(joined, style);
    setScreen("editor");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => {
      const id = "up-" + Date.now() + "-" + i;
      const url = URL.createObjectURL(f);
      if (f.type.startsWith("video")) {
        const v = document.createElement("video"); v.src = url; v.muted = true; v.loop = true; mediaRef.current[id] = v;
      } else {
        const img = new Image(); img.src = url; mediaRef.current[id] = img;
      }
      return { id, name: f.name.slice(0, 14), url, duration: 4, text: "", motion: "zoomIn" };
    });
    setClips((p) => [...p, ...added]);
    if (added) setSel(added.id);
  };

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.;
    if (file) setAudioUrl(URL.createObjectURL(file));
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#05070a"; ctx.fillRect(0, 0, c.width, c.height);

    let acc = 0, cur = clips, local = 0;
    for (const item of clips) {
      if (t >= acc && t < acc + item.duration) { cur = item; local = t - acc; break; }
      acc += item.duration;
    }

    if (speak && voiceOn && cur.text && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.text);
      u.lang = /[\u0900-\u097F]/.test(cur.text) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }

    const p = Math.min(local / cur.duration, 1);
    ctx.save();
    ctx.filter = "contrast(1.1) saturate(1.15)";
    if (cur.motion === "zoomIn") { const s = 1 + p * 0.16; ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-c.width / 2, -c.height / 2); }
    else if (cur.motion === "zoomOut") { const s = 1.16 - p * 0.16; ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-c.width / 2, -c.height / 2); }
    else if (cur.motion === "pulse") { const s = 1.05 + Math.sin(p * Math.PI * 4) * 0.04; ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-c.width / 2, -c.height / 2); }
    else { ctx.translate(-p * 40, 0); ctx.scale(1.1, 1.1); }

    const el = mediaRef.current[cur.id];
    const ready = el instanceof HTMLImageElement ? el.complete && el.naturalWidth > 0 : Boolean(el);
    if (el && ready) {
      if (el instanceof HTMLVideoElement && playing && el.paused) el.play().catch(() => {});
      ctx.drawImage(el, 0, 0, c.width, c.height);
    } else {
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#065f46");
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.restore();

    if (cur.text) {
      ctx.fillStyle = "rgba(0,0,0,0.74)";
      ctx.fillRect(32, c.height - 210, c.width - 64, 125);
      ctx.font = "900 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#a3e635";
      ctx.fillText(cur.text.slice(0, 36), c.width / 2, c.height - 140);
    }
  };

   useEffect(() => {
    if (screen !== "editor") return;
    if (!playing) {
      drawFrame(time, false);
      audioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      lastSpokenRef.current = "";
      return;
    }
    if (audioRef.current && audioUrl) audioRef.current.play().catch(() => {});
    const start = performance.now() - time * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const next = (now - start) / 1000;
      if (next >= total) { setTime(0); setPlaying(false); return; }
      setTime(next); drawFrame(next, true); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips, voiceOn, screen]);

  const exportVid = () => {
    const c = canvasRef.current; if (!c) return;
    setPlaying(false); setExportUrl("");
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
    rec.start();
    const start = performance.now();
    const step = (now: number) => {
      const sec = (now - start) / 1000;
      drawFrame(sec, false);
      if (sec < total) requestAnimationFrame(step); else rec.stop();
    };
    requestAnimationFrame(step);
  };

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-[#07080b] text-white pb-24 font-sans">
        <div className="max-w-3xl mx-auto p-4 space-y-5">
          <div className="flex items-center justify-between">
            <div className="bg-lime-400 text-black w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-5 h-5" /></div>
            <span className="text-xs font-extrabold text-lime-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">GREMORA AI PRO</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => launchPreset("New Project", FEATURE_CARDS[0].style, FEATURE_CARDS[0].lines)} className="col-span-2 bg-gradient-to-r from-lime-400 via-emerald-300 to-cyan-300 text-black rounded-2xl py-5 px-4 flex items-center justify-center gap-2.5 font-black text-lg shadow-lg hover:opacity-95 cursor-pointer">
              <span className="bg-black text-lime-400 p-1 rounded-full"><Plus className="w-4 h-4" /></span>
              New Project
            </button>
            <button onClick={() => launchPreset("Marketing Video", "Luxury commercial product ad, studio lighting, 8k", ["Upgrade your style today!", "Built for modern creators!", "Get 50% off right now!"])} className="bg-emerald-50 hover:bg-white text-black rounded-2xl p-3 flex items-center justify-center gap-1.5 font-extrabold text-xs cursor-pointer">
              <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-black">AD</span>
              <span>Marketing Video</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURE_CARDS.map((card) => (
              <div key={card.id} onClick={() => launchPreset(card.title, card.style, card.lines)} className="relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-lime-400 rounded-2xl p-3.5 h-28 flex items-center justify-between cursor-pointer group">
                <div className="z-10 flex flex-col justify-between h-full max-w-[55%]">
                  <h3 className="font-bold text-sm leading-snug">{card.title}</h3>
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-black">›</div>
                </div>
                <img src={card.img} alt={card.title} className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition" />
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <h2 className="font-black text-base flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-lime-400" /> Trending</h2>
            <div className="grid grid-cols-3 gap-3">
              {TRENDING_CARDS.map((t) => (
                <div key={t.title} onClick={() => launchPreset(t.title, t.style, t.lines)} className="space-y-1.5 cursor-pointer group">
                  <div className="overflow-hidden rounded-2xl border border-zinc-800 group-hover:border-lime-400 h-36 bg-zinc-900">
                    <img src={t.img} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <p className="text-xs font-bold text-center text-zinc-200">{t.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <h2 className="font-black text-base flex items-center gap-1.5"><Flame className="w-4 h-4 text-amber-400" /> AI Story</h2>
            <div className="grid grid-cols-3 gap-3">
              {STORY_POSTERS.map((s) => (
                <div key={s.title} onClick={() => launchPreset(s.title, s.style, s.lines)} className="relative overflow-hidden rounded-2xl border border-zinc-800 hover:border-lime-400 h-44 bg-zinc-900 cursor-pointer group">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black leading-tight">{s.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white shrink-0" />
                    </div>
                    <span className="bg-amber-400/90 text-black text-[9px] font-black px-2 py-0.5 rounded w-fit">{s.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0c0e14]/95 backdrop-blur border-t border-zinc-800 py-2.5 px-6 flex justify-around items-center max-w-3xl mx-auto">
          {[{ id: "home", label: "Home", icon: Home }, { id: "templates", label: "Templates", icon: LayoutGrid }, { id: "drafts", label: "Drafts", icon: FolderOpen }, { id: "mine", label: "Mine", icon: User }].map((tab) => (
            <button key={tab.id} onClick={() => { setNavTab(tab.id as "home" | "templates" | "drafts" | "mine"); if (tab.id === "templates") launchPreset("AI Story Templates", STORY_POSTERS[0].style, STORY_POSTERS[0].lines); }} className={`flex flex-col items-center gap-1 cursor-pointer ${navTab === tab.id ? "text-lime-400" : "text-zinc-500"}`}>
              <tab.icon className="w-5 h-5" /><span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2.5">
          <button onClick={() => { setPlaying(false); setScreen("home"); }} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
          <span className="font-black text-base text-lime-400">{projectTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
          <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export</button>
          {exportUrl && <a href={exportUrl} download="gremora-story.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl">Save Video</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <label className="text-xs font-bold text-lime-400 block">Story Script (हर लाइन नया सीन बनेगी)</label>
          <textarea rows={5} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs" />
          <button onClick={() => buildVideo(scriptText, artStyle)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><Sparkles className="w-4 h-4" /> Generate AI Video</button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-lime-400"><Plus className="inline w-3.5 h-3.5 mr-1" /> Add Clips<input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" /></label>
            <label className="border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400"><Music className="inline w-3.5 h-3.5 mr-1" /> Add Music<input type="file" accept="audio/*" onChange={handleAudio} className="hidden" /></label>
          </div>
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
        </div>

        <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} width={720} height={1280} className="max-h-[410px] w-auto rounded-xl bg-zinc-900" />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setPlaying(!playing)} className="bg-lime-400 text-black p-2.5 rounded-full cursor-pointer">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
            <span className="text-xs font-mono">{time.toFixed(1)}s / {total}s</span>
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
          <div className="font-bold text-lime-400">Scene Controls</div>
          {activeClip && (
            <>
              <div><label className="text-zinc-400">Subtitle Text</label><input value={activeClip.text} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, text: e.target.value } : x)))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
              <div><label className="text-zinc-400">Camera Motion</label><select value={activeClip.motion} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, motion: e.target.value as "zoomIn" | "panRight" | "zoomOut" | "pulse" } : x)))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1"><option value="zoomIn">Zoom In</option><option value="zoomOut">Zoom Out</option><option value="panRight">Camera Pan</option><option value="pulse">Beat Pulse</option></select></div>
              <div><label className="text-zinc-400">Duration: {activeClip.duration}s</label><input type="range" min={2} max={12} value={activeClip.duration} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, duration: Number(e.target.value) } : x)))} className="w-full accent-lime-400" /></div>
            </>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 flex gap-2 overflow-x-auto">
        {clips.map((c, i) => (
          <div key={c.id} onClick={() => { setSel(c.id); setPlaying(false); }} className={`p-2.5 rounded-xl border min-w-[145px] flex justify-between items-center cursor-pointer ${sel === c.id ? "border-lime-400 bg-lime-950/30" : "border-zinc-700 bg-zinc-800"}`}>
            <span className="text-xs font-bold truncate">{i + 1}. {c.name} ({c.duration}s)</span>
            {clips.length > 1 && <Trash2 onClick={(e) => { e.stopPropagation(); setClips((p) => p.filter((x) => x.id !== c.id)); }} className="w-3.5 h-3.5 text-red-400 shrink-0 ml-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}

