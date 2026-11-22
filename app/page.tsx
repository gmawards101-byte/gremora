"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Music, Sparkles, Volume2, ArrowLeft, Flame, Crown, Image as ImageIcon, Type, Clapperboard, Home, LayoutGrid, FolderOpen, User, ArrowUpRight } from "lucide-react";

interface Clip {
  id: string;
  name: string;
  videoUrl: string;
  duration: number;
  text: string;
}

const STOCK_CLIPS = {
  nature: "https://" + "assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4",
  dance: "https://" + "assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1282-large.mp4",
  cyber: "https://" + "assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4",
  couple: "https://" + "assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-at-sunset-4611-large.mp4",
  business: "https://" + "assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-laptop-4986-large.mp4",
  ocean: "https://" + "assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4"
};

const FEATURE_CARDS = [
  { id: "story", title: "AI Story", sub: "Magic & Space Tales", thumb: "https://" + "://unsplash.com", videos: [STOCK_CLIPS.nature, STOCK_CLIPS.ocean, STOCK_CLIPS.cyber], lines: ["In a galaxy beyond imagination, a new story begins!", "Every star holds a secret waiting to be discovered!", "Create viral AI stories in seconds!"] },
  { id: "motion", title: "Motion Control", sub: "Neon Dance & Beats", thumb: "https://" + "://unsplash.com", videos: [STOCK_CLIPS.dance, STOCK_CLIPS.cyber, STOCK_CLIPS.ocean], lines: ["Feel the neon rhythm take over the night!", "High-energy motion clips built for viral Reels!", "Edit like a pro with Gremora AI!"] },
  { id: "transform", title: "Cyber City", sub: "Futuristic Scenes", thumb: "https://" + "://unsplash.com", videos: [STOCK_CLIPS.cyber, STOCK_CLIPS.nature, STOCK_CLIPS.business], lines: ["Welcome to the future of digital creation!", "Powered by next-gen AI video technology!", "Turn simple text into cinema!"] },
  { id: "collab", title: "Lifestyle & Travel", sub: "Sunset & Vlog Reels", thumb: "https://" + "://unsplash.com", videos: [STOCK_CLIPS.couple, STOCK_CLIPS.ocean, STOCK_CLIPS.dance], lines: ["Golden sunsets and unforgettable memories!", "Share your journey with the world!", "Make every moment cinematic!"] },
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

  const pickVideoForLine = (line: string, idx: number) => {
    const l = line.toLowerCase();
    if (l.includes("dance") || l.includes("music") || l.includes("neon")) return STOCK_CLIPS.dance;
    if (l.includes("love") || l.includes("sunset") || l.includes("beach")) return STOCK_CLIPS.couple;
    if (l.includes("business") || l.includes("work") || l.includes("app")) return STOCK_CLIPS.business;
    if (l.includes("city") || l.includes("future") || l.includes("ai")) return STOCK_CLIPS.cyber;
    const pool = Object.values(STOCK_CLIPS);
    return pool[idx % pool.length];
  };

  const generateRealVideo = (linesRaw: string, presetVideos?: string[]) => {
    const lines = linesRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");

    const built: Clip[] = lines.map((line, i) => {
      const id = "vid-" + Date.now() + "-" + i;
      const vUrl = presetVideos && presetVideos[i] ? presetVideos[i] : pickVideoForLine(line, i);
      const v = document.createElement("video");
      v.src = vUrl;
      v.crossOrigin = "anonymous";
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.load();
      videoEls.current[id] = v;
      return { id, name: `Clip ${i + 1}`, videoUrl: vUrl, duration: 4, text: line };
    });

    setClips(built);
    if (built[0]) setSel(built[0].id);
  };

  const openPreset = (title: string, lines: string[], videos?: string[]) => {
    setProjectTitle(title);
    const joined = lines.join("\n");
    setScriptText(joined);
    generateRealVideo(joined, videos);
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
      return { id, name: f.name.slice(0, 14), videoUrl: url, duration: 5, text: "" };
    });
    setClips((p) => [...p, ...added]);
    if (added[0]) setSel(added[0].id);
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, c.width, c.height);

    let acc = 0, cur = clips[0];
    for (const item of clips) {
      if (t >= acc && t < acc + item.duration) { cur = item; break; }
      acc += item.duration;
    }

    if (speak && voiceOn && cur.text && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.text);
      u.lang = /[\u0900-\u097F]/.test(cur.text) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }

    const v = videoEls.current[cur.id];
    if (v && v.readyState >= 2) {
      if (playing && v.paused) v.play().catch(() => {});
      const scale = Math.max(c.width / v.videoWidth, c.height / v.videoHeight);
      const w = v.videoWidth * scale;
      const h = v.videoHeight * scale;
      ctx.drawImage(v, (c.width - w) / 2, (c.height - h) / 2, w, h);
    } else {
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#065f46");
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    }

    if (cur.text) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
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
          <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 p-6 flex items-center justify-between min-h-[165px]">
            <img src="https://unsplash.com" alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-35" />
            <div className="space-y-2 z-10">
                            <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-5 h-5" /></div>
              <h1 className="text-3xl font-black leading-tight">Motion<br />Control</h1>
              <p className="text-xs text-zinc-200 font-semibold">GREMORA Real Motion Video Studio</p>
            </div>
            <button onClick={() => openPreset("Motion Control", FEATURE_CARDS[0].lines, FEATURE_CARDS[0].videos)} className="z-10 bg-lime-400 text-black p-3.5 rounded-full shadow-xl hover:scale-105 transition cursor-pointer">
              <ArrowUpRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => openPreset("New Video Project", FEATURE_CARDS[0].lines, FEATURE_CARDS[0].videos)} className="col-span-2 bg-gradient-to-r from-lime-400 via-emerald-300 to-cyan-300 text-black rounded-2xl py-5 px-4 flex items-center justify-center gap-2.5 font-black text-lg shadow-lg cursor-pointer">
              <span className="bg-black text-lime-400 p-1 rounded-full"><Plus className="w-4 h-4" /></span>
              New Project
            </button>
            <button onClick={() => openPreset("Marketing Ad", ["Grow your business faster with AI!", "Professional video ads in seconds!", "Start creating today!"], [STOCK_CLIPS.business, STOCK_CLIPS.cyber, STOCK_CLIPS.ocean])} className="bg-emerald-50 text-black rounded-2xl p-3 flex flex-col items-center justify-center text-center font-extrabold text-xs cursor-pointer">
              <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-black mb-1">AD</span>
              Marketing Video
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div onClick={() => openPreset("Text to Video", FEATURE_CARDS[0].lines)} className="bg-zinc-900 hover:border-lime-400 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
              <div className="bg-lime-400/20 text-lime-400 p-2.5 rounded-xl"><Type className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Text to Video</span>
            </div>
            <div onClick={() => openPreset("Video Gen", FEATURE_CARDS[0].lines, FEATURE_CARDS[0].videos)} className="bg-zinc-900 hover:border-lime-400 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
              <div className="bg-cyan-400/20 text-cyan-400 p-2.5 rounded-xl"><Clapperboard className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Video Gen</span>
            </div>
            <div onClick={() => openPreset("Media Editor", ["Upload your own clips below!"])} className="bg-zinc-900 hover:border-lime-400 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
              <div className="bg-purple-400/20 text-purple-400 p-2.5 rounded-xl"><ImageIcon className="w-5 h-5" /></div>
              <span className="text-xs font-bold">Edit Clips</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h2 className="font-black text-base flex items-center gap-1.5"><Flame className="w-4 h-4 text-lime-400" /> AI Video Templates</h2>
            <div className="grid grid-cols-2 gap-3">
              {FEATURE_CARDS.map((card) => (
                <div key={card.id} onClick={() => openPreset(card.title, card.lines, card.videos)} className="relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-lime-400 rounded-2xl p-3.5 h-28 flex items-center justify-between cursor-pointer group">
                  <div className="z-10 flex flex-col justify-between h-full max-w-[55%]">
                    <div>
                      <h3 className="font-bold text-sm">{card.title}</h3>
                      <p className="text-[10px] text-zinc-400">{card.sub}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-black">›</div>
                  </div>
                  <img src={card.thumb} alt={card.title} className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0c0e14]/95 border-t border-zinc-800 py-2.5 px-6 flex justify-around items-center max-w-3xl mx-auto">
          <button onClick={() => setScreen("home")} className="flex flex-col items-center gap-1 text-lime-400 cursor-pointer"><Home className="w-5 h-5" /><span className="text-[10px] font-bold">Home</span></button>
          <button onClick={() => openPreset("Templates", FEATURE_CARDS[0].lines, FEATURE_CARDS[0].videos)} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white cursor-pointer"><LayoutGrid className="w-5 h-5" /><span className="text-[10px] font-bold">Templates</span></button>
          <button onClick={() => openPreset("Drafts", FEATURE_CARDS[0].lines, FEATURE_CARDS[0].videos)} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white cursor-pointer"><FolderOpen className="w-5 h-5" /><span className="text-[10px] font-bold">Drafts</span></button>
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
          <label className="text-xs font-bold text-lime-400 block">Script (हर लाइन पर असली HD वीडियो चलेगा)</label>
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


