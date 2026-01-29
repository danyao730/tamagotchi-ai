"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Dna, Utensils, Gamepad2, Loader2, Ghost, Share2, Moon, Sun, Bath, Volume2, VolumeX, Camera, Power, Sparkles, ChevronUp, ChevronDown, Trophy } from 'lucide-react';

type Mode = 'scan' | 'incubating' | 'life' | 'game-guess';
type ActionState = 'idle' | 'eating' | 'playing' | 'washing' | 'win' | 'lose' | null;

export default function UltimateTamagotchiV3() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('scan');
  const [aiBabyImg, setAiBabyImg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // --- Pet Stats ---
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [stats, setStats] = useState({ hunger: 80, mood: 60, clean: 80, age: 0, level: 1, isSleeping: false });
  const [isDead, setIsDead] = useState(false);
  const [gameData, setGameData] = useState({ currentNum: 5, nextNum: 0, score: 0, round: 0, message: 'HIGHER OR LOWER?' });

  // --- DNA Sharing & Loading ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dna = params.get('dna');
    if (dna) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(dna))));
        setAiBabyImg(decoded.img);
        setStats(decoded.stats);
        setMode('life');
      } catch (e) {
        console.error("Invalid DNA Link");
      }
    }
  }, []);

  const handleShare = () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({
      img: aiBabyImg,
      stats: stats
    }))));
    const url = `${window.location.origin}${window.location.pathname}?dna=${data}`;
    navigator.clipboard.writeText(url);
    alert("🧬 GENETIC DATA COPIED!\nShare this link with friends!");
  };

  // --- 8-bit Sound Engine ---
  const playNote = (freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.1) => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  };

  // --- Mobile Camera Fix ---
  useEffect(() => {
    if (mode === 'scan') {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } // Optimized for mobile selfies
      })
      .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(err => {
        console.error("Camera error:", err);
        // Fallback for browsers that block camera
      });
    }
  }, [mode]);

  // --- Game Loop ---
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

  // --- Mini Game Logic ---
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
          setGameData(prev => ({ ...prev, currentNum: next, round: prev.round + 1, nextNum: 0, message: 'NEXT!' }));
        }
      } else {
        setStats(s => ({ ...s, mood: Math.max(0, s.mood - 10) }));
        setMode('life'); setActionState('lose');
        setTimeout(() => setActionState('idle'), 2000);
      }
    }, 1000);
  };

  return (
    <main className="h-screen w-full flex flex-col items-center justify-center font-mono bg-[#1a1a24] text-[#e2dbd4] p-4 overflow-hidden">
      <div className={`relative w-full max-w-lg aspect-[3/4] sm:aspect-[4/3] bg-[#0d0d12] rounded-[40px] border-[10px] border-[#323246] shadow-2xl p-6 flex flex-col transition-all ${stats.isSleeping ? 'brightness-50' : ''}`}>
        
        {/* LCD Header */}
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <div className="flex gap-3">
                <StatLCD label="HNG" value={stats.hunger} color="text-yellow-500" />
                <StatLCD label="HAP" value={stats.mood} color="text-orange-500" />
                <StatLCD label="CLN" value={stats.clean} color="text-cyan-500" />
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="opacity-40 hover:opacity-100">{isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>
        </div>

        {/* Interaction Screen */}
        <div className="flex-1 flex relative overflow-hidden bg-black/40 rounded-xl border-2 border-white/5 shadow-inner">
            {mode === 'scan' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-4">
                    <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 overflow-hidden relative">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
                        <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-cyan-500/60 mb-4 tracking-widest uppercase">Biological Scanner Ready</p>
                        <button onClick={() => { setMode('incubating'); setTimeout(() => { setAiBabyImg(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${Date.now()}`); setMode('life'); }, 2000); }} className="px-8 py-3 bg-cyan-600 text-black text-xs font-black rounded-full hover:bg-white transition-all shadow-lg shadow-cyan-500/20">EXTRACT DNA</button>
                    </div>
                </div>
            )}

            {mode === 'game-guess' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/10 animate-in zoom-in-95">
                    <div className="text-[8px] opacity-30 tracking-[0.3em] mb-4 uppercase">Round {gameData.round}/3</div>
                    <div className="text-5xl font-black mb-8">{gameData.currentNum} <span className="text-xs opacity-20">VS</span> {gameData.nextNum || '?'}</div>
                    <div className="flex gap-4">
                        <button onClick={() => handleGuess('higher')} className="w-16 h-16 bg-white/5 rounded-2xl hover:bg-cyan-500 flex items-center justify-center border border-white/10"><ChevronUp /></button>
                        <button onClick={() => handleGuess('lower')} className="w-16 h-16 bg-white/5 rounded-2xl hover:bg-orange-500 flex items-center justify-center border border-white/10"><ChevronDown /></button>
                    </div>
                    <p className="mt-6 text-[10px] font-bold tracking-widest text-cyan-400">{gameData.message}</p>
                </div>
            )}

            {mode === 'life' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`relative ${actionState === 'eating' ? 'animate-shake' : actionState === 'playing' ? 'animate-bounce' : 'animate-bounce-slow'}`}>
                        {isDead ? <Ghost size={80} className="text-red-900 opacity-50"/> : <img src={aiBabyImg!} className="w-40 h-40 pixelated" style={{ filter: stats.isSleeping ? 'brightness(0.3)' : stats.clean < 40 ? 'sepia(0.8)' : 'none' }} />}
                        {actionState === 'win' && <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce" />}
                        {stats.isSleeping && <span className="absolute -top-6 right-0 animate-pulse text-indigo-400 font-bold text-xl">Zzz</span>}
                    </div>
                </div>
            )}
            
            {mode === 'incubating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-cyan-500" size={48}/>
                    <p className="text-[10px] tracking-[0.5em] animate-pulse">SYNTHESIZING...</p>
                </div>
            )}
        </div>

        {/* Physical Controls */}
        <div className="grid grid-cols-4 gap-3 mt-6">
            <PhysBtn onClick={() => { setActionState('eating'); setStats(s=>({...s, hunger: 100})); setTimeout(()=>setActionState('idle'), 1500); playNote(200, 0.1, 'sawtooth'); }} icon={<Utensils size={18}/>} label="FEED" active={mode==='life'} />
            <PhysBtn onClick={() => { setMode('game-guess'); setGameData(g=>({...g, round:1, message:'GUESS!'})); }} icon={<Gamepad2 size={18}/>} label="PLAY" active={mode==='life'} />
            <PhysBtn onClick={() => { setActionState('washing'); setStats(s=>({...s, clean: 100})); setTimeout(()=>setActionState('idle'), 1500); playNote(400, 0.5, 'sine'); }} icon={<Bath size={18}/>} label="WASH" active={mode==='life'} />
            <PhysBtn onClick={() => setStats(s=>({...s, isSleeping: !s.isSleeping}))} icon={stats.isSleeping ? <Sun size={18}/> : <Moon size={18}/>} label="LIGHTS" active={mode==='life'} />
        </div>
        
        {mode === 'life' && (
            <button onClick={handleShare} className="mt-6 flex items-center justify-center gap-2 text-[9px] opacity-30 hover:opacity-100 transition-opacity uppercase tracking-[0.2em] border-t border-white/5 pt-4">
                <Share2 size={12}/> Sync DNA Share Link
            </button>
        )}
      </div>

      <style jsx global>{`
        .pixelated { image-rendering: pixelated; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-5deg); } 75% { transform: translateX(5px) rotate(5deg); } }
        .animate-shake { animation: shake 0.15s linear infinite; }
      `}</style>
    </main>
  );
}

function StatLCD({ label, value, color }: any) {
    return (
        <div className="flex flex-col">
            <span className="text-[7px] font-black opacity-30 uppercase tracking-tighter">{label}</span>
            <span className={`text-[11px] font-bold ${color}`}>{value}%</span>
        </div>
    );
}

function PhysBtn({ onClick, icon, label, active }: any) {
    return (
        <button 
            disabled={!active} 
            onClick={onClick} 
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-[#3b3b4f] border-b-4 border-black/40 active:translate-y-1 active:border-b-0 transition-all ${!active ? 'opacity-20' : 'hover:bg-[#4e4e6a] hover:text-cyan-400'}`}
        >
            {icon} <span className="text-[7px] font-black mt-1 uppercase tracking-tighter">{label}</span>
        </button>
    );
}