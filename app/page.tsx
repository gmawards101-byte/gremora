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
  { id: "motivation", title: "Motivational Reel", sub: "Hindi & English", grad: "from-amber-500 via-orange-600 to-rose-600", lines: ["मेहनत इतनी खामोशी से करो कि सफलता शोर मचा दे!", "हर बड़ा बदलाव एक छोटे कदम से शुरू होता है!", "आज ही अपने सपनों पर काम शुरू करो!"] },
  { id: "story", title: "AI Fantasy Story", sub: "3D Cinema Style", grad: "from-indigo-600 via-purple-600 to-pink-500", lines: ["In a hidden kingdom beyond the clouds, a young hero found a glowing sword!", "Darkness was rising, but courage burned brighter!", "The greatest adventure had just begun!"] },
  { id: "business", title: "Business Promo Ad", sub: "Viral Marketing", grad: "from-lime-500 via-emerald-500 to-cyan-500", lines: ["क्या आप भी अपने बिज़नेस को तेज़ी से बढ़ाना चाहते हैं?", "अब बिना कैमरे के बनाएं शानदार विज्ञापन वीडियो!", "अभी आज़माएं GREMORA AI STUDIO!"] },
  { id: "facts", title: "Amazing Facts", sub: "YouTube Shorts", grad: "from-cyan-500 via-blue-600 to-indigo-700", lines: ["क्या आप जानते हैं अंतरिक्ष में आवाज़ सुनाई नहीं देती?", "वहाँ हवा न होने के कारण पूरी तरह सन्नाटा रहता है!", "ऐसे ही रोचक तथ्यों के लिए जुड़े रहें!"] },
];

export default function GremoraAutoScriptVideo() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [title, setTitle] = useState("Auto Script-to-Video");
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeClip = clips.find((c) => c.id === sel) || clips[0];
  const total = clips.reduce((a, b) => a + b.duration, 0);

  const autoBuildAndPlay = (rawScript: string, autoPlay = true) => {
    const lines = rawScript.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setPlaying(false);
    setTime(0);
    setExportUrl("");

    const built: Clip[] = lines.map((line, i) => {
      const id = "ai-" + Date.now() + "-" + i;
      const prompt = encodeURIComponent("cinematic digital art, vibrant dramatic lighting, 8k, " + line);
      const url = "https://" + "image.pollinations.ai/prompt/" + prompt + "?width=720&height=1280&nologo=true&seed=" + (500 + i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      imgCache.current[id] = img;
      return { id, name: `Scene ${i + 1}`, imgUrl: url, duration: 4, text: line };
    });

    setClips(built);
    if (built[0]) setSel(built[0].id);
    if (autoPlay) setTimeout(() => setPlaying(true), 250);
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

  const drawFrame = (t: number, speak = false) => {
    const c = canvasRef.current;
    if (!c || !clips.length) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

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
      g.addColorStop(0, "#0f172a");
      g.addColorStop(0.5, "#1e1b4b");
      g.addColorStop(1, "#064e3b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);

      for (let i = 0; i < 14; i++) {
        const x = ((i * 103 + t * 55) % (c.width + 80)) - 40;
        const y = ((i * 149 + Math.sin(t * 2 + i) * 70 + t * 40) % (c.height + 80)) - 40;
        ctx.beginPath();
        ctx.arc(x, y, 16 + (i % 4) * 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(163, 230, 53, 0.22)";
        ctx.fill();
      }
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
          <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-emerald-950 to-zinc-900 border border-zinc-800 p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-5 h-5" /></div>
              <h1 className="text-3xl font-black leading-tight">Auto Script<br />to Video</h1>
              <p className="text-xs text-lime-300 font-bold">बस स्क्रिप्ट लिखो — AI खुद इमेज और आवाज़ के साथ वीडियो बनाएगा!</p>
            </div>
            <button onClick={() => openEditorWithScript("New Script Video", TEMPLATES[0].lines)} className="bg-lime-400 text-black p-4 rounded-full shadow-xl hover:scale-105 transition cursor-pointer">
              <ArrowUpRight className="w-6 h-6" />
            </button>
          </div>

          <button onClick={() => openEditorWithScript("New Script Video", [""])} className="w-full bg-gradient-to-r from-lime-400 via-emerald-300 to-cyan-300 text-black rounded-2xl py-5 px-4 flex items-center justify-center gap-2.5 font-black text-lg shadow-lg cursor-pointer">
            <span className="bg-black text-lime-400 p-1 rounded-full"><Plus className="w-4 h-4" /></span>
            अपनी स्क्रिप्ट लिखकर वीडियो बनाएं
          </button>

          <div className="space-y-2.5">
            <h2 className="font-black text-base flex items-center gap-1.5"><Flame className="w-4 h-4 text-lime-400" /> Instant AI Script Templates (क्लिक करते ही वीडियो बनेगा)</h2>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((tpl) => (
                <div key={tpl.id} onClick={() => openEditorWithScript(tpl.title, tpl.lines)} className={`bg-gradient-to-br ${tpl.grad} rounded-2xl p-4 h-28 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition shadow-lg`}>
                  <div>
                    <h3 className="font-black text-base text-white">{tpl.title}</h3>
                    <p className="text-[11px] text-white/85 font-semibold">{tpl.sub}</p>
                  </div>
