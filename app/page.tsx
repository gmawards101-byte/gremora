"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Sparkles, Volume2, ArrowLeft, Flame, Crown, Wand2 } from "lucide-react";

interface Clip { id: string; name: string; imgUrl?: string; duration: number; text: string; theme: number; }

const DEFAULT_SCRIPT = [
  "क्या आप अपने बच्चों को एक असली Taekwondo चैंपियन बनाना चाहते हैं?",
  "Train Like a Champion, Dream for Olympics!",
  "सीखें Self-Defense, अनुशासन और नेशनल लेवल ट्रेनिंग!",
  "पता: CZS Play School, Loharu Road, Charkhi Dadri",
  "फ्री ट्रायल क्लास के लिए अभी कॉल करें: 7027004041" 
];

export default function GremoraTaekwondoStudio() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const buildVideo = (raw: string, autoPlay = true) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const built: Clip[] = lines.map((line, i) => ({
      id: "sc-" + Date.now() + "-" + i,
      name: `Scene ${i + 1}`,
      duration: 4,
      text: line,
      theme: i % 3
    }));
    setClips(built);
    if (built[0]) setSel(built[0].id);
    if (autoPlay) setTimeout(() => setPlaying(true), 200);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => {
      const id = "up-" + Date.now() + "-" + i;
      const url = URL.createObjectURL(f);
      const img = new Image(); img.src = url; imgCache.current[id] = img;
      return { id, name: f.name.slice(0, 14), imgUrl: url, duration: 4, text: "", theme: 0 };
    });
      const drawSingleFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, t: number, beltColor: string, armorColor: string, isKicking: boolean) => {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 6) * 8);
    ctx.scale(dir, 1);
    ctx.lineCap = "round";

    ctx.fillStyle = armorColor;
    ctx.beginPath(); ctx.arc(0, -95, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath(); ctx.arc(6, -93, 14, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 24;
    ctx.beginPath(); ctx.moveTo(-4, -68); ctx.lineTo(0, 12); ctx.stroke();
    ctx.strokeStyle = armorColor; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(-2, -55); ctx.lineTo(2, -12); ctx.stroke();

    ctx.strokeStyle = beltColor; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(16, -8); ctx.stroke();

    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(-2, 12); ctx.lineTo(-28, 110); ctx.stroke();

    ctx.beginPath();
    if (isKicking) {
      const kickLift = Math.abs(Math.sin(t * 5)) * 85;
      ctx.moveTo(4, 8);
      ctx.lineTo(105, -10 - kickLift);
    } else {
      ctx.moveTo(4, 12);
      ctx.lineTo(35, 110);
    }
    ctx.stroke();

    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(-6, -55); ctx.lineTo(28, -35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -55); ctx.lineTo(42, -50); ctx.stroke();
    ctx.restore();
  };

  const drawFighterArt = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, theme: number) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    if (theme === 0) { g.addColorStop(0, "#7c2d12"); g.addColorStop(0.5, "#1e1b4b"); g.addColorStop(1, "#090d16"); }
    else if (theme === 1) { g.addColorStop(0, "#064e3b"); g.addColorStop(0.5, "#0f172a"); g.addColorStop(1, "#020617"); }
    else { g.addColorStop(0, "#4c1d95"); g.addColorStop(0.5, "#9f1239"); g.addColorStop(1, "#090d16"); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const rad = ctx.createRadialGradient(w / 2, h * 0.42, 20, w / 2, h * 0.42, 260);
    rad.addColorStop(0, "rgba(250, 204, 21, 0.45)");
    rad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = rad;
    ctx.beginPath(); ctx.arc(w / 2, h * 0.42, 260, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.56, 260, 42, 0, 0, Math.PI * 2); ctx.fill();

    const phase = Math.sin(t * 2.5);
    const blueKick = phase >= 0;
    const redKick = phase < 0;
    const bounce = Math.abs(Math.sin(t * 5)) * 22;

    drawSingleFighter(ctx, w * 0.34 + bounce, h * 0.42, 1, t, "#090d16", "#2563eb", blueKick);
    drawSingleFighter(ctx, w * 0.66 - bounce, h * 0.42, -1, t + 1.2, "#090d16", "#dc2626", redKick);

    const clash = Math.abs(Math.sin(t * 5));
    if (clash > 0.75) {
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 5;
      for (let s = 0; s < 10; s++) {
        const ang = (s * Math.PI) / 5 + t * 4;
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(ang) * 15, h * 0.36 + Math.sin(ang) * 15);
        ctx.lineTo(w / 2 + Math.cos(ang) * 58, h * 0.36 + Math.sin(ang) * 58);
        ctx.stroke();
      }
    }
  };

); ctx.stroke();
    ctx.restore();

    // Flying Energy Sparks
    for (let i = 0; i < 16; i++) {
      const sx = ((i * 89 + t * 90) % w);
      const sy = ((i * 137 + t * 50) % (h * 0.7));
      ctx.fillStyle = i % 2 === 0 ? "#facc15" : "#a3e635";
      ctx.beginPath(); ctx.arc(sx, sy, 4 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill();
    }
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

    const img = cur.imgUrl ? imgCache.current[cur.id] : null;
    if (img && img.complete && img.naturalWidth > 0) {
      const zoom = 1 + Math.min(local / cur.duration, 1) * 0.14;
      ctx.save(); ctx.translate(c.width / 2, c.height / 2); ctx.scale(zoom, zoom); ctx.translate(-c.width / 2, -c.height / 2);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      ctx.restore();
    } else {
      drawFighterArt(ctx, c.width, c.height, t, cur.theme);
    }

    // Top Academy Badge
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(40, 45, c.width - 80, 56);
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#facc15";
    ctx.fillText("TAEKWONDO ACADEMY • CHARKHI DADRI", c.width / 2, 82);

    if (cur.text) {
      ctx.fillStyle = "rgba(0,0,0,0.82)";
      ctx.fillRect(32, c.height - 235, c.width - 64, 150);
      ctx.font = "900 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#a3e635";
      const mid = Math.ceil(cur.text.length / 2);
      const sp = cur.text.indexOf(" ", mid - 6);
      if (cur.text.length > 26 && sp > 0) {
        ctx.fillText(cur.text.slice(0, sp), c.width / 2, c.height - 172);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(cur.text.slice(sp + 1), c.width / 2, c.height - 122);
      } else {
        ctx.fillText(cur.text, c.width / 2, c.height - 148);
      }
    }
  };

  useEffect(() => {
    if (screen !== "editor") return;
    if (!playing) {
      drawFrame(time, false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      lastSpokenRef.current = "";
      return;
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
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
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
          <div className="rounded-3xl bg-gradient-to-br from-amber-800 via-zinc-900 to-indigo-950 border border-zinc-800 p-6 space-y-2">
            <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center"><Crown className="w-5 h-5" /></div>
            <h1 className="text-3xl font-black">GREMORA AI Video Studio</h1>
            <p className="text-xs text-amber-300 font-bold">Taekwondo Academy • CZS Play School, Loharu Road, Charkhi Dadri</p>
          </div>
          <button onClick={() => { setScreen("editor"); buildVideo(scriptText, true); }} className="w-full bg-gradient-to-r from-lime-400 to-amber-300 text-black rounded-2xl py-5 font-black text-lg flex items-center justify-center gap-2 cursor-pointer shadow-xl">
            <Flame className="w-5 h-5" /> Taekwondo Promo Video बनाएं (Fighter + आवाज़)
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
            <span className="font-black text-base text-lime-400">Taekwondo Academy Promo</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
            <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export Video</button>
            {exportUrl && <a href={exportUrl} download="taekwondo-dadri.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl">Save File</a>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-lime-400 flex items-center gap-1"><Wand2 className="w-4 h-4" /> अपनी स्क्रिप्ट लिखें / बदलें</label>
            <textarea rows={6} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-lime-400/50 rounded-xl p-3 text-xs" />
            <button onClick={() => buildVideo(scriptText, true)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
              <Sparkles className="w-4 h-4" /> Create & Play Video
            </button>
            <label className="block border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400">
              <Plus className="inline w-3.5 h-3.5 mr-1" /> या अपनी असली फ़ोटो अपलोड करें
              <input type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
            </label>
          </div>

          <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
            <canvas ref={canvasRef} width={720} height={1280} className="max-h-[410px] w-auto rounded-xl bg-zinc-900" />
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => setPlaying(!playing)} className="bg-lime-400 text-black p-2.5 rounded-full cursor-pointer">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
              <span className="text-xs font-mono">{time.toFixed(1)}s / {total}s</span>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
            <div className="font-bold text-lime-400">Scene Settings</div>
            {activeClip && (<>
              <div><label className="text-zinc-400">Subtitle Text</label><input value={activeClip.text} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, text: e.target.value } : x))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
              <div><label className="text-zinc-400">Duration: {activeClip.duration}s</label><input type="range" min={2} max={10} value={activeClip.duration} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, duration: Number(e.target.value) } : x))} className="w-full accent-lime-400" /></div>
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
