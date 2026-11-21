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
