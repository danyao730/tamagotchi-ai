"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Utensils, Gamepad2, Loader2, Ghost, Share2, Moon, Sun, Bath, Volume2, VolumeX, ChevronUp, ChevronDown, Trophy, FlaskConical, Pizza, Apple, CakeSlice, Heart, Info } from 'lucide-react';

type Mode = 'scan' | 'incubating' | 'tutorial' | 'life' | 'game-guess';
type ActionState = 'idle' | 'eating' | 'playing' | 'washing' | 'win' | 'lose' | null;

export default function UltimateTamagotchi() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [mode, setMode] = useState<Mode>('scan');
  const [aiBabyImg, setAiBabyImg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [stats, setStats] = useState({ hunger: 80, mood: 60, clean: 80, age: 0, level: 1, isSleeping: false });
  const [dnaData, setDnaData] = useState({ gender: 'Calculating...', trait: 'Detecting...' });
  const [gameData, setGameData] = useState({ currentNum: 5, nextNum: 0, round: 0, message: 'HIGHER OR LOWER?' });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [foodItem, setFoodItem] = useState<'pizza' | 'apple' | 'cake' | null>(null);

  // --- 音频初始化 ---
  const initAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const playSound = (freq: number, duration: number, type: OscillatorType = 'square') => {
    if (isMuted || !audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtxRef.current.destination);
    osc.start(); osc.stop(audioCtxRef.current.currentTime + duration);
  };

  // --- 模拟 Nano Banana DNA 生成 ---
  const handleStartScan = () => {
    initAudio();
    setMode('incubating');
    // 模拟根据人脸分析特征
    const traits = ['Lean', 'Sturdy', 'Athletic', 'Curvy'];
    const genders = ['MALE', 'FEMALE'];
    const randomTrait = traits[Math.floor(Math.random() * traits.length)];
    const randomGender = genders[Math.floor(Math.random() * genders.length)];
    
    setDnaData({ gender: randomGender, trait: randomTrait });

    setTimeout(() => {
      // 根据特征选择不同的 DiceBear 种子，模拟人脸识别效果
      const seed = `dna-${randomGender}-${randomTrait}-${Date.now()}`;
      setAiBabyImg(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=transparent`);
      setMode('tutorial');
    }, 3000);
  };

  // --- 喂食反馈 ---
  const handleFeed = (type: 'pizza' | 'apple' | 'cake') => {
    setFoodItem(type);
    setActionState('eating');
    playSound(500, 0.2, 'sine');
    setShowFoodMenu(false);
    
    setStats(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + (type === 'pizza' ? 25 : 10)),
      mood: Math.min(100, prev.mood + 5),
      clean: Math.max(0, prev.clean - 5)
    }));

    setFeedback(`Yummy! +${type === 'pizza' ? '25' : '10'} HNG`);
    setTimeout(() => { setActionState('idle'); setFoodItem(null); setFeedback(null); }, 2000);
  };

  // --- 游戏逻辑 ---
  const handleGuess = (guess: 'higher' | 'lower') => {
    const next = Math.floor(Math.random() * 9) + 1;
    const isWin = (guess === 'higher' && next >= gameData.currentNum) || (guess === 'lower' && next <= gameData.currentNum);
    
    setGameData(prev => ({ ...prev, nextNum: next, message: isWin ? 'CORRECT!' : 'WRONG!' }));
    playSound(isWin ? 800 : 200, 0.1);

    setTimeout(() => {
      if (isWin) {
        if (gameData.round >= 2) {
          setStats(s => ({ ...s, mood: Math.min(100, s.mood + 30) }));
          setFeedback("🏆 CHAMPION! MOOD +30");
          setMode('life');
          setTimeout(() => setFeedback(null), 2500);
        } else {
          setGameData(prev => ({ ...prev, currentNum: next, round: prev.round + 1, nextNum: 0, message: 'GO AGAIN!' }));
        }
      } else {
        setStats(s => ({ ...s, mood: Math.max(0, s.mood - 10) }));
        setFeedback("❌ LOST... MOOD -10");
        setMode('life');
        setTimeout(() => setFeedback(null), 2500);
      }
    }, 800);
  };

  // 成长视觉控制
  const getGrowthStage = () => {
    if (stats.age < 100) return 'INFANT';
    if (stats.age < 300) return 'CHILD';
    return 'ADULT';
  };
  const petScale = Math.min(1.6, 0.7 + (stats.age / 500));

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center font-mono bg-[#14141b] text-[#e2dbd4] p-4">
      <div className={`relative w-full max-w-[450px] aspect-[4/5] bg-[#1e1e2a] rounded-[50px] border-[10px] border-[#323246] shadow-2xl p-6 flex flex-col transition-all ${stats.isSleeping ? 'brightness-50' : ''}`}>
        
        {/* Status LCD */}
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 px-2">
          <div className="flex gap-4">
            <StatLCD label="HNG" value={stats.hunger} color="text-yellow-400" />
            <StatLCD label="HAP" value={stats.mood} color="text-orange-400" />
            <StatLCD label="CLN" value={stats.clean} color="text-cyan-400" />
          </div>
          <div className="text-[9px] font-black text-right">
            <div className="opacity-40">{getGrowthStage()}</div>
            <div className="text-cyan-400">LV.{stats.level} DAY.{Math.floor(stats.age/50)}</div>
          </div>
        </div>

        {/* Screen */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0a0f] rounded-2xl border-4 border-[#252533] flex flex-col items-center justify-center shadow-inner">
          
          {feedback && (
            <div className="absolute top-4 bg-cyan-500 text-black px-4 py-1 rounded-full text-[10px] font-black z-30 animate-in slide-in-from-top-4">
              {feedback}
            </div>
          )}

          {mode === 'scan' && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-full grayscale opacity-40" />
              </div>
              <button onClick={handleStartScan} className="px-10 py-4 bg-cyan-600 text-black font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">EXTRACT DNA</button>
            </div>
          )}

          {mode === 'incubating' && (
            <div className="text-center">
              <FlaskConical className="animate-bounce text-cyan-500 mx-auto mb-4" size={48} />
              <div className="text-[10px] tracking-widest animate-pulse uppercase">
                Extracting: {dnaData.gender}<br/>
                Trait: {dnaData.trait}
              </div>
            </div>
          )}

          {mode === 'tutorial' && (
            <div className="p-6 text-center animate-in zoom-in duration-300">
              <img src={aiBabyImg!} className="w-24 h-24 mx-auto pixelated mb-4" />
              <h2 className="text-cyan-400 font-black text-sm mb-2">DNA MATCH: {dnaData.trait} {dnaData.gender}</h2>
              <p className="text-[9px] opacity-60 leading-relaxed mb-6">We've generated a unique child-form based on your features. Take care of it to see it evolve!</p>
              <button onClick={() => setMode('life')} className="w-full py-3 bg-white/10 rounded-xl font-black text-xs hover:bg-cyan-500 hover:text-black transition-colors">START JOURNEY</button>
            </div>
          )}

          {mode === 'life' && (
            <div className="relative flex flex-col items-center">
              {foodItem && (
                <div className="absolute -top-16 animate-bounce transition-all duration-500">
                  {foodItem === 'pizza' && <Pizza className="text-yellow-500" size={40} />}
                  {foodItem === 'apple' && <Apple className="text-red-500" size={40} />}
                  {foodItem === 'cake' && <CakeSlice className="text-pink-500" size={40} />}
                </div>
              )}
              
              <div style={{ transform: `scale(${petScale})` }} className="transition-transform duration-1000">
                <img src={aiBabyImg!} className={`w-40 h-40 pixelated ${actionState === 'eating' ? 'animate-shake' : 'animate-bounce-slow'}`} />
              </div>
            </div>
          )}

          {mode === 'game-guess' && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in">
              <div className="text-5xl font-black text-white">{gameData.currentNum} <span className="text-xs opacity-20">VS</span> {gameData.nextNum || '?'}</div>
              <div className="flex gap-4">
                <button onClick={() => handleGuess('higher')} className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-cyan-500 active:scale-95 transition-all"><ChevronUp size={32}/></button>
                <button onClick={() => handleGuess('lower')} className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-orange-500 active:scale-95 transition-all"><ChevronDown size={32}/></button>
              </div>
              <div className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">Round {gameData.round + 1}/3</div>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="mt-6 flex flex-col gap-4">
          {mode === 'life' && (
            <div className={`grid grid-cols-3 gap-2 animate-in slide-in-from-bottom-2 ${showFoodMenu ? 'opacity-100' : 'hidden'}`}>
              <SubBtn icon={<Pizza size={14}/>} label="PIZZA" onClick={() => handleFeed('pizza')} />
              <SubBtn icon={<Apple size={14}/>} label="APPLE" onClick={() => handleFeed('apple')} />
              <SubBtn icon={<CakeSlice size={14}/>} label="CAKE" onClick={() => handleFeed('cake')} />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <PhysBtn icon={<Utensils />} label="FEED" onClick={() => setShowFoodMenu(!showFoodMenu)} active={mode === 'life'} />
            <PhysBtn icon={<Gamepad2 />} label="PLAY" onClick={() => { initAudio(); setMode('game-guess'); setGameData(d => ({ ...d, round: 0, nextNum: 0 })); }} active={mode === 'life'} />
            <PhysBtn icon={stats.isSleeping ? <Sun /> : <Moon />} label="SLEEP" onClick={() => setStats(s => ({ ...s, isSleeping: !s.isSleeping }))} active={mode === 'life'} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pixelated { image-rendering: pixelated; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-bounce-slow { animation: bounce-slow 2.8s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px) rotate(-5deg); } 75% { transform: translateX(6px) rotate(5deg); } }
        .animate-shake { animation: shake 0.1s linear infinite; }
      `}</style>
    </main>
  );
}

function StatLCD({ label, value, color }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-[7px] font-black opacity-30">{label}</span>
      <span className={`text-[11px] font-black ${color}`}>{value}%</span>
      <div className="w-10 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
        <div className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SubBtn({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-cyan-500 hover:text-black transition-all">
      {icon} <span className="text-[7px] font-black">{label}</span>
    </button>
  );
}

function PhysBtn({ icon, label, onClick, active }: any) {
  return (
    <button disabled={!active} onClick={onClick} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-3xl bg-[#323246] border-b-4 border-black/60 active:translate-y-1 active:border-b-0 transition-all ${!active ? 'opacity-20' : 'hover:bg-[#43435c]'}`}>
      {icon} <span className="text-[8px] font-black">{label}</span>
    </button>
  );
}