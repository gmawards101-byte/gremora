"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Sparkles, Volume2, ArrowLeft, Flame, Crown, Wand2 } from "lucide-react";

interface Clip { id: string; name: string; imgUrl: string; duration: number; text: string; }

const TEMPLATES = [
  { id: "taekwondo", title: "Taekwondo Academy Ad", sub: "Sports & Olympics", grad: "from-amber-500 via-orange-600 to-rose-600", lines: ["क्या आप अपने बच्चों को Taekwondo चैंपियन बनाना चाहते हैं?", "Train Like a Champion, Dream for Olympics!", "Back Side PNB Bank, Loharu Road, Charkhi Dadri, Haryana", "अभी संपर्क करें: 7027604041"] },
  { id: "story", title: "AI Fantasy Story", sub: "3D Cinema Style", grad: "from-indigo-600 via-purple-600 to-pink-500", lines: ["In a hidden kingdom beyond the clouds, a young hero found a glowing sword!", "Darkness was rising, but courage burned brighter!", "The greatest adventure had just begun!"] },
  { id: "business", title: "Business Promo Ad", sub: "Viral Marketing", grad: "from-lime-500 via-emerald-500 to-cyan-500", lines: ["क्या आप भी अपने बिज़नेस को तेज़ी से बढ़ाना चाहते हैं?", "अब बिना कैमरे के बनाएं शानदार विज्ञापन वीडियो!", "अभी आज़माएं GREMORA AI STUDIO!"] },
  { id: "fitness", title: "Fitness & Martial Arts", sub: "Power & Discipline", grad: "from-cyan-500 via-blue-600 to-indigo-700", lines: ["हर दिन खुद को पहले से ज़्यादा मज़बूत बनाओ!", "Self Defense, Fitness और Olympic Training!", "आज ही जॉइन करें हमारी एकेडमी!"] },
];

