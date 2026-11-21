"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Film,
  Plus,
  Play,
  Pause,
  Download,
  Trash2,
  Music,
  Type,
  Sparkles,
  Scissors,
  Sliders,
  ArrowUp,
  ArrowDown,
  Volume2,
} from "lucide-react";

interface ClipItem {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  duration: number;
  filter: string;
  transition: "none" | "fade" | "zoom" | "slide";
  overlayText: string;
  textColor: string;
  textPosition: "top" | "center" | "bottom";
  speed: number;
}

export default function GremoraEditor() {
  const [clips, setClips] = useState<ClipItem[]>([
    {
      id: "demo-1",
      name: "Intro Title Clip",
      type: "image",
      url: "",
      duration: 3,
      filter: "none",
      transition: "zoom",
      overlayText: "GREMORA AI STUDIO",
      textColor: "#facc15",
      textPosition: "center",
      speed: 1,
    },
    {
      id: "demo-2",
      name: "Promo Offer Clip",
      type: "image",
      url: "",
      duration: 3,
      filter: "contrast(1.15) saturate(1.2)",
      transition: "fade",
      overlayText: "Edit Videos Like a Pro!",
      textColor: "#ffffff",
      textPosition: "bottom",
      speed: 1,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>("demo-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaElementsRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);

  const selectedClip = clips.find((c) => c.id === selectedId) || clips.at(0);
  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);

  const getCanvasSize = () => {
    if (aspectRatio === "16:9") return { width: 1280, height: 720 };
    if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
    return { width: 720, height: 1280 };
  };

  useEffect(() => {
    clips.forEach((clip) => {
      if (!clip.url || mediaElementsRef.current[clip.id]) return;
      if (clip.type === "image") {
        const img = new Image();
        img.src = clip.url;
        mediaElementsRef.current[clip.id] = img;
      } else {
        const vid = document.createElement("video");
        vid.src = clip.url;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.load();
        mediaElementsRef.current[clip.id] = vid;
      }
    });
  }, [clips]);

  const handleUploadMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newClips: ClipItem[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video");
      newClips.push({
        id: "clip-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        name: file.name.slice(0, 18),
        type: isVideo ? "video" : "image",
        url,
        duration: 4,
        filter: "none",
        transition: "fade",
        overlayText: "",
        textColor: "#ffffff",
        textPosition: "bottom",
        speed: 1,
      });
    });
    setClips((prev) => [...prev, ...newClips]);
    if (newClips.at(0)) setSelectedId(newClips.at(0)!.id);
    setExportUrl("");
  };
  const handleUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name.slice(0, 24));
    setExportUrl("");
  };

  const updateSelectedClip = (updates: Partial<ClipItem>) => {
    if (!selectedClip) return;
    setClips((prev) =>
      prev.map((c) => (c.id === selectedClip.id ? { ...c, ...updates } : c))
    );
    setExportUrl("");
  };

  const moveClip = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= clips.length) return;
    const updated = [...clips];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setClips(updated);
  };

  const removeClip = (id: string) => {
    if (clips.length <= 1) return;
    const filtered = clips.filter((c) => c.id !== id);
    setClips(filtered);
    if (selectedId === id && filtered.at(0)) setSelectedId(filtered.at(0)!.id);
  };

  const drawFrameAtTime = (timeSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas || clips.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.save();
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    let elapsed = 0;
    let activeClip = clips.at(0)!;
    let localTime = 0;

    for (const c of clips) {
      if (timeSec >= elapsed && timeSec < elapsed + c.duration) {
        activeClip = c;
        localTime = timeSec - elapsed;
        break;
      }
      elapsed += c.duration;
    }

    const progress = Math.min(localTime / activeClip.duration, 1);
    ctx.filter = activeClip.filter || "none";

    if (activeClip.transition === "fade" && localTime < 0.6) {
      ctx.globalAlpha = Math.max(0.15, localTime / 0.6);
    }

    ctx.save();
    if (activeClip.transition === "zoom") {
      const scale = 1 + progress * 0.14;
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
    } else if (activeClip.transition === "slide" && localTime < 0.5) {
      const offsetX = (1 - localTime / 0.5) * (width * 0.25);
      ctx.translate(offsetX, 0);
    }

    const mediaEl = mediaElementsRef.current[activeClip.id];
    if (mediaEl) {
      if (activeClip.type === "video") {
        const vid = mediaEl as HTMLVideoElement;
        vid.playbackRate = activeClip.speed || 1;
        if (vid.paused && (isPlaying || isExporting)) {
          vid.play().catch(() => {});
        }
      }
      const mw =
        activeClip.type === "video"
          ? (mediaEl as HTMLVideoElement).videoWidth || width
          : (mediaEl as HTMLImageElement).naturalWidth || width;
      const mh =
        activeClip.type === "video"
          ? (mediaEl as HTMLVideoElement).videoHeight || height
          : (mediaEl as HTMLImageElement).naturalHeight || height;

      const ratio = Math.max(width / mw, height / mh);
      const dw = mw * ratio;
      const dh = mh * ratio;
      ctx.drawImage(mediaEl, (width - dw) / 2, (height - dh) / 2, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(1, "#059669");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
    ctx.filter = "none";
    ctx.globalAlpha = 1;

    if (activeClip.overlayText.trim()) {
      const fontSize = Math.round(width * 0.058);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      const yPos =
        activeClip.textPosition === "top"
          ? height * 0.16
          : activeClip.textPosition === "center"
          ? height * 0.52
          : height * 0.85;

      ctx.fillStyle = "rgba(0,0,0,0.62)";
      const textWidth = Math.min(ctx.measureText(activeClip.overlayText).width + 60, width * 0.9);
      ctx.fillRect((width - textWidth) / 2, yPos - fontSize, textWidth, fontSize * 1.45);

      ctx.fillStyle = activeClip.textColor || "#ffffff";
      ctx.fillText(activeClip.overlayText, width / 2, yPos);
    }

    ctx.restore();
  };

  useEffect(() => {
    if (!isPlaying) {
      drawFrameAtTime(currentTime);
      if (audioRef.current) audioRef.current.pause();
      Object.values(mediaElementsRef.current).forEach((el) => {
        if (el instanceof HTMLVideoElement) el.pause();
      });
      return;
    }

    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(() => {});
    }

    const startWall = performance.now() - currentTime * 1000;
    const tick = (now: number) => {
      const nextTime = (now - startWall) / 1000;
      if (nextTime >= totalDuration) {
        setCurrentTime(0);
        setIsPlaying(false);
        return;
      }
      setCurrentTime(nextTime);
      drawFrameAtTime(nextTime);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, clips, aspectRatio]);

  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;

    setIsPlaying(false);
    setIsExporting(true);
    setExportUrl("");

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setExportUrl(URL.createObjectURL(blob));
      setIsExporting(false);
      setCurrentTime(0);
      Object.values(mediaElementsRef.current).forEach((el) => {
        if (el instanceof HTMLVideoElement) el.pause();
      });
    };

    recorder.start();
    const startWall = performance.now();

    const exportTick = (now: number) => {
      const elapsedSec = (now - startWall) / 1000;
      setCurrentTime(Math.min(elapsedSec, totalDuration));
      drawFrameAtTime(elapsedSec);
      if (elapsedSec < totalDuration) {
        requestAnimationFrame(exportTick);
      } else {
        recorder.stop();
      }
    };

    requestAnimationFrame(exportTick);
  };

  const canvasDim = getCanvasSize();
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-emerald-500 to-cyan-400 p-2 rounded-xl text-slate-950">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-wide">GREMORA STUDIO</h1>
            <p className="text-[11px] text-slate-400">Online Multi-Track Video Editor</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-bold">
            {(["9:16", "16:9", "1:1"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => {
                  setAspectRatio(ratio);
                  setExportUrl("");
                }}
                className={`px-2.5 py-1 rounded ${
                  aspectRatio === ratio ? "bg-emerald-500 text-slate-950" : "text-slate-300"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? `Exporting (${Math.ceil(totalDuration)}s)...` : "Export Video"}</span>
          </button>

          {exportUrl && (
            <a
              href={exportUrl}
              download="gremora-edited-video.webm"
              className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl animate-bounce"
            >
              <Download className="w-4 h-4" />
              <span>Save File</span>
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <div className="lg:col-span-3 bg-slate-900/70 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Media Library
          </h2>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer bg-slate-900/80 transition">
            <Plus className="w-7 h-7 text-emerald-400 mb-1" />
            <span className="text-xs font-bold">Add Photos or Videos</span>
            <span className="text-[11px] text-slate-400 mt-0.5">MP4, WebM, JPG, PNG</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUploadMedia}
              className="hidden"
            />
          </label>

          <label className="flex items-center justify-between border border-slate-700 hover:border-cyan-400 rounded-xl p-3 cursor-pointer bg-slate-900">
            <div className="flex items-center gap-2.5">
              <Music className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs font-bold">{audioName || "Add Background Music"}</p>
                <p className="text-[10px] text-slate-400">MP3 / WAV Audio Track</p>
              </div>
            </div>
            <span className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-lg font-bold text-cyan-300">
              Browse
            </span>
            <input type="file" accept="audio/*" onChange={handleUploadAudio} className="hidden" />
          </label>
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}

          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1 text-[11px] text-slate-400">
            <p className="font-bold text-slate-200">💡 Quick Tips:</p>
            <p>• नीचे Timeline से किसी भी क्लिप पर क्लिक करके उसका टेक्स्ट, स्पीड, ट्रांज़िशन और फ़िल्टर बदलें।</p>
            <p>• ऊपर <b>9:16</b> (Reels/Shorts) या <b>16:9</b> (YouTube) साइज़ चुनें।</p>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-950 p-4 flex flex-col items-center justify-center space-y-3">
          <div className="relative flex items-center justify-center bg-black rounded-2xl border border-slate-800 p-2 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={canvasDim.width}
              height={canvasDim.height}
              className="max-h-[420px] w-auto rounded-xl bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-4 bg-slate-900 px-5 py-2 rounded-full border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2 rounded-full cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-xs font-mono text-slate-300">
              {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </span>
            {audioName && (
              <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Music Active
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-900/70 border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400" /> Clip Effects & Text
          </h2>

          {selectedClip && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Overlay Text (हिंदी / English)
                </label>
                <input
                  type="text"
                  value={selectedClip.overlayText}
                  onChange={(e) => updateSelectedClip({ overlayText: e.target.value })}
                  placeholder="यहाँ स्क्रीन पर दिखने वाला टेक्स्ट लिखें..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Text Color</label>
                  <input
                    type="color"
                    value={selectedClip.textColor}
                    onChange={(e) => updateSelectedClip({ textColor: e.target.value })}
                    className="w-full h-9 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Position</label>
                  <select
                    value={selectedClip.textPosition}
                    onChange={(e) =>
                      updateSelectedClip({
                        textPosition: e.target.value as "top" | "center" | "bottom",
                      })
                    }
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-white"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">
                  Clip Duration (Trim): {selectedClip.duration}s
                </label>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={selectedClip.duration}
                  onChange={(e) => updateSelectedClip({ duration: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Transition Effect</label>
                <select
                  value={selectedClip.transition}
                  onChange={(e) =>
                    updateSelectedClip({
                      transition: e.target.value as "none" | "fade" | "zoom" | "slide",
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="none">None</option>
                  <option value="fade">Smooth Fade</option>
                  <option value="zoom">Ken Burns Zoom</option>
                  <option value="slide">Dynamic Slide</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Color Filter</label>
                <select
                  value={selectedClip.filter}
                  onChange={(e) => updateSelectedClip({ filter: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"

                                 <option value="none">Original (Normal)</option>
                  <option value="contrast(1.25) saturate(1.35)">Vivid & Bright</option>
                  <option value="grayscale(100%) contrast(1.2)">Classic Black & White</option>
                  <option value="sepia(0.65) contrast(1.1)">Warm Vintage</option>
                  <option value="brightness(1.15) contrast(1.1)">Soft Glow</option>
                </select>
              </div>

              {selectedClip.type === "video" && (
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">
                    Playback Speed: {selectedClip.speed}x
                  </label>
                  <select
                    value={selectedClip.speed}
                    onChange={(e) => updateSelectedClip({ speed: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={0.5}>0.5x (Slow Motion)</option>
                    <option value={1}>1.0x (Normal)</option>
                    <option value={1.5}>1.5x (Fast)</option>
                    <option value={2}>2.0x (Super Fast)</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-emerald-400" /> Video Timeline ({clips.length} Clips)
          </span>
          <span className="text-[11px] text-slate-400">Total Length: {totalDuration}s</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              onClick={() => {
                setSelectedId(clip.id);
                setIsPlaying(false);
              }}
              className={`min-w-[165px] p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                selectedClip?.id === clip.id
                  ? "bg-emerald-950/60 border-emerald-400 shadow-md"
                  : "bg-slate-800/80 border-slate-700 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold truncate">
                  {index + 1}. {clip.name}
                </span>
                <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                  {clip.duration}s
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/60">
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveClip(index, -1);
                    }}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
                    title="Move Left"
                  >
                    <ArrowUp className="w-3 h-3 -rotate-90" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveClip(index, 1);
                    }}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
                    title="Move Right"
                  >
                    <ArrowDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeClip(clip.id);
                  }}
                  className="p-1 bg-red-950/70 hover:bg-red-800 text-red-300 rounded"
                  title="Delete Clip"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
  
