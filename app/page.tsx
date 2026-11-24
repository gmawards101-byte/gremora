"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Play, Pause, Trash2, Sparkles, Volume2, ArrowLeft, Crown, Wand2, Key } from "lucide-react";

type ThemeType = "sports" | "school" | "business" | "creator";
interface Clip { id: string; name: string; videoUrl: string; duration: number; headline: string; subline: string; }

const REAL_HD_VIDEOS: Record<ThemeType, string[]> = {
  sports: [
    "https://" + "assets.mixkit.co/videos/preview/mixkit-martial-arts-practitioner-practicing-kicks-40698-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-man-training-in-a-gym-23421-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-boxer-training-with-a-punching-bag-40687-large.mp4"
  ],
  school: [
    "https://" + "assets.mixkit.co/videos/preview/mixkit-children-raising-their-hands-in-a-classroom-4636-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-girl-writing-in-a-notebook-at-school-4631-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-teacher-helping-a-student-in-class-4634-large.mp4"
  ],
  business: [
    "https://" + "assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-laptop-4986-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4"
  ],
  creator: [
    "https://" + "assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1282-large.mp4",
    "https://" + "assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-at-sunset-4611-large.mp4"
  ]
};

const PRESETS: { id: ThemeType; title: string; sub: string; grad: string; lines: string[] }[] = [
  { id: "sports", title: "Sports & Martial Arts", sub: "Real Action Footage", grad: "from-amber-500 to-rose-700", lines: ["GREWAL TAEKWONDO ACADEMY | Charkhi Dadri • Haryana", "POWER • DISCIPLINE • SKILL | Dream for Olympics", "CZS PLAY SCHOOL | Loharu Road, Charkhi Dadri • 7027004041"] },
  { id: "school", title: "School & Coaching Ad", sub: "Real Classroom Footage", grad: "from-sky-500 to-indigo-700", lines: ["ADMISSIONS OPEN 2026-27! | Smart Learning & Care", "EXPERIENCED TEACHERS | Best Future for Your Child", "ENROLL TODAY | Call: 7027004041"] },
  { id: "business", title: "Shop & Business Ad", sub: "Real Commercial Footage", grad: "from-lime-500 to-emerald-700", lines: ["GRAND FESTIVAL SALE! | Flat 50% OFF Today", "BEST QUALITY & PRICE | Visit Our Showroom", "ORDER NOW | Contact: 7027004041"] },
  { id: "creator", title: "YouTube & Reels Studio", sub: "Real Cinematic Footage", grad: "from-purple-500 to-pink-700", lines: ["NEVER GIVE UP! | Your Success Story Starts Here", "DREAM BIG & WORK HARD | Create Viral Videos", "GREMORA AI STUDIO | Subscribe & Share"] },
];

