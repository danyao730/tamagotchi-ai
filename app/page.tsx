"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Dna, Utensils, Gamepad2, Loader2, Ghost, Share2, Moon, Sun, Bath, Volume2, VolumeX, Camera, Power, Sparkles, ChevronUp, ChevronDown, Trophy } from 'lucide-react';

type Mode = 'scan' | 'incubating' | 'life' | 'game-guess';
type ActionState = 'idle' | 'eating' | 'playing' | 'washing' | 'win' | 'lose' | null;

export default function GamingTamagotchi() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('scan');
  const [aiBabyImg, setAiBabyImg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // --- Pet Stats ---
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [stats, setStats] = useState({ hunger: 80, mood: 60, clean: 80, age: 0, level: 1, isSleeping: false });
  const [isDead, setIsDead] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // --- Mini-Game State (Higher or Lower) ---
  const [gameData, setGameData] = useState({ currentNum: 5, nextNum: 0, score: 0, round: 0, message: 'HIGHER OR LOWER?' });

  // --- Sound Engine ---
  const playNote = (freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.1) => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  };

  const playEffect = (type: 'win' | 'lose' | 'click' | 'start') => {
    if (type === 'win') [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playNote(f, 0.15, 'triangle'), i * 100));
    if (type === 'lose') [440, 330, 220].forEach((f, i) => setTimeout(() => playNote(f, 0.2, 'sawtooth'), i * 150));
    if (type === 'click') playNote(880, 0.05, 'square', 0.05);
  };

  // --- Life Cycle ---
  useEffect(() => {
    if (mode === 'scan') {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if (videoRef.current) videoRef.current.srcObject = s; });
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'life' || isDead || stats.isSleeping) return;
    const timer = setInterval(() => {
      setStats(prev => {
        const h = Math.max(0, prev.hunger - 2);
        if (h <= 0) { playEffect('lose'); setIsDead(true); }
        return { ...prev, hunger: h, mood: Math.max(0, prev.mood - 1), clean: Math.max(0, prev.clean - 1), age: prev.age + 1, level: Math.floor(prev.age / 50) + 1 };
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [mode, isDead, stats.isSleeping]);

  // --- Game Logic ---
  const startMiniGame = () => {
    if (stats.isSleeping || isDead) return;
    playEffect('click');
    setGameData({ currentNum: Math.floor(Math.random() * 9) + 1, nextNum: 0, score: 0, round: 1, message: 'GUESS NEXT NUM!' });
    setMode('game-guess');
  };

  const handleGuess = (guess: 'higher' | 'lower') => {
    const next = Math.floor(Math.random() * 9) + 1;
    const isWin = (guess === 'higher' && next >= gameData.currentNum) || (guess === 'lower' && next <= gameData.currentNum);
    
    setGameData(prev => ({ ...prev, nextNum: next, message: isWin ? 'CORRECT!' : 'WRONG!' }));
    
    if (isWin) {
      playEffect('win');
      setGameData(prev => ({ ...prev, score: prev.score + 1 }));
      if (gameData.round >= 3) { // End of 3 rounds
        setTimeout(() => {
          setStats(s => ({ ...s, mood: Math.min(100, s.mood + 30) }));
          setMode('life');
          setActionState('win');
          setTimeout(() => setActionState('idle'), 2000);
        }, 1500);
      } else {
        setTimeout(() => setGameData(prev => ({ ...prev, currentNum: next, round: prev.round + 1, nextNum: 0, message: 'NEXT ROUND!' })), 1500);
      }
    } else {
      playEffect('lose');
      setTimeout(() => {
        setStats(s => ({ ...s, mood: Math.max(0, s.mood - 10) }));
        setMode('life');
        setActionState('lose');
        setTimeout(() => setActionState('idle'), 2000);
      }, 1500);
    }
  };

  // --- Actions ---
  const triggerFeed = () => {
    playEffect('click');
    setActionState('eating');
    setStats(s => ({ ...s, hunger: Math.min(100, s.hunger + 30) }));
    setTimeout(() => setActionState('idle'), 2000);
  };

  const triggerClean = () => {
    playEffect('click');
    setActionState('washing');
    setStats(s => ({ ...s, clean: 100 }));
    setTimeout(() => setActionState('idle'), 2000);
  };

  return (
    <main className={`h-screen w-full flex flex-col items-center justify-center font-mono bg-[#23232e] text-[#e2dbd4] p-6`}>
      
      {/* Handheld Device Screen */}
      <div className={`relative w-full max-w-2xl aspect-[4/3] bg-[#14141b] rounded-[40px] border-[12px] border-[#323246] shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-8 flex flex-col ${stats.isSleeping ? 'brightness-50' : ''} transition-all`}>
        
        {/* Top Status LCD */}
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <div className="flex gap-4">
                <StatLCD label="HNG" value={stats.hunger} color="text-yellow-500" />
                <StatLCD label="HAP" value={stats.mood} color="text-orange-500" />
                <StatLCD label="CLN" value={stats.clean} color="text-cyan-500" />
            </div>
            <div className="text-[10px] bg-white/5 px-3 py-1 rounded tracking-tighter">LVL_{stats.level} | DAY_{Math.floor(stats.age/10)}</div>
        </div>

        {/* Main Display Area */}
        <div className="flex-1 flex relative overflow-hidden bg-[#0d0d12] rounded-xl border-2 border-white/5">
            
            {/* 1. Scanner Mode */}
            {mode === 'scan' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="w-40 h-40 border-2 border-dashed border-cyan-500/50 rounded-full flex items-center justify-center relative overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-40" />
                        <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
                    </div>
                    <button onClick={() => { playEffect('click'); setMode('incubating'); setTimeout(() => { setAiBabyImg(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${Date.now()}`); setMode('life'); playEffect('win'); }, 3000); }} className="px-8 py-3 bg-cyan-600 text-black font-black text-xs hover:bg-white transition-all">EXTRACT_DNA</button>
                </div>
            )}

            {/* 2. Mini-Game Mode */}
            {mode === 'game-guess' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/20 animate-in zoom-in-95">
                    <div className="text-[10px] mb-8 tracking-[0.4em] opacity-50 uppercase">Stage: {gameData.round}/3</div>
                    <div className="flex items-center gap-12 mb-10">
                        <div className="text-7xl font-black text-white shadow-2xl">{gameData.currentNum}</div>
                        <div className="text-2xl opacity-30 tracking-tighter">VS</div>
                        <div className="text-7xl font-black text-cyan-400 animate-pulse">{gameData.nextNum || '?'}</div>
                    </div>
                    <div className="flex gap-6">
                        <button onClick={() => handleGuess('higher')} className="w-20 h-20 bg-white/10 hover:bg-cyan-500 hover:text-black flex flex-col items-center justify-center rounded-2xl transition-all">
                            <ChevronUp size={32} />
                            <span className="text-[8px] font-bold mt-1">HIGHER</span>
                        </button>
                        <button onClick={() => handleGuess('lower')} className="w-20 h-20 bg-white/10 hover:bg-orange-500 hover:text-black flex flex-col items-center justify-center rounded-2xl transition-all">
                            <ChevronDown size={32} />
                            <span className="text-[8px] font-bold mt-1">LOWER</span>
                        </button>
                    </div>
                    <div className="mt-8 text-xs font-bold tracking-widest text-cyan-500">{gameData.message}</div>
                </div>
            )}

            {/* 3. Life Mode */}
            {mode === 'life' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`relative transition-all duration-500 ${actionState === 'playing' ? 'animate-jump' : actionState === 'eating' ? 'animate-shake' : 'animate-bounce-slow'}`}>
                        {isDead ? <Ghost size={100} className="text-red-500 opacity-40" /> : (
                            <img src={aiBabyImg!} className={`w-40 h-40 pixelated ${stats.isSleeping ? 'opacity-20' : ''}`} style={{ filter: stats.clean < 40 ? 'sepia(1) brightness(0.5)' : 'none' }} />
                        )}
                        {actionState === 'win' && <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce" />}
                        {stats.isSleeping && <div className="absolute -top-10 right-0 text-2xl animate-pulse text-indigo-400 font-black">Zzz</div>}
                    </div>
                </div>
            )}
        </div>

        {/* Physical Buttons Area */}
        <div className="grid grid-cols-4 gap-4 mt-8">
            <PhysBtn onClick={triggerFeed} icon={<Utensils size={18}/>} label="FEED" active={mode==='life'} />
            <PhysBtn onClick={startMiniGame} icon={<Gamepad2 size={18}/>} label="PLAY" active={mode==='life'} />
            <PhysBtn onClick={triggerClean} icon={<Bath size={18}/>} label="WASH" active={mode==='life'} />
            <PhysBtn onClick={() => setStats(s => ({...s, isSleeping: !s.isSleeping}))} icon={stats.isSleeping ? <Sun size={18}/> : <Moon size={18}/>} label="SLEEP" active={mode==='life'} />
        </div>
      </div>

      <style jsx global>{`
        .pixelated { image-rendering: pixelated; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        @keyframes jump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-40px) scale(1.1); } }
        .animate-jump { animation: jump 0.5s ease-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-5deg); } 75% { transform: translateX(5px) rotate(5deg); } }
        .animate-shake { animation: shake 0.2s linear infinite; }
      `}</style>
    </main>
  );
}

// --- Sub Components ---

function StatLCD({ label, value, color }: any) {
    return (
        <div className="flex flex-col">
            <span className="text-[7px] font-black opacity-30">{label}</span>
            <div className={`text-xs font-bold ${color}`}>{value}%</div>
            <div className="w-10 h-[2px] bg-white/5 mt-1 overflow-hidden">
                <div className={`h-full bg-current transition-all`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function PhysBtn({ onClick, icon, label, active }: any) {
    return (
        <button 
            disabled={!active}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-b-4 border-black/40 bg-[#3b3b4f] transition-all active:translate-y-1 active:border-b-0 ${!active ? 'opacity-20 grayscale' : 'hover:bg-[#4a4a62] hover:text-cyan-400'}`}
        >
            <div className="p-2">{icon}</div>
            <span className="text-[8px] font-black tracking-widest">{label}</span>
        </button>
    );
}