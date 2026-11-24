"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Sparkles, Volume2, ArrowLeft, Crown, Wand2 } from "lucide-react";

type ThemeType = "sports" | "school" | "business" | "creator";
interface Clip { id: string; name: string; mediaUrl: string; isVideo?: boolean; duration: number; headline: string; subline: string; }

const REAL_VISUALS: Record<ThemeType, string[]> = {
  sports: [
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com"
  ],
  school: [
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com"
  ],
  business: [
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com"
  ],
  creator: [
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com",
    "https://" + "://unsplash.com"
  ]
};

const PRESETS: { id: ThemeType; title: string; sub: string; grad: string; lines: string[] }[] = [
  { id: "sports", title: "Sports & Taekwondo Ad", sub: "Real Fighter & Gym Visuals", grad: "from-amber-500 to-rose-700", lines: ["GREWAL TAEKWONDO ACADEMY | Charkhi Dadri • Haryana", "POWER • DISCIPLINE • SKILL | Dream for Olympics", "CZS PLAY SCHOOL | Loharu Road, Charkhi Dadri • 7027004041"] },
  { id: "school", title: "School & Coaching Ad", sub: "Real Classroom Visuals", grad: "from-sky-500 to-indigo-700", lines: ["ADMISSIONS OPEN 2026-27! | Smart Learning & Care", "EXPERIENCED TEACHERS | Best Future for Your Child", "ENROLL TODAY | Call: 7027004041"] },
  { id: "business", title: "Shop & Business Ad", sub: "Real Showroom & Offer Visuals", grad: "from-lime-500 to-emerald-700", lines: ["GRAND FESTIVAL SALE! | Flat 50% OFF Today", "BEST QUALITY & PRICE | Visit Our Showroom", "ORDER NOW | Contact: 7027004041"] },
  { id: "creator", title: "YouTube & Reels Studio", sub: "Real Cinema Visuals", grad: "from-purple-500 to-pink-700", lines: ["NEVER GIVE UP! | Your Success Story Starts Here", "DREAM BIG & WORK HARD | Create Viral Videos", "GREMORA AI STUDIO | Subscribe & Share"] },
];

