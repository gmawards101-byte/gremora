"use client";
import React, { useState, useRef, useEffect } from "react";
import { Film, Plus, Play, Pause, Download, Trash2, Music, Type, Sliders } from "lucide-react";

export default function GremoraEditor() {
  const [clips, setClips] = useState([
    { id: "1", name: "Intro Clip", type: "image", url: "", duration: 3, text: "GREMORA AI STUDIO", color: "#facc15", filter: "none" },
    { id: "2", name: "Promo Clip", type: "image", url: "", duration: 3, text: "Edit Videos Like a Pro!", color: "#ffffff", filter: "contrast(1.2)" },
  ]);
  const [sel, setSel] = useState("1");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list = Array.from(e.target.files).map((f) => {
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

  const renderCanvas = (t: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, c.width, c.height);
    let acc = 0, cur = clips[0];
    for (const item of clips) { if (t >= acc && t < acc + item.duration) { cur = item; break; } acc += item.duration; }
    ctx.save();
    ctx.filter = cur.filter;
    const el = mediaRef.current[cur.id];
    if (el) {
      if (el instanceof HTMLVideoElement && playing && el.paused) el.play().catch(() => {});
      ctx.drawImage(el, 0, 0, c.width, c.height);
    } else {
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#059669");
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.restore();
    if (cur.text) {
      ctx.font = "bold 42px sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(40, c.height - 140, c.width - 80, 65);
      ctx.fillStyle = cur.color; ctx.fillText(cur.text, c.width / 2, c.height - 95);
    }
  };

  useEffect(() => {
    if (!playing) { renderCanvas(time); audioRef.current?.pause(); return; }
    if (audioRef.current && audioUrl) audioRef.current.play().catch(() => {});
    const start = performance.now() - time * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const next = (now - start) / 1000;
      if (next >= total) { setTime(0); setPlaying(false); return; }
      setTime(next); renderCanvas(next); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips]);

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
      renderCanvas(sec);
      if (sec < total) requestAnimationFrame(step); else rec.stop();
    };
    requestAnimationFrame(step);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans space-y-4">
      <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 font-black text-lg"><Film className="text-emerald-400" /> GREMORA STUDIO</div>
        <div className="flex gap-2">
          <button onClick={exportVid} className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1"><Download className="w-4 h-4" /> Export Video</button>
          {exportUrl && <a href={exportUrl} download="gremora.webm" className="bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg">Save File</a>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="block border-2 border-dashed border-slate-700 p-4 rounded-xl text-center cursor-pointer hover:border-emerald-400">
            <Plus className="mx-auto text-emerald-400 mb-1" /><span className="text-xs font-bold">Add Photos / Videos</span>
            <input type="file" accept="image/*,video/*" multiple onChange={addFiles} className="hidden" />
          </label>
          <label className="block border border-slate-700 p-3 rounded-xl text-center cursor-pointer">
            <Music className="inline w-4 h-4 text-cyan-400 mr-1" /><span className="text-xs font-bold">Add Background Music</span>
            <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && setAudioUrl(URL.createObjectURL(e.target.files[0]))} className="hidden" />
          </label>
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
        </div>
        <div className="bg-black p-3 rounded-xl border border-slate-800 flex flex-col items-center">
          <canvas ref={canvasRef} width={720} height={1080} className="max-h-[360px] w-auto rounded-lg bg-slate-900" />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setPlaying(!playing)} className="bg-emerald-500 text-slate-950 p-2 rounded-full">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
            <span className="text-xs font-mono">{time.toFixed(1)}s / {total}s</span>
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-amber-400 flex items-center gap-1"><Sliders className="w-4 h-4" /> Edit Selected Clip</div>
          <div><label className="text-slate-400"><Type className="inline w-3 h-3" /> Text</label><input value={activeClip.text} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, text: e.target.value } : x))} className="w-full bg-slate-800 p-2 rounded mt-1" /></div>
          <div><label className="text-slate-400">Duration: {activeClip.duration}s</label><input type="range" min={1} max={15} value={activeClip.duration} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, duration: Number(e.target.value) } : x))} className="w-full" /></div>
          <div><label className="text-slate-400">Filter</label><select value={activeClip.filter} onChange={(e) => setClips((p) => p.map((x) => x.id === activeClip.id ? { ...x, filter: e.target.value } : x))} className="w-full bg-slate-800 p-2 rounded mt-1"><option value="none">Normal</option><option value="contrast(1.3) saturate(1.4)">Vivid</option><option value="grayscale(100%)">Black & White</option><option value="sepia(0.7)">Vintage</option></select></div>
        </div>
      </div>
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex gap-2 overflow-x-auto">
        {clips.map((c, i) => (
          <div key={c.id} onClick={() => { setSel(c.id); setPlaying(false); }} className={`p-2.5 rounded-lg border min-w-[140px] flex justify-between items-center cursor-pointer ${sel === c.id ? "border-emerald-400 bg-emerald-950/50" : "border-slate-700 bg-slate-800"}`}>
            <span className="text-xs font-bold">{i + 1}. {c.name} ({c.duration}s)</span>
            {clips.length > 1 && <Trash2 onClick={(e) => { e.stopPropagation(); setClips((p) => p.filter((x) => x.id !== c.id)); }} className="w-3.5 h-3.5 text-red-400" />}
          </div>
        ))}
      </div>
    </div>
  );
}