export default function GremoraRealFootageStudio() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [activeTheme, setActiveTheme] = useState<ThemeType>("sports");
  const [pexelsKey, setPexelsKey] = useState("");
  const [scriptText, setScriptText] = useState(PRESETS[0].lines.join("\n"));
  const [clips, setClips] = useState<Clip[]>([]);
  const [curIdx, setCurIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const detectTheme = (raw: string): ThemeType => {
    const t = raw.toLowerCase();
    if (t.includes("taekwondo") || t.includes("gym") || t.includes("sport") || t.includes("fight") || t.includes("fitness")) return "sports";
    if (t.includes("school") || t.includes("coaching") || t.includes("admission") || t.includes("study") || t.includes("kids")) return "school";
    if (t.includes("sale") || t.includes("offer") || t.includes("shop") || t.includes("business") || t.includes("trophy")) return "business";
    return activeTheme;
  };

  const fetchPexelsVideo = async (query: string, fallback: string): Promise<string> => {
    if (!pexelsKey.trim()) return fallback;
    try {
      const res = await fetch(`https://pexels.com{encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
        headers: { Authorization: pexelsKey.trim() }
      });
      const data: any = await res.json();
      const files = data?.videos?.[0]?.video_files || [];
      const hd = files.find((f: any) => f.width >= 720) || files[0];
      return hd?.link || fallback;
    } catch {
      return fallback;
    }
  };

  const buildRealVideo = async (raw: string, forcedTheme?: ThemeType) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setLoading(true);
    setPlaying(false);
    setCurIdx(0);
    const chosen = forcedTheme || detectTheme(raw);
    setActiveTheme(chosen);
    const pool = REAL_HD_VIDEOS[chosen];

    const built: Clip[] = await Promise.all(
      lines.map(async (line, i) => {
        const parts = line.split("|");
        const headline = (parts[0] || line).trim().toUpperCase();
        const subline = (parts[1] || "GREMORA AI VIDEO STUDIO").trim();
        const vUrl = await fetchPexelsVideo(headline, pool[i % pool.length]);
        return { id: "real-" + Date.now() + "-" + i, name: `Scene ${i + 1}`, videoUrl: vUrl, duration: 4, headline, subline };
      })
    );

    setClips(built);
    setLoading(false);
    setTimeout(() => setPlaying(true), 200);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added: Clip[] = Array.from(e.target.files).map((f, i) => ({
      id: "up-" + Date.now() + "-" + i,
      name: f.name.slice(0, 14),
      videoUrl: URL.createObjectURL(f),
      duration: 5,
      headline: "YOUR BRAND TITLE",
      subline: "Charkhi Dadri • 7027004041"
    }));
    setClips((p) => [...p, ...added]);
  };

  useEffect(() => {
    const cur = clips[curIdx];
    if (!cur || screen !== "editor") return;
    if (videoRef.current) {
      videoRef.current.src = cur.videoUrl;
      if (playing) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
    if (playing && voiceOn && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cur.headline + ". " + cur.subline);
      u.lang = /[\u0900-\u097F]/.test(cur.headline) ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(u);
    }
    if (!playing) return;
    const timer = setTimeout(() => {
      if (curIdx + 1 < clips.length) setCurIdx(curIdx + 1);
      else { setPlaying(false); setCurIdx(0); }
    }, cur.duration * 1000);
    return () => clearTimeout(timer);
  }, [curIdx, playing, clips, voiceOn, screen]);

  const activeClip = clips[curIdx];

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-[#07080b] text-white p-4 font-sans">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-amber-600/20 via-zinc-900 to-emerald-800/30 border border-zinc-700 p-6 space-y-2">
            <div className="bg-lime-400 text-black w-8 h-8 rounded-xl flex items-center justify-center"><Crown className="w-5 h-5" /></div>
            <h1 className="text-3xl font-black">GREMORA Real HD Video Studio</h1>
            <p className="text-xs text-lime-300 font-bold">अब कोई कार्टून नहीं — स्क्रिप्ट डालें और असली कैमरे वाले HD वीडियो क्लिप्स के साथ प्रोमो बनाएं!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESETS.map((p) => (
              <div key={p.id} onClick={() => { setScriptText(p.lines.join("\n")); setScreen("editor"); buildRealVideo(p.lines.join("\n"), p.id); }} className={`bg-gradient-to-br ${p.grad} rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition shadow-lg`}>
                <h3 className="font-black text-lg">{p.title}</h3>
                <p className="text-xs text-white/90">{p.sub}</p>
                <span className="inline-block mt-3 text-[11px] font-black bg-black/40 px-3 py-1 rounded-full">▶ असली HD वीडियो बनाएं</span>
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
          <span className="font-black text-base text-lime-400">Real HD Footage Studio</span>
        </div>
        <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer ${voiceOn ? "bg-cyan-400 text-black" : "bg-zinc-800 text-zinc-400"}`}><Volume2 className="w-4 h-4" /> Voice: {voiceOn ? "ON" : "OFF"}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <label className="text-xs font-bold text-lime-400 flex items-center gap-1"><Wand2 className="w-4 h-4" /> स्क्रिप्ट लिखें (Headline | Subline)</label>
          <textarea rows={5} value={scriptText} onChange={(e) => setScriptText(e.target.value)} className="w-full bg-zinc-800 border border-lime-400/50 rounded-xl p-2.5 text-xs" />
          <div className="flex gap-1.5 flex-wrap">
            {(["sports", "school", "business", "creator"] as ThemeType[]).map((th) => (
              <button key={th} onClick={() => buildRealVideo(scriptText, th)} className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg cursor-pointer ${activeTheme === th ? "bg-lime-400 text-black" : "bg-zinc-800 text-zinc-400"}`}>{th}</button>
            ))}
          </div>
          <button onClick={() => buildRealVideo(scriptText)} className="w-full bg-gradient-to-r from-lime-400 to-emerald-400 text-black font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
            <Sparkles className="w-4 h-4" /> {loading ? "Loading Real HD Clips..." : "Generate & Play Real Video"}
          </button>
          <label className="block border border-zinc-700 p-2 rounded-xl text-center cursor-pointer text-[11px] font-bold text-cyan-400">
            <Plus className="inline w-3.5 h-3.5 mr-1" /> अपने फ़ोन/कंप्यूटर से असली Video डालें
            <input type="file" accept="video/*" multiple onChange={onUpload} className="hidden" />
          </label>
          <div className="pt-1 border-t border-zinc-800">
            <label className="text-[10px] text-zinc-400 flex items-center gap-1"><Key className="w-3 h-3" /> Free Pexels API Key (लाखों असली HD वीडियो के लिए)</label>
            <input type="password" value={pexelsKey} onChange={(e) => setPexelsKey(e.target.value)} placeholder="Optional Pexels API Key..." className="w-full bg-zinc-800 p-1.5 rounded-lg text-xs mt-1" />
          </div>
        </div>

        <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900">
            <video ref={videoRef} muted loop playsInline className="w-full h-full object-cover" />
            {activeClip && (
              <div className="absolute top-3 inset-x-0 bg-black/60 py-2 px-3 text-center">
                <div className="font-black text-lg md:text-2xl text-white tracking-wide">{activeClip.headline}</div>
                <div className="mx-auto my-1 h-1.5 w-40 flex"><span className="flex-1 bg-[#ff9933]" /><span className="flex-1 bg-white" /><span className="flex-1 bg-[#138808]" /></div>
                <div className="text-xs font-extrabold text-amber-300">{activeClip.subline}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setPlaying(!playing)} className="bg-lime-400 text-black p-2.5 rounded-full cursor-pointer">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
            <span className="text-xs font-mono">Scene {curIdx + 1} / {clips.length}</span>
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
          <div className="font-bold text-lime-400">Scene Text Editor</div>
          {activeClip && (<>
            <div><label className="text-zinc-400">Big Headline</label><input value={activeClip.headline} onChange={(e) => setClips((p) => p.map((x, idx) => idx === curIdx ? { ...x, headline: e.target.value } : x))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
            <div><label className="text-zinc-400">Subline Text</label><input value={activeClip.subline} onChange={(e) => setClips((p) => p.map((x, idx) => idx === curIdx ? { ...x, subline: e.target.value } : x))} className="w-full bg-zinc-800 p-2 rounded-xl mt-1" /></div>
          </>)}
        </div>
      </div>

      <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 flex gap-2 overflow-x-auto">
        {clips.map((c, i) => (
          <div key={c.id} onClick={() => { setCurIdx(i); setPlaying(false); }} className={`p-2.5 rounded-xl border min-w-[145px] flex justify-between items-center cursor-pointer ${curIdx === i ? "border-lime-400 bg-lime-950/30" : "border-zinc-700 bg-zinc-800"}`}>
            <span className="text-xs font-bold truncate">{i + 1}. {c.name}</span>
            {clips.length > 1 && <Trash2 onClick={(e) => { e.stopPropagation(); setClips((p) => p.filter((_, idx) => idx !== i)); }} className="w-3.5 h-3.5 text-red-400 shrink-0 ml-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
