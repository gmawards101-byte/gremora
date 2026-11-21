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
