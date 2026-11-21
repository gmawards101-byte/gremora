"use client";

import React, { useState, useRef, useEffect } from "react";
import { Film, Plus, Play, Pause, Download, Trash2, Music, Type, Sparkles, Scissors, Sliders, Volume2 } from "lucide-react";

interface ClipItem {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  duration: number;
  filter: string;
  transition: "none" | "fade" | "zoom";
  overlayText: string;
  textColor: string;
  textPosition: "top" | "center" | "bottom";
  speed: number;
}

export default function GremoraEditor() {
  const [clips, setClips] = useState<ClipItem[]>([
    { id: "d1", name: "Intro Clip", type: "image", url: "", duration: 3, filter: "none", transition: "zoom", overlayText: "GREMORA AI STUDIO", textColor: "#facc15", textPosition: "center", speed: 1 },
    { id: "d2", name: "Promo Clip", type: "image", url: "", duration: 3, filter: "contrast(1.15)", transition: "fade", overlayText: "Edit Videos Like a Pro!", textColor: "#ffffff", textPosition: "bottom", speed: 1 },
  ]);
  const [selectedId, setSelectedId] = useState("d1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedClip = clips.find((c) => c.id === selectedId) || clips.at(0);
  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);
  const canvasDim = aspectRatio === "16:9" ? { width: 1280, height: 720 } : aspectRatio === "1:1" ? { width: 1080, height: 1080 } : { width: 720, height: 1280 };

  useEffect(() => {
    clips.forEach((clip) => {
      if (!clip.url || mediaRef.current[clip.id]) return;
      if (clip.type === "image") {
        const img = new Image();
        img.src = clip.url;
        mediaRef.current[clip.id] = img;
      } else {
        const vid = document.createElement("video");
        vid.src = clip.url;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.load();
        mediaRef.current[clip.id] = vid;
      }
    });
  }, [clips]);

  const handleUploadMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: ClipItem[] = Array.from(e.target.files).map((f) => ({
      id: "c-" + Date.now() + "-" + Math.random().toString(36).slice(2, 5),
      name: f.name.slice(0, 16),
      type: f.type.startsWith("video") ? "video" : "image",
      url: URL.createObjectURL(f),
      duration: 4,
      filter: "none",
      transition: "fade",
      overlayText: "",
      textColor: "#ffffff",
      textPosition: "bottom",
      speed: 1,
    }));
    setClips((p) => [...p, ...added]);
    if (added.at(0)) setSelectedId(added.at(0)!.id);
    setExportUrl("");
  };

  const handleUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name.slice(0, 22));
    setExportUrl("");
  };

  const updateClip = (updates: Partial<ClipItem>) => {
    if (!selectedClip) return;
    setClips((p) => p.map((c) => (c.id === selectedClip.id ? { ...c, ...updates } : c)));
    setExportUrl("");
  };

  const drawFrame = (t: number) => {
    const canvas = canvasRef.current;
    if (!canvas || clips.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    let elapsed = 0;
    let active = clips.at(0)!;
    let local = 0;
    for (const c of clips) {
      if (t >= elapsed && t < elapsed + c.duration) {
        active = c;
        local = t - elapsed;
        break;
      }
      elapsed += c.duration;
    }

    ctx.save();
    ctx.filter = active.filter || "none";
    if (active.transition === "fade" && local < 0.6) ctx.globalAlpha = Math.max(0.15, local / 0.6);
    if (active.transition === "zoom") {
      const s = 1 + Math.min(local / active.duration, 1) * 0.14;
      ctx.translate(width / 2, height / 2);
      ctx.scale(s, s);
      ctx.translate(-width / 2, -height / 2);
    }

    const el = mediaRef.current[active.id];
    if (el) {
      if (active.type === "video") {
        const v = el as HTMLVideoElement;
        v.playbackRate = active.speed || 1;
        if (v.paused && (isPlaying || isExporting)) v.play().catch(() => {});
      }
      const mw = active.type === "video" ? (el as HTMLVideoElement).videoWidth || width : (el as HTMLImageElement).naturalWidth || width;
      const mh = active.type === "video" ? (el as HTMLVideoElement).videoHeight || height : (el as HTMLImageElement).naturalHeight || height;
      const r = Math.max(width / mw, height / mh);
      ctx.drawImage(el, (width - mw * r) / 2, (height - mh * r) / 2, mw * r, mh * r);
    } else {
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "#1e1b4b");
      g.addColorStop(1, "#059669");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    if (active.overlayText.trim()) {
      const fs = Math.round(width * 0.056);
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = "center";
      const y = active.textPosition === "top" ? height * 0.16 : active.textPosition === "center" ? height * 0.52 : height * 0.85;
      const tw = Math.min(ctx.measureText(active.overlayText).width + 50, width * 0.9);
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect((width - tw) / 2, y - fs, tw, fs * 1.45);
      ctx.fillStyle = active.textColor;
      ctx.fillText(active.overlayText, width / 2, y);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      drawFrame(currentTime);
      audioRef.current?.pause();
      Object.values(mediaRef.current).forEach((el) => { if (el instanceof HTMLVideoElement) el.pause(); });
      return;
    }
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(() => {});
    }
    let raf = 0;
    const start = performance.now() - currentTime * 1000;
    const loop = (now: number) => {
      const next = (now - start) / 1000;
      if (next >= totalDuration) {
        setCurrentTime(0);
        setIsPlaying(false);
        return;
      }
      setCurrentTime(next);
      drawFrame(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, clips, aspectRatio]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;
    setIsPlaying(false);
    setIsExporting(true);
    setExportUrl("");
    const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
      setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
      setIsExporting(false);
      setCurrentTime(0);
      Object.values(mediaRef.current).forEach((el) => { if (el instanceof HTMLVideoElement) el.pause(); });
    };
    rec.start();
    const start = performance.now();
    const step = (now: number) => {
      const sec = (now - start) / 1000;
      setCurrentTime(Math.min(sec, totalDuration));
      drawFrame(sec);
      if (sec < totalDuration) requestAnimationFrame(step);
      else rec.stop();
    };
    requestAnimationFrame(step);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-xl text-slate-950"><Film className="w-5 h-5" /></div>
          <div>
            <h1 className="font-black text-lg">GREMORA STUDIO</h1>
            <p className="text-[11px] text-slate-400">Online Multi-Track Video Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-bold">
            {(["9:16", "16:9", "1:1"] as const).map((r) => (
              <button key={r} onClick={() => { setAspectRatio(r); setExportUrl(""); }} className={`px-2.5 py-1 rounded ${aspectRatio === r ? "bg-emerald-500 text-slate-950" : "text-slate-300"}`}>{r}</button>
            ))}
          </div>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer">
            <Download className="w-4 h-4" /><span>{isExporting ? "Exporting..." : "Export Video"}</span>
          </button>
          {exportUrl && (
            <a href={exportUrl} download="gremora-video.webm" className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl">
              <Download className="w-4 h-4" /><span>Save File</span>
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-3 bg-slate-900/70 border-r border-slate-800 p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><Sparkles className="w-4 h-4 text-emerald-400" /> Media Library</h2>
          <div className="bg-emerald-500 p-2 rounded-xl text-slate-950"><Film className="w-5 h-5" /></div>
          <div>
            <h1 className="font-black text-lg">GREMORA STUDIO</h1>
            <p className="text-[11px] text-slate-400">Online Multi-Track Video Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-bold">
            {(["9:16", "16:9", "1:1"] as const).map((r) => (
              <button key={r} onClick={() => { setAspectRatio(r); setExportUrl(""); }} className={`px-2.5 py-1 rounded ${aspectRatio === r ? "bg-emerald-500 text-slate-950" : "text-slate-300"}`}>{r}</button>
            ))}
          </div>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer">
            <Download className="w-4 h-4" /><span>{isExporting ? "Exporting..." : "Export Video"}</span>
          </button>
          {exportUrl && (
            <a href={exportUrl} download="gremora-video.webm" className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl">
              <Download className="w-4 h-4" /><span>Save File</span>
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-3 bg-slate-900/70 border-r border-slate-800 p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><Sparkles className="w-4 h-4 text-emerald-400" /> Media Library</h2>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer bg-slate-900">
            <Plus className="w-7 h-7 text-emerald-400 mb-1" />
            <span className="text-xs font-bold">Add Photos or Videos</span>
            <input type="file" accept="image/*,video/*" multiple onChange={handleUploadMedia} className="hidden" />
          </label>
          <label className="flex items-center justify-between border border-slate-700 rounded-xl p-3 cursor-pointer bg-slate-900">
            <div className="flex items-center gap-2"><Music className="w-5 h-5 text-cyan-400" /><span className="text-xs font-bold">{audioName || "Add Music"}</span></div>
            <span className="text-[11px] bg-slate-800 px-2 py-1 rounded text-cyan-300">Browse</span>
            <input type="file" accept="audio/*" onChange={handleUploadAudio} className="hidden" />
          </label>
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
        </div>

        <div className="lg:col-span-6 bg-slate-950 p-4 flex flex-col items-center justify-center space-y-3">
          <div className="bg-black rounded-2xl border border-slate-800 p-2">
            <canvas ref={canvasRef} width={canvasDim.width} height={canvasDim.height} className="max-h-[400px] w-auto rounded-xl" />
          </div>
          <div className="flex items-center gap-4 bg-slate-900 px-5 py-2 rounded-full border border-slate-800">
            <button onClick={() => setIsPlaying(!isPlaying)} className="bg-emerald-500 text-slate-950 p-2 rounded-full cursor-pointer">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-xs font-mono">{currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
            {audioName && <span className="text-xs text-cyan-400 flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> Music</span>}
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-900/70 border-l border-slate-800 p-4 space-y-3 text-xs">
          <h2 className="font-bold uppercase text-slate-400 flex items-center gap-1"><Sliders className="w-4 h-4 text-amber-400" /> Effects & Text</h2>
          {selectedClip && (
            <>
              <div>
                <label className="block text-slate-400 mb-1 font-bold flex items-center gap-1"><Type className="w-3.5 h-3.5" /> Overlay Text</label>
                <input type="text" value={selectedClip.overlayText} onChange={(e) => updateClip({ overlayText: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Color</label>
                  <input type="color" value={selectedClip.textColor} onChange={(e) => updateClip({ textColor: e.target.value })} className="w-full h-9 rounded bg-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Position</label>
                  <select value={selectedClip.textPosition} onChange={(e) => updateClip({ textPosition: e.target.value as "top" | "center" | "bottom" })} className="w-full h-9 bg-slate-800 border border-slate-700 rounded px-2">
                    <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Duration: {selectedClip.duration}s</label>
                <input type="range" min={1} max={15} value={selectedClip.duration} onChange={(e) => updateClip({ duration: Number(e.target.value) })} className="w-full accent-emerald-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Transition</label>
                <select value={selectedClip.transition} onChange={(e) => updateClip({ transition: e.target.value as "none" | "fade" | "zoom" })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                  <option value="none">None</option><option value="fade">Fade</option><option value="zoom">Zoom</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Filter</label>
                <select value={selectedClip.filter} onChange={(e) => updateClip({ filter: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                  <option value="none">Normal</option><option value="contrast(1.25) saturate(1.35)">Vivid</option><option value="grayscale(100%)">B&W</option><option value="sepia(0.65)">Vintage</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold flex items-center gap-1"><Scissors className="w-3.5 h-3.5 text-emerald-400" /> Timeline ({clips.length} Clips)</span>
          <span className="text-[11px] text-slate-400">Total: {totalDuration}s</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clips.map((c, i) => (
            <div key={c.id} onClick={() => { setSelectedId(c.id); setIsPlaying(false); }} className={`min-w-[150px] p-2.5 rounded-xl border cursor-pointer flex items-center justify-between ${selectedClip?.id === c.id ? "bg-emerald-950/60 border-emerald-400" : "bg-slate-800 border-slate-700"}`}>
              <div>
                <p className="text-xs font-bold truncate">{i + 1}. {c.name}</p>
                <p className="text-[10px] text-emerald-400">{c.duration}s</p>
              </div>
              {clips.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); setClips((p) => p.filter((x) => x.id !== c.id)); }} className="p-1 bg-red-950 text-red-300 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}}
