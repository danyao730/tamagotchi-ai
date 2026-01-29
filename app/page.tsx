"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Utensils, Gamepad2, Loader2, Ghost, Share2, Moon, Sun, Bath, Volume2, VolumeX, Camera, ChevronUp, ChevronDown, Trophy } from 'lucide-react';

type Mode = 'scan' | 'incubating' | 'life' | 'game-guess';
type ActionState = 'idle' | 'eating' | 'playing' | 'washing' | 'win' | 'lose' | null;

export default function SonicTamagotchi() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null); // 持久化音频上下文
  const [mode, setMode] = useState<Mode>('scan');
  const [aiBabyImg, setAiBabyImg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [stats, setStats] = useState({ hunger: 80, mood: 60, clean: 80, age: 0, level: 1, isSleeping: false });
  const [isDead, setIsDead] = useState(false);
  const [gameData, setGameData] = useState({ currentNum: 5, nextNum: 0, score: 0, round: 0, message: 'HIGHER OR LOWER?' });

  // --- 8-bit Sound Engine (Fixed for Mobile) ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playNote = (freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.1) => {
    if (isMuted || !audioCtxRef.current) return;
    initAudio(); // 确保每次播放都在活跃状态
    
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration);
  };

  const soundWin = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playNote(f, 0.2, 'triangle'), i * 100)); };
  const soundLose = () => { [440, 349, 261].forEach((f, i) => setTimeout(() => playNote(f, 0.3, 'sawtooth'), i * 150)); };
  const soundClick = () => { playNote(880, 0.05, 'square', 0.05); };

  // --- DNA & Logic ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dna = params.get('dna');
    if (dna) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(dna))));
        setAiBabyImg(decoded.img);
        setStats(decoded.stats);
        setMode('life');
      } catch (e) { console.log("DNA DNA Error"); }
    }
  }, []);

  useEffect(() => {
    if (mode === 'scan') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => { if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); } })
        .catch(() => {});
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'life' || isDead || stats.isSleeping) return;
    const timer = setInterval(() => {
      setStats(prev => {
        const h = Math.max(0, prev.hunger - 2);
        if (h <= 0) { setIsDead(true); soundLose(); }
        return { ...prev, hunger: h, mood: Math.max(0, prev.mood - 1), clean: Math.max(0, prev.clean - 1), age: prev.age + 1, level: Math.floor(prev.age / 50) + 1 };
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [mode, isDead, stats.isSleeping]);

  // --- Handlers ---
  const handleStart = () => {
    initAudio(); 
    soundWin();
    setMode('incubating');
    setTimeout(() => {
      setAiBabyImg(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${Date.now()}`);
      setMode('life');
    }, 2500);
  };

  const handleGuess = (guess: 'higher' | 'lower') => {
    soundClick();
    const next = Math.floor(Math.random() * 9) + 1;
    const isWin = (guess === 'higher' && next >= gameData.currentNum) || (guess === 'lower' && next <= gameData.currentNum);
    setGameData(prev => ({ ...prev, nextNum: next, message: isWin ? 'CORRECT!' : 'WRONG!' }));
    
    setTimeout(() => {
      if (isWin) {
        playNote(880, 0.1, 'square');
        if (gameData.round >= 3) {
          soundWin();
          setStats(s => ({ ...s, mood: Math.min(100, s.mood + 30) }));
          setMode('life'); setActionState('win');
          setTimeout(() => setActionState('idle'), 2000);
        } else {
          setGameData(prev => ({ ...prev, currentNum: next, round: prev.round + 1, nextNum: 0, message: 'KEEP GOING!' }));
        }
      } else {
        soundLose();
        setStats(s => ({ ...s, mood: Math.max(0, s.mood - 10) }));
        setMode('life'); setActionState('lose');
        setTimeout(() => setActionState('idle'), 2000);
      }
    }, 800);
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center font-mono bg-[#14141b] text-[#e2dbd4] p-4 overflow-hidden">
      <div className={`relative w-full max-w-[480px] aspect-[4/5] bg-[#1e1e2a] rounded-[50px] border-[10px] border-[#323246] shadow-2xl p-6 flex flex-col transition-all ${stats.isSleeping ? 'brightness-50' : ''}`}>
        
        {/* LCD Header */}
        <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-3 px-2">
            <div className="flex gap-4">
                <StatLCD label="HNG" value={stats.hunger} color="text-yellow-400" />
                <StatLCD label="HAP" value={stats.mood} color="text-orange-400" />
                <StatLCD label="CLN" value={stats.clean} color="text-cyan-400" />
            </div>
            <button onClick={() => { initAudio(); setIsMuted(!isMuted); }} className="opacity-40">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
            </button>
        </div>

        {/* Screen */}
        <div className="flex-1 flex relative overflow-hidden bg-[#0a0a0f] rounded-2xl border-4 border-[#252533]">
            {mode === 'scan' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="w-32 h-32 rounded-full border-4 border-cyan-500/20 overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-70" />
                    </div>
                    <button onClick={handleStart} className="px-10 py-4 bg-cyan-600 text-black text-sm font-black rounded-xl shadow-lg active:scale-95 transition-all">EXTRACT DNA</button>
                </div>
            )}

            {mode === 'game-guess' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/10">
                    <div className="text-[10px] opacity-30 mb-2 uppercase">ROUND {gameData.round}/3</div>
                    <div className="text-6xl font-black mb-8 flex items-center gap-4">
                      <span>{gameData.currentNum}</span>
                      <span className="text-xs opacity-20">VS</span>
                      <span className="text-cyan-400">{gameData.nextNum || '?'}</span>
                    </div>
                    <div className="flex gap-6">
                        <button onClick={() => handleGuess('higher')} className="w-16 h-16 bg-[#2d2d3d] rounded-2xl flex items-center justify-center border-b-4 border-black/40"><ChevronUp size={32}/></button>
                        <button onClick={() => handleGuess('lower')} className="w-16 h-16 bg-[#2d2d3d] rounded-2xl flex items-center justify-center border-b-4 border-black/40"><ChevronDown size={32}/></button>
                    </div>
                </div>
            )}

            {mode === 'life' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`relative ${actionState === 'eating' ? 'animate-shake' : 'animate-bounce-slow'}`}>
                        {isDead ? <Ghost size={80} className="text-red-900 opacity-60"/> : <img src={aiBabyImg!} className="w-40 h-40 pixelated" />}
                        {actionState === 'win' && <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce" size={40}/>}
                    </div>
                </div>
            )}
            
            {mode === 'incubating' && <div className="absolute inset-0 flex items-center justify-center animate-pulse">SYNTHESIZING...</div>}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-3 mt-6">
            <PhysBtn onClick={() => { initAudio(); soundClick(); setActionState('eating'); setStats(s=>({...s, hunger: 100})); setTimeout(()=>setActionState('idle'), 1000); }} icon={<Utensils size={20}/>} label="FEED" active={mode==='life'} />
            <PhysBtn onClick={() => { initAudio(); soundClick(); setMode('game-guess'); setGameData(g=>({...g, round:1})); }} icon={<Gamepad2 size={20}/>} label="PLAY" active={mode==='life'} />
            <PhysBtn onClick={() => { initAudio(); soundClick(); setActionState('washing'); setStats(s=>({...s, clean: 100})); setTimeout(()=>setActionState('idle'), 1000); }} icon={<Bath size={20}/>} label="WASH" active={mode==='life'} />
            <PhysBtn onClick={() => { initAudio(); soundClick(); setStats(s=>({...s, isSleeping: !s.isSleeping})); }} icon={stats.isSleeping ? <Sun size={20}/> : <Moon size={20}/>} label="LIGHTS" active={mode==='life'} />
        </div>
        
        {mode === 'life' && (
            <button onClick={() => { initAudio(); handleShare(); }} className="mt-6 flex items-center justify-center gap-2 text-[9px] opacity-20 hover:opacity-100 transition-opacity uppercase font-black">
                <Share2 size={12}/> COPY DNA LINK
            </button>
        )}
      </div>

      <style jsx global>{`
        .pixelated { image-rendering: pixelated; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.1s linear infinite; }
      `}</style>
    </main>
  );
}

function StatLCD({ label, value, color }: any) {
    return (
        <div className="flex flex-col items-start min-w-[45px]">
            <span className="text-[7px] font-black opacity-30">{label}</span>
            <span className={`text-[12px] font-black ${color}`}>{value}%</span>
        </div>
    );
}

function PhysBtn({ onClick, icon, label, active }: any) {
    return (
        <button disabled={!active} onClick={onClick} className={`flex flex-col items-center justify-center gap-1 py-3 rounded-[20px] bg-[#323246] border-b-4 border-black/50 active:translate-y-1 active:border-b-0 transition-all ${!active ? 'opacity-10' : 'hover:bg-[#43435c]'}`}>
            {icon} <span className="text-[8px] font-black">{label}</span>
        </button>
    );
}