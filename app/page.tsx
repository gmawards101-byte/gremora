"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Music, Sparkles, Volume2, ArrowLeft, Flame, Crown, Image as ImageIcon, Type, Clapperboard, Home, LayoutGrid, FolderOpen, User, ArrowUpRight } from "lucide-react";

interface Clip {
  id: string;
  name: string;
  theme: "space" | "neon" | "cyber" | "sunset";
  videoUrl?: string;
  duration: number;
  text: string;
}

const FEATURE_CARDS: { id: string; title: string; sub: string; theme: "space" | "neon" | "cyber" | "sunset"; grad: string; lines: string[] }[] = [
  { id: "story", title: "AI Story", sub: "Magic & Space Tales", theme: "space", grad: "from-indigo-600 via-purple-600 to-pink-500", lines: ["In a galaxy beyond imagination, a new story begins!", "Every star holds a secret waiting to be discovered!", "Create viral AI stories in seconds!"] },
  { id: "motion", title: "Motion Control", sub: "Neon Dance & Beats", theme: "neon", grad: "from-lime-500 via-emerald-500 to-cyan-500", lines: ["Feel the neon rhythm take over the night!", "High-energy motion visuals built for viral Reels!", "Edit like a pro with Gremora AI!"] },
  { id: "transform", title: "Cyber City", sub: "Futuristic Waves", theme: "cyber", grad: "from-cyan-500 via-blue-600 to-indigo-700", lines: ["Welcome to the future of digital creation!", "Powered by next-gen AI motion technology!", "Turn simple text into cinema!"] },
  { id: "collab", title: "Lifestyle & Sunset", sub: "Golden Hour Vibes", theme: "sunset", grad: "from-amber-500 via-orange-500 to-rose-600", lines: ["Golden sunsets and unforgettable memories!", "Share your journey with the world!", "Make every moment cinematic!"] },
];

