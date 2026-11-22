"use client";
import React, { useState, useRef, useEffect } from "react";
import { Film, Plus, Play, Pause, Download, Trash2, Music, Type, Sliders, Sparkles, Volume2 } from "lucide-react";

interface Clip { id: string; name: string; type: "image" | "video"; url: string; duration: number; text: string; color: string; filter: string; }

export default function GremoraEditor() {
  const [scriptText, setScriptText] = useState("महंगे वीडियो एडिटर छोड़ो!\nअब सीधे ब्राउज़र में बनाओ Reels और Shorts!\nAI खुद बनाएगा इमेज और आवाज़!\nअभी आज़माएं GREMORA STUDIO");
  const [clips, setClips] = useState<Clip[]>([
    { id: "1", name: "Scene 1", type: "image", url: "", duration: 4, text: "महंगे वीडियो एडिटर छोड़ो!", color: "#facc15", filter: "none" },
    { id: "2", name: "Scene 2", type: "image", url: "", duration: 4, text: "अब सीधे ब्राउज़र में बनाओ Reels!", color: "#ffffff", filter: "contrast(1.15)" },
  ]);
  const [sel, setSel] = useState("1");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const generateFromScript = () => {
    const lines = scriptText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false); setTime(0); setExportUrl("");
    const colors = ["#facc15", "#ffffff", "#38bdf8", "#4ade80", "#f472b6"];
    const generated: Clip[] = lines.map((line, idx) => {
      const id = "ai-" + Date.now() + "-" + idx;
      const prompt = encodeURIComponent("cinematic digital art background, vibrant lighting, " + line);
      const aiUrl = "https://" + "image.pollinations.ai/prompt/" + prompt + "?width=720&height=1080&nologo=true&seed=" + (idx + 10);
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = aiUrl;
      mediaRef.current[id] = img;
      return { id, name: "AI Scene " + (idx + 1), type: "image", url: aiUrl, duration: 4, text: line, color: colors[idx % colors.length], filter: "contrast(1.1) saturate(1.2)" };
    });
    setClips(generated);
    if (generated[0]) setSel(generated[0].id);
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list: Clip[] = Array.from(e.target.files).map((f) => {
      const id = Math.random().toString(36).slice(2, 7);
      const url = URL.createObjectURL(f);
      const isVid = f.type.startsWith("video");
      if (isVid) { const v = document.createElement("video"); v.src = url; v.muted = true; v.loop = true; mediaRef.current[id] = v; }
      else { const img = new Image(); img.src = url; mediaRef.current[id] = img; }
      return { id, name: f.name.slice(0, 15), type: isVid ? "video" : "image", url, duration: 4, text: "", color: "#ffffff", filter: "none" };
    });
    setClips((p) => [...p, ...list]);
    if (list[0]) setSel(list[0].id);
  };

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioUrl(URL.createObjectURL(file));
  };

  const renderCanvas = (t: number, speakNow = false) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#090d16"; ctx.fillRect(0, 0, c.width, c.height);
    let acc = 0, cur = clips[0], localTime = 0;
    for (const item of clips) { if (t >= acc && t < acc + item.duration) { cur = item; localTime = t - acc; break; } acc += item.duration; }

    if (speakNow && voiceOn && cur.text && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.text);
      u.lang = /[\u0900-\u097F]/.test(cur.text) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }

    ctx.save(); ctx.filter = cur.filter;
    const zoom = 1 + Math.min(localTime / cur.duration, 1) * 0.12;
    ctx.translate(c.width / 2, c.height / 2); ctx.scale(zoom, zoom); ctx.translate(-c.width / 2, -c.height / 2);
    const el = mediaRef.current[cur.id];
    const ok = el instanceof HTMLImageElement ? el.complete && el.naturalWidth > 0 : Boolean(el);
    if (el && ok) { if (el instanceof HTMLVideoElement && playing && el.paused) el.play().catch(() => {}); ctx.drawImage(el, 0, 0, c.width, c.height); }
    else { const g = ctx.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#059669"); ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.restore();

    if (cur.text) {
      ctx.fillStyle = "rgba(0,0,0,0.68)"; ctx.fillRect(36, c.height - 180, c.width - 72, 100);
      ctx.font = "bold 36px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = cur.color;
      ctx.fillText(cur.text.slice(0, 38), c.width / 2, c.height - 120);
    }
  };

  useEffect(() => {
    if (!playing) { renderCanvas(time, false); audioRef.current?.pause(); if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); lastSpokenRef.current = ""; return; }
    if (audioRef.current && audioUrl) audioRef.current.play().catch(() => {});
    const start = performance.now() - time * 1000; let raf = 0;
    const tick = (now: number) => {
      const next = (now - start) / 1000;
      if (next >= total) { setTime(0); setPlaying(false); return; }
      setTime(next); renderCanvas(next, true); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips, voiceOn]);

  const exportVid = () => {
    const c = canvasRef.current; if (!c) return;
    setPlaying(false); setExportUrl("");
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" }); const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
    rec.start(); const start = performance.now();
    const step = (now: number) => { const sec = (now - start) / 1000; renderCanvas(sec, false); if (sec < total) requestAnimationFrame(step); else rec.stop(); };
    requestAnimationFrame(step);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 font-black text-lg"><Film className="text-emerald-400" /> GREMORA AI STUDIO</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}><Volume2 className="w-4 h-4" /> AI Voice: {voiceOn ? "ON" : "OFF"}</button>
          <button onClick={exportVid} className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"><Download className="w-4 h-4" /> Export Video</button>
          {exportUrl && <a href={exportUrl} download="gremora-ai.webm" className="bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg">Save File</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1"><Sparkles className="w-4 h-4" /> Magic Script-to-Video (बिना फ़ोटो डाले)</div>
          <textarea rows={5} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
          <button onClick={generateFromScript} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><Sparkles className="w-4 h-4" /> Auto-Create Video from Script</button>
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            <label className="border border-slate-700 p-2.5 rounded-xl text-center cursor-pointer"><Plus className="inline w-4 h-4 text-emerald-400 mr-1" /><span className="text-[11px] font-bold">Add Media</span><input type="file" accept="image/*,video/*" multiple onChange={addFiles} className="hidden" /></label>
            <label className="border border-slate-700 p-2.5 rounded-xl text-center cursor-pointer"><Music className="inline w-4 h-4 text-cyan-400 mr-1" /><span className="text-[11px] font-bold">Add Music</span><input type="file" accept="audio/*" onChange={handleAudio} className="hidden" /></label>
          </div>
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
        </div>

        <div className="bg-black p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} width={720} height={1080} className="max-h-[380px] w-auto rounded-lg bg-slate-900" />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setPlaying(!playing)} className="bg-emerald-500 text-slate-950 p-2.5 rounded-full cursor-pointer">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
            <span className="text-xs font-mono">{time.toFixed(1)}s / {total}s</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-amber-400 flex items-center gap-1"><Sliders className="w-4 h-4" /> Edit Selected Scene</div>
          <div><label className="text-slate-400"><Type className="inline w-3 h-3" /> Scene Text</label><input value={activeClip.text} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, text: e.target.value } : x))} className="w-full bg-slate-800 p-2 rounded mt-1" /></div>
          <div><label className="text-slate-400">Duration: {activeClip.duration}s</label><input type="range" min={1} max={15} value={activeClip.duration} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, duration: Number(e.target.value) } : x))} className="w-full accent-emerald-500" /></div>
          <div><label className="text-slate-400">Filter</label><select value={activeClip.filter} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, filter: e.target.value } : x))} className="w-full bg-slate-800 p-2 rounded mt-1"><option value="none">Normal</option><option value="contrast(1.3) saturate(1.4)">Vivid</option><option value="grayscale(100%)">Black & White</option><option value="sepia(0.7)">Vintage</option></select></div>
        </div>
      </div>

      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex gap-2 overflow-x-auto">
        {clips.map((c, i) => (
          <div key={c.id} onClick={() => { setSel(c.id); setPlaying(false); }} className={`p-2.5 rounded-lg border min-w-[150px] flex justify-between items-center cursor-pointer ${sel === c.id ? "border-emerald-400 bg-emerald-950/50" : "border-slate-700 bg-slate-800"}`}>
            <span className="text-xs font-bold truncate">{i + 1}. {c.name} ({c.duration}s)</span>
            {clips.length > 1 && <Trash2 onClick={(e) => { e.stopPropagation(); setClips((p) => p.filter((x) => x.id !== c.id)); }} className="w-3.5 h-3.5 text-red-400 shrink-0 ml-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
