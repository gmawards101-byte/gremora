"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Music, Sparkles, Volume2, ArrowLeft, Wand2, Video, Flame, Crown, Image as ImageIcon, Type, Clapperboard, Scissors, Captions, Eraser, Home, LayoutGrid, FolderOpen, User, ArrowUpRight } from "lucide-react";

interface Clip {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  duration: number;
  text: string;
  motion: "zoomIn" | "panRight" | "zoomOut" | "pulse";
}

const PRESETS = [
  { id: "story", title: "AI Story", sub: "Fantasy & 3D Tales", style: "3D Pixar animation style, magical glowing fairy tale forest, 8k", lines: ["In a hidden glowing forest, a tiny fairy discovered an ancient key!", "The sky lit up with golden stardust as the secret gate opened!", "Her magical adventure across the clouds had just begun!"] },
  { id: "motion", title: "Motion Control", sub: "Dynamic Camera FX", style: "Cinematic street dance action shot, neon rim lighting, dynamic angle, 8k", lines: ["Feel the rhythm take over every single move!", "Dynamic camera angles turn ordinary clips into viral reels!", "Create studio-level motion in seconds!"] },
  { id: "transform", title: "Character Transformation", sub: "Cyber & Hero Look", style: "Futuristic cybernetic armor transformation, glowing blue energy, epic 8k", lines: ["One spark of energy awakened the cyber armor!", "Metal and neon light fused together in mid-air!", "The next-gen hero is ready for action!"] },
  { id: "collab", title: "Multi-Person Collab", sub: "Couple & Duet Reels", style: "Cinematic romantic sunset portrait, warm golden hour glow, 8k photorealistic", lines: ["Two worlds collided under the golden sunset!", "Every frame tells a story worth sharing!", "Make your moments unforgettable with Gremora AI!"] },
];