export default function GremoraProVideoStudio() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [projectTitle, setProjectTitle] = useState("Motion Control");
  const [scriptText, setScriptText] = useState(FEATURE_CARDS[0].lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoEls = useRef<Record<string, HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const generateRealVideo = (linesRaw: string, defaultTheme: "space" | "neon" | "cyber" | "sunset" = "neon") => {
    const lines = linesRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const themes: ("space" | "neon" | "cyber" | "sunset")[] = [defaultTheme, "neon", "cyber", "sunset", "space"];

    const built: Clip[] = lines.map((line, i) => ({
      id: "sc-" + Date.now() + "-" + i,
      name: `Scene ${i + 1}`,
      theme: themes[i % themes.length],
      duration: 4,
      text: line,
    }));

    setClips(built);
    if (built[0]) setSel(built[0].id);
  };

  const openPreset = (title: string, lines: string[], theme: "space" | "neon" | "cyber" | "sunset" = "neon") => {
    setProjectTitle(title);
    const joined = lines.join("\n");
    setScriptText(joined);
    generateRealVideo(joined, theme);
    setScreen("editor");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => {
      const id = "up-" + Date.now() + "-" + i;
      const url = URL.createObjectURL(f);
      const v = document.createElement("video");
      v.src = url; v.muted = true; v.loop = true; v.playsInline = true; v.load();
      videoEls.current[id] = v;
      return { id, name: f.name.slice(0, 14), theme: "neon", videoUrl: url, duration: 5, text: "" };
    });
    setClips((p) => [...p, ...added]);
    if (added[0]) setSel(added[0].id);
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

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

    const v = cur.videoUrl ? videoEls.current[cur.id] : null;
    if (v && v.readyState >= 2) {
      if (playing && v.paused) v.play().catch(() => {});
      const scale = Math.max(c.width / v.videoWidth, c.height / v.videoHeight);
      const w = v.videoWidth * scale, h = v.videoHeight * scale;
      ctx.drawImage(v, (c.width - w) / 2, (c.height - h) / 2, w, h);
    } else {
      // Built-in 60fps Live Motion Graphics Engine (Never fails!)
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      if (cur.theme === "space") { g.addColorStop(0, "#090d16"); g.addColorStop(0.5, "#311042"); g.addColorStop(1, "#0f172a"); }
      else if (cur.theme === "neon") { g.addColorStop(0, "#042f2e"); g.addColorStop(0.5, "#064e3b"); g.addColorStop(1, "#090d16"); }
      else if (cur.theme === "cyber") { g.addColorStop(0, "#0c4a6e"); g.addColorStop(0.5, "#1e1b4b"); g.addColorStop(1, "#020617"); }
      else { g.addColorStop(0, "#7c2d12"); g.addColorStop(0.5, "#9f1239"); g.addColorStop(1, "#1e1b4b"); }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);

      // Animated Glowing Orbs & Motion Waves
      for (let i = 0; i < 18; i++) {
        const x = ((i * 97 + t * (60 + i * 8)) % (c.width + 120)) - 60;
        const y = ((i * 151 + Math.sin(t * 2 + i) * 90 + t * 45) % (c.height + 120)) - 60;
        const r = 18 + (i % 5) * 14 + Math.sin(t * 3 + i) * 6;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(4, r), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "rgba(163, 230, 53, 0.22)" : "rgba(56, 189, 248, 0.22)";
        ctx.fill();
      }

      // Dynamic Beat Wave Rings
      ctx.strokeStyle = "rgba(163, 230, 53, 0.35)";
      ctx.lineWidth = 4;
      for (let w = 0; w < 3; w++) {
        const radius = 90 + ((t * 140 + w * 95) % 280);
        ctx.beginPath();
        ctx.arc(c.width / 2, c.height * 0.38, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (cur.text) {
      const pop = Math.min(1, local * 4);
      ctx.save();
      ctx.translate(c.width / 2, c.height - 160);
      ctx.scale(0.85 + pop * 0.15, 0.85 + pop * 0.15);
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.fillRect(-c.width / 2 + 32, -65, c.width - 64, 130);
      ctx.font = "900 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#a3e635";
      const mid = Math.ceil(cur.text.length / 2);
      const sp = cur.text.indexOf(" ", mid - 6);
      if (cur.text.length > 26 && sp > 0) {
        ctx.fillText(cur.text.slice(0, sp), 0, -12);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(cur.text.slice(sp + 1), 0, 34);
      } else {
        ctx.fillText(cur.text, 0, 12);
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    if (screen !== "editor") return;
    if (!playing) {
      Object.values(videoEls.current).forEach((v) => v.pause());
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
    Object.values(videoEls.current).forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); });
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      Object.values(videoEls.current).forEach((v) => v.pause());
      setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
    };
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
          <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-emerald-950 to-zinc-900 border border-zinc-800 p-6 flex items-center justify-between">
            <div className="space-y-1.5">
                           <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-5 h-5" /></div>
              <h1 className="text-3xl font-black leading-tight">Motion<br />Control</h1>
              <p className="text-xs text-lime-300 font-bold">GREMORA 60fps AI Motion Studio</p>
            </div>
            <button onClick={() => openPreset("Motion Control", FEATURE_CARDS[0].lines, "neon")} className="bg-lime-400 text-black p-4 rounded-full shadow-xl hover:scale-105 transition cursor-pointer">
              <ArrowUpRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => openPreset("New Video Project", FEATURE_CARDS[0].lines, "space")} className="col-span-2 bg-gradient-to-r from-lime-400 via-emerald-300 to-cyan-300 text-black rounded-2xl py-5 px-4 flex items-center justify-center gap-2.5 font-black text-lg shadow-lg cursor-pointer">
              <span className="bg-black text-lime-400 p-1 rounded-full"><Plus className="w-4 h-4" /></span>
              New Project
            </button>
            <button onClick={() => openPreset("Marketing Ad", ["Grow your business faster with AI!", "Professional video ads in seconds!", "Start creating today!"], "cyber")} className="bg-emerald-50 text-black rounded-2xl p-3 flex flex-col items-center justify-center text-center font-extrabold text-xs cursor-pointer">
              <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-black mb-1">AD</span>
              Marketing Video
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div onClick={() => openPreset("Text to Video", FEATURE_CARDS[0].lines, "space")} className="bg-zinc-900 hover:border-lime-400 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
              <div className="bg-lime-400/20 text-lime-400 p-2.5 rounded-xl"><Type className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Text to Video</span>
            </div>
            <div onClick={() => openPreset("Video Gen", FEATURE_CARDS[0].lines, "neon")} className="bg-zinc-900 hover:border-lime-400 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
              <div className="bg-cyan-400/20 text-cyan-400 p-2.5 rounded-xl"><Clapperboard className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Video Gen</span>
            </div>
            <div onClick={() => openPreset("Media Editor", ["Upload your own video below!"], "sunset")} className="bg-zinc-900 hover:border-lime-400 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
              <div className="bg-purple-400/20 text-purple-400 p-2.5 rounded-xl"><ImageIcon className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Edit Clips</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h2 className="font-black text-base flex items-center gap-1.5"><Flame className="w-4 h-4 text-lime-400" /> AI Video Templates</h2>
            <div className="grid grid-cols-2 gap-3">
              {FEATURE_CARDS.map((card) => (
                <div key={card.id} onClick={() => openPreset(card.title, card.lines, card.theme)} className={`bg-gradient-to-br ${card.grad} rounded-2xl p-4 h-28 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition shadow-lg`}>
                  <div>
                    <h3 className="font-black text-base text-white">{card.title}</h3>
                    <p className="text-[11px] text-white/85 font-semibold">{card.sub}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs font-black">▶</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0c0e14]/95 border-t border-zinc-800 py-2.5 px-6 flex justify-around items-center max-w-3xl mx-auto">
          <button onClick={() => setScreen("home")} className="flex flex-col items-center gap-1 text-lime-400 cursor-pointer"><Home className="w-5 h-5" /><span className="text-[10px] font-bold">Home</span></button>
          <button onClick={() => openPreset("Templates", FEATURE_CARDS[0].lines, "space")} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white cursor-pointer"><LayoutGrid className="w-5 h-5" /><span className="text-[10px] font-bold">Templates</span></button>
          <button onClick={() => openPreset("Drafts", FEATURE_CARDS[0].lines, "neon")} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white cursor-pointer"><FolderOpen className="w-5 h-5" /><span className="text-[10px] font-bold">Drafts</span></button>
          <button onClick={() => setScreen("home")} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white cursor-pointer"><User className="w-5 h-5" /><span className="text-[10px] font-bold">Mine</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2.5">
          <button onClick={() => { setPlaying(false); setScreen("home"); }} className="bg-zinc-800 p-2 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
          <span className="font-black text-base text-lime-400">{projectTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
          <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export Video</button>
          {exportUrl && <a href={exportUrl} download="gremora-motion.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl">Save File</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <label className="text-xs font-bold text-lime-400 block">Script (हर लाइन पर 60fps मोशन वीडियो चलेगा)</label>
          <textarea rows={5} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs" />
          <button onClick={() => generateRealVideo(scriptText)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><Sparkles className="w-4 h-4" /> Auto-Create Motion Video</button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-lime-400"><Plus className="inline w-3.5 h-3.5 mr-1" /> Upload Video<input type="file" accept="video/*" multiple onChange={handleUpload} className="hidden" /></label>
            <label className="border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400"><Music className="inline w-3.5 h-3.5 mr-1" /> Add Music<input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && setAudioUrl(URL.createObjectURL(e.target.files[0]))} className="hidden" /></label>
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
              <div><label className="text-zinc-400">Visual Theme</label><select value={activeClip.theme} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, theme: e.target.value as "space" | "neon" | "cyber" | "sunset" } : x)))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1"><option value="neon">Neon Beats</option><option value="space">Galaxy Space</option><option value="cyber">Cyber Waves</option><option value="sunset">Golden Sunset</option></select></div>
              <div><label className="text-zinc-400">Duration: {activeClip.duration}s</label><input type="range" min={2} max={10} value={activeClip.duration} onChange={(e) => setClips((p) => p.map((x) => (x.id === activeClip.id ? { ...x, duration: Number(e.target.value) } : x)))} className="w-full accent-lime-400" /></div>

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

