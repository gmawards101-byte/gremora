"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Sparkles, Volume2, ArrowLeft, Flame, Crown, Wand2, Key } from "lucide-react";

interface Clip { id: string; name: string; mediaUrl?: string; isVideo?: boolean; duration: number; headline: string; subline: string; }

const SAMPLE_PROMO = [
  "GET READY INDIA! | 7th National Taekwondo Championship",
  "POWER • DISCIPLINE • SKILL • SPIRIT | Train Like a Champion",
  "CZS PLAY SCHOOL | Loharu Road, Charkhi Dadri, Haryana",
  "ADMISSIONS OPEN NOW | Free Trial Class • Call: 7027004041"
];

export default function GremoraFilmoraProStudio() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [scriptText, setScriptText] = useState(SAMPLE_PROMO.join("\n"));
  const [apiKey, setApiKey] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaCache = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips;
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const buildPromo = (raw: string, autoPlay = true) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");

    const built: Clip[] = lines.map((line, i) => {
      const parts = line.split("|");
      const headline = (parts || line).trim().toUpperCase();
      const subline = (parts[1] || "GREMORA AI CHAMPIONSHIP STUDIO").trim();
      return { id: "sc-" + Date.now() + "-" + i, name: `Scene ${i + 1}`, duration: 4, headline, subline };
    });

    setClips(built);
    if (built) setSel(built.id);
    if (autoPlay) setTimeout(() => setPlaying(true), 250);
  };

  const onUploadMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      return { id, name: f.name.slice(0, 12), mediaUrl: url, isVideo: isVid, duration: 4, headline: "GET READY INDIA!", subline: "Charkhi Dadri Taekwondo • 7027004041" };
    });
    setClips((p) => [...p, ...added]);
    if (added) setSel(added.id);
  };

  const drawArenaBg = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0f172a"); g.addColorStop(0.55, "#1e293b"); g.addColorStop(1, "#020617");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // Championship Blue & Red Mat
    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath(); ctx.moveTo(60, h * 0.62); ctx.lineTo(w - 60, h * 0.62); ctx.lineTo(w - 15, h * 0.82); ctx.lineTo(15, h * 0.82); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(w * 0.25, h * 0.66, w * 0.5, h * 0.11);

    // Dynamic Fighters
    const bounce = Math.abs(Math.sin(t * 5)) * 24;
    const kick = Math.sin(t * 3) >= 0;
    const drawAthlete = (x: number, dir: number, color: string, isKick: boolean) => {
      ctx.save(); ctx.translate(x, h * 0.54 + Math.sin(t * 6) * 6); ctx.scale(dir, 1); ctx.lineCap = "round";
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -85, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 15); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -8); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-24, 98); ctx.stroke();
      ctx.beginPath();
      if (isKick) { ctx.moveTo(4, 10); ctx.lineTo(98, -15 - Math.abs(Math.sin(t * 5)) * 75); }
      else { ctx.moveTo(4, 15); ctx.lineTo(30, 98); }
      ctx.stroke(); ctx.restore();
    };
    drawAthlete(w * 0.34 + bounce, 1, "#2563eb", kick);
    drawAthlete(w * 0.66 - bounce, -1, "#dc2626", !kick);
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

    let acc = 0, cur = clips, local = 0;
    for (const item of clips) { if (t >= acc && t < acc + item.duration) { cur = item; local = t - acc; break; } acc += item.duration; }

    if (speak && voiceOn && cur.headline && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id; window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.headline + ". " + cur.subline);
      u.lang = /[\u0900-\u097F]/.test(cur.headline) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }

    const media = cur.mediaUrl ? mediaCache.current[cur.id] : null;
    if (media instanceof HTMLVideoElement && media.readyState >= 2) {
      if (playing && media.paused) media.play().catch(() => {});
      const s = Math.max(c.width / media.videoWidth, c.height / media.videoHeight);
      ctx.drawImage(media, (c.width - media.videoWidth * s) / 2, (c.height - media.videoHeight * s) / 2, media.videoWidth * s, media.videoHeight * s);
    } else if (media instanceof HTMLImageElement && media.complete && media.naturalWidth > 0) {
      const z = 1 + Math.min(local / cur.duration, 1) * 0.12;
      ctx.save(); ctx.translate(c.width / 2, c.height / 2); ctx.scale(z, z); ctx.translate(-c.width / 2, -c.height / 2);
      ctx.drawImage(media, 0, 0, c.width, c.height); ctx.restore();
    } else {
      drawArenaBg(ctx, c.width, c.height, t);
    }

    // Filmora Pro Bold Sports Typography + Tricolor Bar
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 28, c.width, 130);
    ctx.font = "900 42px sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(cur.headline.slice(0, 26), c.width / 2, 85);

    // Indian Tricolor Underline (Saffron - White - Green)
    ctx.fillStyle = "#ff9933"; ctx.fillRect(80, 102, (c.width - 160) / 3, 7);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(80 + (c.width - 160) / 3, 102, (c.width - 160) / 3, 7);
    ctx.fillStyle = "#138808"; ctx.fillRect(80 + ((c.width - 160) * 2) / 3, 102, (c.width - 160) / 3, 7);

    ctx.font = "800 22px sans-serif"; ctx.fillStyle = "#facc15";
    ctx.fillText(cur.subline.slice(0, 42), c.width / 2, 138);
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
    const c = canvasRef.current; if (!c) return;
    setPlaying(false); setExportUrl("");
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" }); const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
    rec.start(); const start = performance.now();
    const step = (now: number) => { const sec = (now - start) / 1000; drawFrame(sec, false); if (sec < total) requestAnimationFrame(step); else rec.stop(); };
    requestAnimationFrame(step);
  };

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-orange-600/30 via-zinc-900 to-emerald-700/30 border border-zinc-700 p-6 space-y-2">
            <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center"><Crown className="w-5 h-5" /></div>
            <h1 className="text-3xl font-black">GREMORA Filmora-Pro Studio</h1>
            <p className="text-xs text-amber-300 font-bold">3D Championship Titles • Tricolor Promo Bar • Video & Photo Clip Mixer</p>
          </div>
          <button onClick={() => { setScreen("editor"); buildPromo(scriptText, true); }} className="w-full bg-gradient-to-r from-amber-400 via-white to-emerald-400 text-black rounded-2xl py-5 font-black text-lg flex items-center justify-center gap-2 cursor-pointer shadow-xl">
            <Flame className="w-5 h-5" /> Championship Style Promo Video बनाएं
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2.5">
            <button onClick={() => { setPlaying(false); setScreen("home"); }} className="bg-zinc-800 p-2 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
            <span className="font-black text-base text-lime-400">Filmora Pro Championship Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
            <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export Video</button>
            {exportUrl && <a href={exportUrl} download="championship-promo.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl">Save File</a>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-lime-400 flex items-center gap-1"><Wand2 className="w-4 h-4" /> स्क्रिप्ट लिखें (Headline | Subline)</label>
            <textarea rows={5} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-lime-400/50 rounded-xl p-2.5 text-xs" />
            <button onClick={() => buildPromo(scriptText, true)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><Sparkles className="w-4 h-4" /> Generate & Play Promo</button>
            <label className="block border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400">
              <Plus className="inline w-3.5 h-3.5 mr-1" /> असली Video या Photo क्लिप्स डालें
              <input type="file" accept="video/*,image/*" multiple onChange={onUploadMedia} className="hidden" />
            </label>
            <div className="pt-1 border-t border-zinc-800">
              <label className="text-[10px] text-zinc-400 flex items-center gap-1"><Key className="w-3 h-3" /> Fal.ai / Kling AI Video Key (Optional)</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="fal_key_..." className="w-full bg-zinc-800 p-1.5 rounded-lg text-xs mt-1" />
            </div>
          </div>

          <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
            <canvas ref={canvasRef} width={1280} height={720} className="w-full rounded-xl bg-zinc-900" />
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => setPlaying(!playing)} className="bg-lime-400 text-black p-2.5 rounded-full cursor-pointer">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
              <span className="text-xs font-mono">{time.toFixed(1)}s / {total}s</span>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
            <div className="font-bold text-lime-400">Title & Scene Controls</div>
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