export default function GremoraFilmoraApp() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [activeTab, setActiveTab] = useState<"entertainment" | "marketing">("entertainment");
  const [navTab, setNavTab] = useState<"home" | "templates" | "drafts" | "mine">("home");
  const [projectTitle, setProjectTitle] = useState("Motion Control");
  const [artStyle, setArtStyle] = useState(PRESETS[0].style);
  const [scriptText, setScriptText] = useState(PRESETS[0].lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [ultraHd, setUltraHd] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const buildVideo = (linesRaw: string, stylePrompt: string) => {
    const lines = linesRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const motions: ("zoomIn" | "panRight" | "zoomOut" | "pulse")[] = ["zoomIn", "panRight", "zoomOut", "pulse"];

    const built: Clip[] = lines.map((line, i) => {
      const id = "clip-" + Date.now() + "-" + i;
      const prompt = encodeURIComponent(`${stylePrompt}, ${line}`);
      const aiUrl = "https://" + "image.pollinations.ai/prompt/" + prompt + "?width=720&height=1280&nologo=true&seed=" + (200 + i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = aiUrl;
      mediaRef.current[id] = img;
      return { id, name: `Scene ${i + 1}`, type: "image", url: aiUrl, duration: 4, text: line, motion: motions[i % motions.length] };
    });

    setClips(built);
    if (built[0]) setSel(built[0].id);
  };

  const launchMode = (title: string, style: string, lines: string[]) => {
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
      const isVid = f.type.startsWith("video");
      if (isVid) {
        const v = document.createElement("video");
        v.src = url; v.muted = true; v.loop = true;
        mediaRef.current[id] = v;
      } else {
        const img = new Image(); img.src = url;
        mediaRef.current[id] = img;
      }
      return { id, name: f.name.slice(0, 14), type: isVid ? "video" : "image", url, duration: 4, text: "", motion: "zoomIn" };
    });
    setClips((p) => [...p, ...added]);
    if (added[0]) setSel(added[0].id);
  };

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioUrl(URL.createObjectURL(file));
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current;
    if (!c || !clips.length) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, c.width, c.height);

    let acc = 0, cur = clips[0], local = 0;
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
    if (ultraHd) ctx.filter = "contrast(1.12) saturate(1.18)";
    if (cur.motion === "zoomIn") {
      const s = 1 + p * 0.16;
      ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-c.width / 2, -c.height / 2);
    } else if (cur.motion === "zoomOut") {
      const s = 1.16 - p * 0.16;
      ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-c.width / 2, -c.height / 2);
    } else if (cur.motion === "pulse") {
      const s = 1.05 + Math.sin(p * Math.PI * 4) * 0.04;
      ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-c.width / 2, -c.height / 2);
    } else {
      ctx.translate(-p * 40, 0); ctx.scale(1.1, 1.1);
    }

    const el = mediaRef.current[cur.id];
    const ready = el instanceof HTMLImageElement ? el.complete && el.naturalWidth > 0 : Boolean(el);
    if (el && ready) {
      if (el instanceof HTMLVideoElement && playing && el.paused) el.play().catch(() => {});
      ctx.drawImage(el, 0, 0, c.width, c.height);
    } else {
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#172554"); g.addColorStop(0.5, "#065f46"); g.addColorStop(1, "#090d16");
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.restore();

    if (captionsOn && cur.text) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(32, c.height - 220, c.width - 64, 130);
      ctx.font = "900 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#a3e635";
      const mid = Math.ceil(cur.text.length / 2);
      const sp = cur.text.indexOf(" ", mid - 6);
      if (cur.text.length > 26 && sp > 0) {
        ctx.fillText(cur.text.slice(0, sp), c.width / 2, c.height - 165);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(cur.text.slice(sp + 1), c.width / 2, c.height - 118);
      } else {
        ctx.fillText(cur.text, c.width / 2, c.height - 142);
      }
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
  }, [playing, clips, voiceOn, captionsOn, ultraHd, screen]);

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
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 border border-zinc-800 p-6 flex items-center justify-between min-h-[175px]">
            <div className="space-y-2 z-10">
              <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-5 h-5" /></div>
              <h1 className="text-3xl font-black leading-tight tracking-tight">Motion<br />Control</h1>
              <p className="text-xs text-zinc-300">GREMORA AI Video Studio</p>
            </div>
            <div className="flex items-center gap-3 z-10">
              <div onClick={() => launchMode("Motion Control", PRESETS[1].style, PRESETS[1].lines)} className="w-24 h-36 rounded-2xl bg-gradient-to-b from-amber-500/30 to-purple-600/30 border border-white/20 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition">
                <Play className="w-7 h-7 text-white fill-white" />
                <span className="text-[10px] font-bold mt-1">3.9K ✨</span>
              </div>
              <button onClick={() => launchMode("Motion Control", PRESETS[1].style, PRESETS[1].lines)} className="bg-zinc-800/90 hover:bg-lime-400 hover:text-black p-3 rounded-full border border-zinc-700 cursor-pointer transition">
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => launchMode("New AI Project", PRESETS[0].style, PRESETS[0].lines)} className="col-span-2 bg-gradient-to-r from-lime-400 via-emerald-300 to-cyan-300 text-black rounded-2xl py-5 px-4 flex items-center justify-center gap-2.5 font-black text-lg shadow-lg hover:opacity-95 cursor-pointer">
              <span className="bg-black text-lime-400 p-1 rounded-full"><Plus className="w-4 h-4" /></span>
              New Project
            </button>
            <button onClick={() => launchMode("Marketing Video", "Commercial product studio advertisement, luxury lighting, 8k", ["Upgrade your lifestyle today!", "Smart features built for modern creators!", "Order now and get 50% off!"])} className="bg-emerald-50 hover:bg-white text-black rounded-2xl p-3 flex flex-col items-center justify-center text-center font-extrabold text-xs cursor-pointer">
              <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-black mb-1">AD</span>
              Marketing Video
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div onClick={() => launchMode("Image to Video", PRESETS[0].style, PRESETS[0].lines)} className="relative bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer">
              <span className="absolute -top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Omni</span>
              <div className="bg-lime-400/20 text-lime-400 p-2.5 rounded-xl"><ImageIcon className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Image to Video</span>
            </div>
            <div onClick={() => launchMode("Text to Video", PRESETS[0].style, PRESETS[0].lines)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer">
              <div className="bg-emerald-400/20 text-emerald-400 p-2.5 rounded-xl"><Type className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Text to Video</span>
            </div>
            <div onClick={() => launchMode("AI Video Gen", PRESETS[0].style, PRESETS[0].lines)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer">
              <div className="bg-cyan-400/20 text-cyan-400 p-2.5 rounded-xl"><Clapperboard className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Video Gen</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1 text-center">
            {[{ label: "AI Auto Cut", icon: Scissors }, { label: "AI Ultra HD", icon: Sparkles }, { label: "Retouch", icon: Wand2 }, { label: "AI Remover", icon: Eraser }, { label: "AI Captions", icon: Captions }].map((item) => (
              <button key={item.label} onClick={() => launchMode(item.label, PRESETS[0].style, PRESETS[0].lines)} className="flex flex-col items-center gap-1.5 text-zinc-300 hover:text-lime-400 cursor-pointer">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl"><item.icon className="w-4 h-4" /></div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-5 border-b border-zinc-900 pb-2">
              <button onClick={() => setActiveTab("entertainment")} className={`text-base font-black cursor-pointer ${activeTab === "entertainment" ? "text-white border-b-2 border-lime-400 pb-1" : "text-zinc-500"}`}>Entertainment</button>
              <button onClick={() => setActiveTab("marketing")} className={`text-base font-black cursor-pointer ${activeTab === "marketing" ? "text-white border-b-2 border-lime-400 pb-1" : "text-zinc-500"}`}>Marketing</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((card) => (
                <div key={card.id} onClick={() => launchMode(card.title, card.style, card.lines)} className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border border-zinc-800 hover:border-lime-400 rounded-2xl p-4 flex flex-col justify-between min-h-[105px] cursor-pointer transition">
                  <div><h3 className="font-bold text-sm">{card.title}</h3><p className="text-[11px] text-zinc-400 mt-0.5">{card.sub}</p></div>
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-black">›</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <h2 className="font-black text-base flex items-center gap-1.5"><Flame className="w-4 h-4 text-lime-400" /> Trending</h2>
            <div className="grid grid-cols-3 gap-3">
              {["Iconic Moments", "Music Trends", "Camera Moves"].map((trend, i) => (
                <div key={trend} onClick={() => launchMode(trend, PRESETS[i % PRESETS.length].style, PRESETS[i % PRESETS.length].lines)} className="bg-zinc-900 border border-zinc-800 hover:border-lime-400 rounded-2xl p-3 cursor-pointer">
                  <div className="h-20 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-lime-400/20 flex items-center justify-center mb-2"><Sparkles className="w-5 h-5 text-lime-400" /></div>
                  <p className="text-xs font-bold text-center">{trend}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0c0e14]/95 backdrop-blur border-t border-zinc-800 py-2.5 px-6 flex justify-around items-center max-w-3xl mx-auto">
          {[{ id: "home", label: "Home", icon: Home }, { id: "templates", label: "Templates", icon: LayoutGrid }, { id: "drafts", label: "Drafts", icon: FolderOpen }, { id: "mine", label: "Mine", icon: User }].map((tab) => (
            <button key={tab.id} onClick={() => { setNavTab(tab.id as "home" | "templates" | "drafts" | "mine"); if (tab.id === "templates") launchMode("AI Templates", PRESETS[0].style, PRESETS[0].lines); }} className={`flex flex-col items-center gap-1 cursor-pointer ${navTab === tab.id ? "text-lime-400" : "text-zinc-500"}`}>
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
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setCaptionsOn(!captionsOn)} className={`text-xs font-bold px-3 py-2 rounded-xl cursor-pointer ${captionsOn ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>CC Captions: {captionsOn ? "ON" : "OFF"}</button>
          <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
          <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export</button>
          {exportUrl && <a href={exportUrl} download="gremora-pro.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl">Save Video</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <label className="text-xs font-bold text-lime-400 block">AI Video Style</label>
          <select value={artStyle} onChange={(e) => setArtStyle(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-xs">
            <option value={PRESETS[0].style}>3D Pixar AI Story</option>
            <option value={PRESETS[1].style}>Motion Control Action</option>
            <option value={PRESETS[2].style}>Character Transformation</option>
            <option value={PRESETS[3].style}>Cinematic Drama</option>
          </select>
          <label className="text-xs font-bold text-lime-400 block">Script (हर लाइन नया AI सीन बनेगी)</label>
          <textarea rows={4} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs" />
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
            <button onClick={() => setUltraHd(!ultraHd)} className={`text-[10px] font-bold px-2 py-1 rounded ${ultraHd ? "bg-lime-400/20 text-lime-400" : "bg-zinc-800 text-zinc-400"}`}>Ultra HD {ultraHd ? "ON" : "OFF"}</button>
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
          <div className="font-bold text-lime-400">Scene Controls</div>
          {activeClip && (
            <>
              <div><label className="text-zinc-400">AI Caption Text</label><input value={activeClip.text} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, text: e.target.value } : x)))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
              <div><label className="text-zinc-400">Motion Control</label><select value={activeClip.motion} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, motion: e.target.value as "zoomIn" | "panRight" | "zoomOut" | "pulse" } : x)))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1"><option value="zoomIn">Zoom In</option><option value="zoomOut">Zoom Out</option><option value="panRight">Camera Pan</option><option value="pulse">Beat Pulse</option></select></div>
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