export default function GremoraWorkingVideoMaker() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [activeTheme, setActiveTheme] = useState<ThemeType>("sports");
  const [scriptText, setScriptText] = useState(PRESETS[0].lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [recording, setRecording] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaCache = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const detectTheme = (raw: string): ThemeType => {
    const t = raw.toLowerCase();
    if (t.includes("taekwondo") || t.includes("gym") || t.includes("sport") || t.includes("fight") || t.includes("fitness")) return "sports";
    if (t.includes("school") || t.includes("coaching") || t.includes("admission") || t.includes("study") || t.includes("kids")) return "school";
    if (t.includes("sale") || t.includes("offer") || t.includes("shop") || t.includes("business") || t.includes("trophy")) return "business";
    return activeTheme;
  };

  const buildVideo = (raw: string, forcedTheme?: ThemeType, autoPlay = true) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const chosen = forcedTheme || detectTheme(raw);
    setActiveTheme(chosen);
    const pool = REAL_VISUALS[chosen];

    const built: Clip[] = lines.map((line, i) => {
      const id = "sc-" + Date.now() + "-" + i;
      const parts = line.split("|");
      const url = pool[i % pool.length];
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      mediaCache.current[id] = img;
      return {
        id,
        name: `Scene ${i + 1}`,
        mediaUrl: url,
        isVideo: false,
        duration: 4,
        headline: (parts[0] || line).trim().toUpperCase(),
        subline: (parts[1] || "GREMORA AI VIDEO STUDIO").trim()
      };
    });

    setClips(built);
    if (built[0]) setSel(built[0].id);
    if (autoPlay) setTimeout(() => setPlaying(true), 300);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => {
      const id = "up-" + Date.now() + "-" + i;
      const url = URL.createObjectURL(f);
      const isVid = f.type.startsWith("video");
      if (isVid) {
        const v = document.createElement("video"); v.src = url; v.muted = true; v.loop = true; v.playsInline = true; v.load();
        mediaCache.current[id] = v;
      } else {
        const img = new Image(); img.src = url;
        mediaCache.current[id] = img;
      }
      return { id, name: f.name.slice(0, 12), mediaUrl: url, isVideo: isVid, duration: 4, headline: "GREWAL TAEKWONDO", subline: "Charkhi Dadri • 7027004041" };
    });
    setClips((p) => [...p, ...added]);
    if (added[0]) setSel(added[0].id);
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

    let acc = 0, cur = clips[0], local = 0;
    for (const item of clips) { if (t >= acc && t < acc + item.duration) { cur = item; local = t - acc; break; } acc += item.duration; }

    if (speak && voiceOn && cur.headline && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id; window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.headline + ". " + cur.subline);
      u.lang = /[\u0900-\u097F]/.test(cur.headline) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }

    const media = mediaCache.current[cur.id];
    const z = 1 + Math.min(local / cur.duration, 1) * 0.14;
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2); ctx.scale(z, z); ctx.translate(-c.width / 2, -c.height / 2);

    if (media instanceof HTMLVideoElement && media.readyState >= 2) {
      if ((playing || recording) && media.paused) media.play().catch(() => {});
      const s = Math.max(c.width / media.videoWidth, c.height / media.videoHeight);
      ctx.drawImage(media, (c.width - media.videoWidth * s) / 2, (c.height - media.videoHeight * s) / 2, media.videoWidth * s, media.videoHeight * s);
    } else if (media instanceof HTMLImageElement && media.complete && media.naturalWidth > 0) {
      const s = Math.max(c.width / media.naturalWidth, c.height / media.naturalHeight);
      ctx.drawImage(media, (c.width - media.naturalWidth * s) / 2, (c.height - media.naturalHeight * s) / 2, media.naturalWidth * s, media.naturalHeight * s);
    } else {
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#7c2d12");
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.restore();

    // Dark Cinematic Vignette + Bold Pro Title
    ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(0, 28, c.width, 140);
    ctx.font = "900 42px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
    ctx.fillText(cur.headline.slice(0, 28), c.width / 2, 86);

    ctx.fillStyle = "#ff9933"; ctx.fillRect(120, 104, (c.width - 240) / 3, 7);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(120 + (c.width - 240) / 3, 104, (c.width - 240) / 3, 7);
    ctx.fillStyle = "#138808"; ctx.fillRect(120 + ((c.width - 240) * 2) / 3, 104, (c.width - 240) / 3, 7);

    ctx.font = "800 24px sans-serif"; ctx.fillStyle = "#facc15";
    ctx.fillText(cur.subline.slice(0, 48), c.width / 2, 144);
  };

  useEffect(() => {
    if (screen !== "editor") return;
    if (!playing) {
      Object.values(mediaCache.current).forEach((m) => { if (m instanceof HTMLVideoElement) m.pause(); });
      drawFrame(time, false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      lastSpokenRef.current = ""; return;
    }
    const start = performance.now() - time * 1000; let raf = 0;
    const tick = (now: number) => {
      const next = (now - start) / 1000;
      if (next >= total) { setTime(0); setPlaying(false); return; }
      setTime(next); drawFrame(next, true); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips, voiceOn, screen]);

  const exportVid = () => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    setPlaying(false); setExportUrl(""); setRecording(true);
    Object.values(mediaCache.current).forEach((m) => { if (m instanceof HTMLVideoElement) { m.currentTime = 0; m.play().catch(() => {}); } });
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      Object.values(mediaCache.current).forEach((m) => { if (m instanceof HTMLVideoElement) m.pause(); });
      setRecording(false);
      setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
    };
    rec.start();
    const start = performance.now();
    const step = (now: number) => {
      const sec = (now - start) / 1000;
      drawFrame(sec, false);
      if (sec < total) requestAnimationFrame(step);
      else rec.stop();
    };
    requestAnimationFrame(step);
  };

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-amber-600/20 via-zinc-900 to-emerald-800/30 border border-zinc-700 p-6 space-y-2">
            <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center"><Crown className="w-5 h-5" /></div>
            <h1 className="text-3xl font-black">GREMORA Pro Video Studio</h1>
            <p className="text-xs text-lime-300 font-bold">असली HD विजुअल्स + ज़ूम मोशन + AI आवाज़ — अपनी वीडियो बनाएं और तुरंत डाउनलोड करें!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESETS.map((p) => (
              <div key={p.id} onClick={() => { setScriptText(p.lines.join("\n")); setScreen("editor"); buildVideo(p.lines.join("\n"), p.id, true); }} className={`bg-gradient-to-br ${p.grad} rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition shadow-lg`}>
                <h3 className="font-black text-lg">{p.title}</h3>
                <p className="text-xs text-white/90">{p.sub}</p>
                <span className="inline-block mt-3 text-[11px] font-black bg-black/40 px-3 py-1 rounded-full">▶ अभी वीडियो बनाएं</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2.5">
          <button onClick={() => { setPlaying(false); setScreen("home"); }} className="bg-zinc-800 p-2 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
          <span className="font-black text-base text-lime-400">GREMORA Video Maker</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
          <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer">
            <Download className="w-4 h-4" /> {recording ? "Creating Video..." : "Export Video"}
          </button>
          {exportUrl && <a href={exportUrl} download="gremora-video.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl animate-pulse">Save Video File</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <label className="text-xs font-bold text-lime-400 flex items-center gap-1"><Wand2 className="w-4 h-4" /> अपनी स्क्रिप्ट लिखें (Headline | Subline)</label>
          <textarea rows={5} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-lime-400/50 rounded-xl p-2.5 text-xs" />
          <div className="flex gap-1.5 flex-wrap">
            {(["sports", "school", "business", "creator"] as ThemeType[]).map((th) => (
              <button key={th} onClick={() => buildVideo(scriptText, th, true)} className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg cursor-pointer ${activeTheme === th ? "bg-lime-400 text-black" : "bg-zinc-800 text-zinc-400"}`}>{th}</button>
            ))}
          </div>
          <button onClick={() => buildVideo(scriptText, undefined, true)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
            <Sparkles className="w-4 h-4" /> Create & Play Video
          </button>
          <label className="block border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400">
            <Plus className="inline w-3.5 h-3.5 mr-1" /> अपनी असली Photo या Video क्लिप्स डालें
            <input type="file" accept="video/*,image/*" multiple onChange={onUpload} className="hidden" />
          </label>
        </div>

        <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} width={1280} height={720} className="w-full rounded-xl bg-zinc-900" />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setPlaying(!playing)} className="bg-lime-400 text-black p-2.5 rounded-full cursor-pointer">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
            <span className="text-xs font-mono">{time.toFixed(1)}s / {total}s</span>
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
          <div className="font-bold text-lime-400">Scene Text Editor</div>
          {activeClip && (<>
            <div><label className="text-zinc-400">Big Headline</label><input value={activeClip.headline} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, headline: e.target.value } : x))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
            <div><label className="text-zinc-400">Subline Text</label><input value={activeClip.subline} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, subline: e.target.value } : x))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
          </>)}
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
