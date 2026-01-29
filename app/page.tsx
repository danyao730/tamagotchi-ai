"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Utensils, Gamepad2, Loader2, Ghost, Share2, Moon, Sun, Bath, Volume2, VolumeX, Camera, ChevronUp, ChevronDown, Trophy } from 'lucide-react';

type Mode = 'scan' | 'incubating' | 'life' | 'game-guess';
type ActionState = 'idle' | 'eating' | 'playing' | 'washing' | 'win' | 'lose' | null;

export default function GlobalTamagotchi() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('scan');
  const [aiBabyImg, setAiBabyImg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [stats, setStats] = useState({ hunger: 80, mood: 60, clean: 80, age: 0, level: 1, isSleeping: false });
  const [isDead, setIsDead] = useState(false);
  const [gameData, setGameData] = useState({ currentNum: 5, nextNum: 0, score: 0, round: 0, message: 'HIGHER OR LOWER?' });

  // DNA Loading
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dna = params.get('dna');
    if (dna) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(dna))));
        setAiBabyImg(decoded.img);
        setStats(decoded.stats);
        setMode('life');
      } catch (e) { console.error("DNA Link Error"); }
    }
  }, []);

  // Camera Logic with Mobile Fixes
  useEffect(() => {
    if (mode === 'scan') {
      const constraints = { 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } } 
      };
      navigator.mediaDevices.getUserMedia(constraints)
        .then(s => { 
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(e => console.log("Play error", e));
          }
        })
        .catch(err => alert("Camera blocked. Please check permissions in browser settings."));
    }
  }, [mode]);

  // Stat Loop
  useEffect(() => {
    if (mode !== 'life' || isDead || stats.isSleeping) return;
    const timer = setInterval(() => {
      setStats(prev => {
        const h = Math.max(0, prev.hunger - 2);
        if (h <= 0) setIsDead(true);
        return { ...prev, hunger: h, mood: Math.max(0, prev.mood - 1), clean: Math.max(0, prev.clean - 1), age: prev.age + 1, level: Math.floor(prev.age / 50) + 1 };
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [mode, isDead, stats.isSleeping]);

  const handleShare = () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ img: aiBabyImg, stats: stats }))));
    const url = `${window.location.origin}${window.location.pathname}?dna=${data}`;
    navigator.clipboard.writeText(url);
    alert("🧬 DNA LINK COPIED!");
  };

  const handleGuess = (guess: 'higher' | 'lower') => {
    const next = Math.floor(Math.random() * 9) + 1;
    const isWin = (guess === 'higher' && next >= gameData.currentNum) || (guess === 'lower' && next <= gameData.currentNum);
    setGameData(prev => ({ ...prev, nextNum: next, message: isWin ? 'CORRECT!' : 'WRONG!' }));
    setTimeout(() => {
      if (isWin) {
        if (gameData.round >= 3) {
          setStats(s => ({ ...s, mood: Math.min(100, s.mood + 30) }));
          setMode('life'); setActionState('win');
          setTimeout(() => setActionState('idle'), 2000);
        } else {
          setGameData(prev => ({ ...prev, currentNum: next, round: prev.round + 1, nextNum: 0, message: 'KEEP GOING!' }));
        }
      } else {
        setStats(s => ({ ...s, mood: Math.max(0, s.mood - 10) }));
        setMode('life'); setActionState('lose');
        setTimeout(() => setActionState('idle'), 2000);
      }
    }, 1000);
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center font-mono bg-[#14141b] text-[#e2dbd4] p-2 md:p-6 overflow-hidden">
      {/* 掌机外壳 - 优化了在不同屏幕上的宽度 */}
      <div className={`relative w-full max-w-[500px] aspect-[3/4] md:aspect-[4/5] bg-[#1e1e2a] rounded-[50px] border-[12px] border-[#323246] shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-6 flex flex-col transition-all ${stats.isSleeping ? 'brightness-50' : ''}`}>
        
        {/* LCD 状态栏 */}
        <div className="flex justify-between items-end mb-4 px-2 border-b border-white/10 pb-3">
            <div className="flex gap-4">
                <StatLCD label="HNG" value={stats.hunger} color="text-yellow-400" />
                <StatLCD label="HAP" value={stats.mood} color="text-orange-400" />
                <StatLCD label="CLN" value={stats.clean} color="text-cyan-400" />
            </div>
            <div className="text-[10px] opacity-40 font-black">LV.{stats.level}</div>
        </div>

        {/* 核心显示屏幕 */}
        <div className="flex-1 flex relative overflow-hidden bg-[#0a0a0f] rounded-2xl border-4 border-[#252533] shadow-inner">
            {mode === 'scan' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-4">
                    <div className="w-40 h-40 rounded-full border-4 border-cyan-500/20 overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-70" />
                        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                    </div>
                    <button onClick={() => { setMode('incubating'); setTimeout(() => { setAiBabyImg(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${Date.now()}`); setMode('life'); }, 2500); }} className="px-10 py-4 bg-cyan-600 text-black text-sm font-black rounded-xl hover:bg-white active:scale-95 transition-all shadow-lg">START SCAN</button>
                </div>
            )}

            {mode === 'game-guess' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/10">
                    <div className="text-[10px] opacity-30 tracking-[0.5em] mb-4 uppercase">ROUND {gameData.round}/3</div>
                    <div className="text-6xl font-black mb-10 flex items-center gap-6">
                      <span className="text-white">{gameData.currentNum}</span>
                      <span className="text-xs opacity-20">VS</span>
                      <span className="text-cyan-400 animate-pulse">{gameData.nextNum || '?'}</span>
                    </div>
                    <div className="flex gap-6">
                        <button onClick={() => handleGuess('higher')} className="w-20 h-20 bg-[#2d2d3d] rounded-3xl hover:bg-cyan-500 flex items-center justify-center border-b-4 border-black/40 active:translate-y-1 active:border-b-0"><ChevronUp size={32}/></button>
                        <button onClick={() => handleGuess('lower')} className="w-20 h-20 bg-[#2d2d3d] rounded-3xl hover:bg-orange-500 flex items-center justify-center border-b-4 border-black/40 active:translate-y-1 active:border-b-0"><ChevronDown size={32}/></button>
                    </div>
                    <p className="mt-8 text-xs font-black tracking-widest text-cyan-400 animate-bounce">{gameData.message}</p>
                </div>
            )}

            {mode === 'life' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`relative ${actionState === 'eating' ? 'animate-shake' : 'animate-bounce-slow'}`}>
                        {isDead ? <Ghost size={100} className="text-red-900 opacity-60"/> : <img src={aiBabyImg!} className="w-48 h-48 pixelated" style={{ filter: stats.isSleeping ? 'brightness(0.3)' : stats.clean < 40 ? 'sepia(0.8)' : 'none' }} />}
                        {actionState === 'win' && <Trophy className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce" size={40}/>}
                        {stats.isSleeping && <span className="absolute -top-10 right-0 animate-pulse text-indigo-400 font-black text-3xl">Zzz</span>}
                    </div>
                </div>
            )}
            
            {mode === 'incubating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <Loader2 className="animate-spin text-cyan-500" size={60}/>
                    <p className="text-xs tracking-[0.8em] animate-pulse">DNA_SYNTHESIS</p>
                </div>
            )}
        </div>

        {/* 实体按钮区 */}
        <div className="grid grid-cols-4 gap-4 mt-8">
            <PhysBtn onClick={() => { setActionState('eating'); setStats(s=>({...s, hunger: 100})); setTimeout(()=>setActionState('idle'), 1500); }} icon={<Utensils size={24}/>} label="FEED" active={mode==='life'} />
            <PhysBtn onClick={() => { setMode('game-guess'); setGameData(g=>({...g, round:1, message:'HIGHER OR LOWER?'})); }} icon={<Gamepad2 size={24}/>} label="PLAY" active={mode==='life'} />
            <PhysBtn onClick={() => { setActionState('washing'); setStats(s=>({...s, clean: 100})); setTimeout(()=>setActionState('idle'), 1500); }} icon={<Bath size={24}/>} label="WASH" active={mode==='life'} />
            <PhysBtn onClick={() => setStats(s=>({...s, isSleeping: !s.isSleeping}))} icon={stats.isSleeping ? <Sun size={24}/> : <Moon size={24}/>} label="LIGHTS" active={mode==='life'} />
        </div>
        
        {mode === 'life' && (
            <button onClick={handleShare} className="mt-8 flex items-center justify-center gap-2 text-[10px] opacity-20 hover:opacity-100 transition-opacity uppercase tracking-[0.3em] font-black">
                <Share2 size={14}/> SYNC_DNA_LINK
            </button>
        )}
      </div>

      <style jsx global>{`
        .pixelated { image-rendering: pixelated; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.1s linear infinite; }
      `}</style>
    </main>
  );
}

function StatLCD({ label, value, color }: any) {
    return (
        <div className="flex flex-col items-start min-w-[50px]">
            <span className="text-[8px] font-black opacity-30 uppercase">{label}</span>
            <span className={`text-sm font-black ${color}`}>{value}%</span>
            <div className="w-full h-1 bg-white/5 mt-1 rounded-full overflow-hidden">
              <div className={`h-full bg-current ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function PhysBtn({ onClick, icon, label, active }: any) {
    return (
        <button 
            disabled={!active} 
            onClick={onClick} 
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] bg-[#323246] border-b-[6px] border-black/50 active:translate-y-1 active:border-b-0 transition-all ${!active ? 'opacity-10 grayscale' : 'hover:bg-[#43435c] hover:text-cyan-400 text-[#e2dbd4]'}`}
        >
            {icon} 
            <span className="text-[9px] font-black tracking-tighter">{label}</span>
        </button>
    );
}