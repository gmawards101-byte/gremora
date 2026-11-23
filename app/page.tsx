"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Download, Trash2, Sparkles, Volume2, ArrowLeft, Flame, Crown, Home, LayoutGrid, FolderOpen, User, ArrowUpRight, Wand2 } from "lucide-react";

interface Clip {
  id: string;
  name: string;
  imgUrl: string;
  duration: number;
  text: string;
}

const TEMPLATES = [
  { id: "taekwondo", title: "Taekwondo Academy Ad", sub: "Sports & Olympics", grad: "from-amber-500 via-orange-600 to-rose-600", lines: ["क्या आप अपने बच्चों को Taekwondo चैंपियन बनाना चाहते हैं?", "Train Like a Champion, Dream for Olympics!", "Back Side PNB Bank, Loharu Road, Charkhi Dadri, Haryana", "अभी संपर्क करें: 7027604041"] },
  { id: "story", title: "AI Fantasy Story", sub: "3D Cinema Style", grad: "from-indigo-600 via-purple-600 to-pink-500", lines: ["In a hidden kingdom beyond the clouds, a young hero found a glowing sword!", "Darkness was rising, but courage burned brighter!", "The greatest adventure had just begun!"] },
  { id: "business", title: "Business Promo Ad", sub: "Viral Marketing", grad: "from-lime-500 via-emerald-500 to-cyan-500", lines: ["क्या आप भी अपने बिज़नेस को तेज़ी से बढ़ाना चाहते हैं?", "अब बिना कैमरे के बनाएं शानदार विज्ञापन वीडियो!", "अभी आज़माएं GREMORA AI STUDIO!"] },
  { id: "fitness", title: "Fitness & Martial Arts", sub: "Power & Discipline", grad: "from-cyan-500 via-blue-600 to-indigo-700", lines: ["हर दिन खुद को पहले से ज़्यादा मज़बूत बनाओ!", "Self Defense, Fitness और Olympic Training!", "आज ही जॉइन करें हमारी एकेडमी!"] },
];

export default function GremoraAutoPhotoVideo() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [title, setTitle] = useState("Auto Script-to-Video");
  const [scriptText, setScriptText] = useState(TEMPLATES.lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [time, setTime] = useState(0);
  const [exportUrl, setExportUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const lastSpokenRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeClip = clips.find((c) => c.id === sel) || clips;
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const getVisualPrompt = (line: string) => {
    const l = line.toLowerCase();
    if (l.includes("taekwondo") || l.includes("fighter") || l.includes("olympic") || l.includes("champion") || l.includes("martial")) {
      return "taekwondo fighter high kick in dramatic stadium spotlight, martial arts champion, cinematic 8k action photo";
    }
    if (l.includes("bank") || l.includes("road") || l.includes("haryana") || l.includes("call") || /\d{8,}/.test(l)) {
      return "modern martial arts training academy arena with trophies and gold medals, dramatic lighting, 8k";
    }
    return "cinematic dramatic digital art scene, vibrant spotlight, 8k, " + line;
  };

  const autoBuildAndPlay = (rawScript: string, autoPlay = true) => {
    const lines = rawScript.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false);
    setTime(0);
    setExportUrl("");

    const built: Clip[] = lines.map((line, i) => {
      const id = "ai-" + Date.now() + "-" + i;
      const prompt = encodeURIComponent(getVisualPrompt(line));
      const url = "https://" + "image.pollinations.ai/prompt/" + prompt + "?width=720&height=1280&nologo=true&seed=" + (700 + i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      imgCache.current[id] = img;
      return { id, name: `Scene ${i + 1}`, imgUrl: url, duration: 4, text: line };
    });

    setClips(built);
    if (built) setSel(built.id);
    if (autoPlay) setTimeout(() => setPlaying(true), 300);
  };

  const openEditorWithScript = (projTitle: string, lines: string[]) => {
    setTitle(projTitle);
    const joined = lines.join("\n");
    setScriptText(joined);
    setScreen("editor");
    autoBuildAndPlay(joined, true);
  };

  const handleScriptChange = (val: string) => {
    setScriptText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      autoBuildAndPlay(val, true);
    }, 900);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => {
      const id = "up-" + Date.now() + "-" + i;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.src = url;
      imgCache.current[id] = img;
      return { id, name: f.name.slice(0, 14), imgUrl: url, duration: 4, text: "" };
    });
    setClips((p) => [...p, ...added]);
    if (added) setSel(added.id);
  };

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current;
    if (!c || !clips.length) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let acc = 0, cur = clips, local = 0;
    for (const item of clips) {
      if (t >= acc && t < acc + item.duration) { cur = item; local = t - acc; break; }
      acc += item.duration;
    }

    if (speak && voiceOn && cur.text && lastSpokenRef.current !== cur.id && typeof window !== "undefined" && "speechSynthesis" in window) {
      lastSpokenRef.current = cur.id;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.text);
      u.lang = /[\u0900-\u097F]/.test(cur.text) ? "hi-IN" : "en-US";
      u.rate = 0.98;
      window.speechSynthesis.speak(u);
    }

    const p = Math.min(local / cur.duration, 1);
    ctx.save();
    const zoom = 1 + p * 0.14;
    ctx.translate(c.width / 2, c.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-c.width / 2, -c.height / 2);

    const img = imgCache.current[cur.id];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, c.width, c.height);
    } else {
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#1e1b4b");
      g.addColorStop(0.5, "#7c2d12");
      g.addColorStop(1, "#090d16");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.restore();

    if (cur.text) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.fillRect(32, c.height - 230, c.width - 64, 145);
      ctx.font = "900 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#a3e635";
      const mid = Math.ceil(cur.text.length / 2);
      const sp = cur.text.indexOf(" ", mid - 6);
      if (cur.text.length > 26 && sp > 0) {
        ctx.fillText(cur.text.slice(0, sp), c.width / 2, c.height - 170);
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
    const start = performance.now() - time * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const next = (now - start) / 1000;
      if (next >= total) { setTime(0); setPlaying(false); return; }
      setTime(next);
      drawFrame(next, true);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips, voiceOn, screen]);

  const exportVid = () => {
    const c = canvasRef.current;
    if (!c) return;
    setPlaying(false);
    setExportUrl("");
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => setExportUrl(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
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
      <div className="min-h-screen bg-[#07080b] text-white pb-24 font-sans">
        <div className="max-w-3xl mx-auto p-4 space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-amber-900 via-zinc-900 to-indigo-950 border border-zinc-800 p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-5 h-5" /></div>
              <h1 className="text-3xl font-black leading-tight">Auto Script<br />to AI Photo Video</h1>
              <p className="text-xs text-lime-300 font-bold">स्क्रिप्ट लिखें — AI खुद Taekwondo Fighter और हर सीन की फ़ोटो बनाएगा!</p>
            </div>
            <button onClick={() => openEditorWithScript("Taekwondo Academy Ad", TEMPLATES.lines)} className="bg-lime-400 text-black p-4 rounded-full shadow-xl hover:scale-105 transition cursor-pointer">
              <ArrowUpRight className="w-6 h-6" />
            </button>
          </div>

          <button onClick={() => openEditorWithScript("New Script Video", TEMPLATES.lines)} className="w-full bg-gradient-to-r from-lime-400 via-emerald-300 to-cyan-300 text-black rounded-2xl py-5 px-4 flex items-center justify-center gap-2.5 font-black text-lg shadow-lg cursor-pointer">
            <span className="bg-black text-lime-400 p-1 rounded-full"><Plus className="w-4 h-4" /></span>
            अपनी स्क्रिप्ट लिखकर वीडियो बनाएं
          </button>