export default function GremoraAutoPhotoVideo() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [title, setTitle] = useState("Taekwondo Academy Ad");
  const [scriptText, setScriptText] = useState(TEMPLATES[0].lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const lastSpokenRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const getPrompt = (line: string) => {
    const l = line.toLowerCase();
    if (l.includes("taekwondo") || l.includes("fighter") || l.includes("olympic") || l.includes("champion") || l.includes("martial"))
      return "taekwondo fighter high kick in dramatic stadium spotlight, martial arts champion, cinematic 8k action photo";
    if (l.includes("bank") || l.includes("road") || l.includes("haryana") || /\d{8,}/.test(l))
      return "modern martial arts training academy arena with gold medals and trophies, dramatic lighting, 8k";
    return "cinematic dramatic digital art scene, vibrant spotlight, 8k, " + line;
  };

  const buildVideo = (raw: string, autoPlay = true) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const built: Clip[] = lines.map((line, i) => {
      const id = "ai-" + Date.now() + "-" + i;
      const url = "https://" + "image.pollinations.ai/prompt/" + encodeURIComponent(getPrompt(line)) + "?width=720&height=1280&nologo=true&seed=" + (800 + i);
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = url;
      imgCache.current[id] = img;
      return { id, name: `Scene ${i + 1}`, imgUrl: url, duration: 4, text: line };
    });
    setClips(built);
    if (built[0]) setSel(built[0].id);
    if (autoPlay) setTimeout(() => setPlaying(true), 400);
  };

  const openEditor = (t: string, lines: string[]) => {
    setTitle(t); const j = lines.join("\n"); setScriptText(j); setScreen("editor"); buildVideo(j, true);
  };

  const onScriptChange = (val: string) => {
    setScriptText(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => buildVideo(val, true), 900);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => {
      const id = "up-" + Date.now() + "-" + i; const url = URL.createObjectURL(f);
      const img = new Image(); img.src = url; imgCache.current[id] = img;
      return { id, name: f.name.slice(0, 14), imgUrl: url, duration: 4, text: "" };
    });
    setClips((p) => [...p, ...added]);
    if (added[0]) setSel(added[0].id);
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current; if (!c || !clips.length) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let acc = 0, cur = clips[0], local = 0;
    for (const item of clips) { if (t >= acc && t < acc + item.duration) { cur = item; local = t - acc; break; } acc += item.duration; }

    if (speak && voiceOn && cur.text && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id; window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.text);
      u.lang = /[\u0900-\u097F]/.test(cur.text) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }

    const zoom = 1 + Math.min(local / cur.duration, 1) * 0.14;
    ctx.save(); ctx.translate(c.width / 2, c.height / 2); ctx.scale(zoom, zoom); ctx.translate(-c.width / 2, -c.height / 2);
    const img = imgCache.current[cur.id];
    if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, c.width, c.height);
    else { const g = ctx.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#7c2d12"); ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.restore();

    if (cur.text) {
      ctx.fillStyle = "rgba(0,0,0,0.78)"; ctx.fillRect(32, c.height - 230, c.width - 64, 145);
      ctx.font = "900 32px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#a3e635";
      const mid = Math.ceil(cur.text.length / 2), sp = cur.text.indexOf(" ", mid - 6);
      if (cur.text.length > 26 && sp > 0) {
        ctx.fillText(cur.text.slice(0, sp), c.width / 2, c.height - 170);
        ctx.fillStyle = "#ffffff"; ctx.fillText(cur.text.slice(sp + 1), c.width / 2, c.height - 122);
      } else ctx.fillText(cur.text, c.width / 2, c.height - 148);
    }
  };

  useEffect(() => {
    if (screen !== "editor") return;
    if (!playing) { drawFrame(time, false); if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); lastSpokenRef.current = ""; return; }
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
          <div className="rounded-3xl bg-gradient-to-br from-amber-900 via-zinc-900 to-indigo-950 border border-zinc-800 p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center"><Crown className="w-5 h-5" /></div>
              <h1 className="text-3xl font-black">Auto Script to AI Photo Video</h1>
              <p className="text-xs text-lime-300 font-bold">बस स्क्रिप्ट लिखो — AI खुद Taekwondo Fighter और हर सीन की फ़ोटो बनाएगा!</p>
            </div>
          </div>
          <button onClick={() => openEditor("Taekwondo Academy Ad", TEMPLATES[0].lines)} className="w-full bg-gradient-to-r from-lime-400 to-cyan-300 text-black rounded-2xl py-5 font-black text-lg flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-5 h-5" /> अपनी स्क्रिप्ट लिखकर वीडियो बनाएं
          </button>
          <h2 className="font-black text-base flex items-center gap-1.5"><Flame className="w-4 h-4 text-lime-400" /> Instant AI Templates</h2>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => (
              <div key={tpl.id} onClick={() => openEditor(tpl.title, tpl.lines)} className={`bg-gradient-to-br ${tpl.grad} rounded-2xl p-4 h-28 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition`}>
                <div><h3 className="font-black text-base">{tpl.title}</h3><p className="text-[11px] text-white/85">{tpl.sub}</p></div>
                <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-xs font-black">▶</div>
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
            <span className="font-black text-base text-lime-400">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> AI Voice: {voiceOn ? "ON" : "OFF"}</button>
            <button onClick={exportVid} className="bg-lime-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export Video</button>
            {exportUrl && <a href={exportUrl} download="taekwondo-promo.webm" className="bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl">Save File</a>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-lime-400 flex items-center gap-1"><Wand2 className="w-4 h-4" /> अपनी स्क्रिप्ट लिखें (AI खुद Taekwondo फ़ोटो बनाएगा)</label>
            <textarea rows={6} value={scriptText} onChange={(e) => onScriptChange(e.target.value)} className="w-full bg-zinc-800 border border-lime-400/50 rounded-xl p-3 text-xs" />
            <button onClick={() => buildVideo(scriptText, true)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><Sparkles className="w-4 h-4" /> Regenerate AI Photos & Play</button>
            <label className="block border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400"><Plus className="inline w-3.5 h-3.5 mr-1" /> या अपनी एकेडमी की फ़ोटो अपलोड करें<input type="file" accept="image/*" multiple onChange={onUpload} className="hidden" /></label>
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
