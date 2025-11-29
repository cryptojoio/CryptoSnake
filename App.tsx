import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Point, Direction, ScoreRecord, CoinType } from './types';
import { GRID_SIZE, INITIAL_SPEED, SPEED_INCREMENT, MIN_SPEED, COINS, BTC_ICON } from './constants';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Save, RotateCcw, Trophy, Home, ListOrdered, Pause, Play } from 'lucide-react';

// --- Audio System ---
const audioContextRef = { current: null as AudioContext | null };

const playSound = (type: 'eat' | 'die' | 'click', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'eat') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'die') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

// --- Helper Components ---

const DPad = ({ onDirection, onPause, isPaused }: { onDirection: (d: Direction) => void, onPause: () => void, isPaused: boolean }) => {
  const handlePress = (d: Direction) => {
    if (!isPaused) {
      onDirection(d);
    }
  };

  return (
    <div className="relative w-40 h-40 mx-auto mt-6 select-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-14 bg-stone-800 rounded-t-lg active:bg-stone-700 active:scale-95 transition-transform pixel-shadow flex items-center justify-center cursor-pointer tap-highlight-transparent"
           onClick={() => handlePress('UP')}>
           <ArrowUp className="text-stone-500" size={24} />
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-14 bg-stone-800 rounded-b-lg active:bg-stone-700 active:scale-95 transition-transform pixel-shadow flex items-center justify-center cursor-pointer tap-highlight-transparent"
           onClick={() => handlePress('DOWN')}>
           <ArrowDown className="text-stone-500" size={24} />
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-12 bg-stone-800 rounded-l-lg active:bg-stone-700 active:scale-95 transition-transform pixel-shadow flex items-center justify-center cursor-pointer tap-highlight-transparent"
           onClick={() => handlePress('LEFT')}>
           <ArrowLeft className="text-stone-500" size={24} />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-12 bg-stone-800 rounded-r-lg active:bg-stone-700 active:scale-95 transition-transform pixel-shadow flex items-center justify-center cursor-pointer tap-highlight-transparent"
           onClick={() => handlePress('RIGHT')}>
           <ArrowRight className="text-stone-500" size={24} />
      </div>
      
      <div 
        onClick={onPause}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-stone-700 rounded-full inset-shadow flex items-center justify-center cursor-pointer active:scale-90 transition-transform z-10 border-4 border-stone-800 hover:bg-stone-600"
        title="Pause/Resume"
      >
        {isPaused ? <Play size={20} className="text-yellow-500 fill-current" /> : <Pause size={20} className="text-stone-400" />}
      </div>
    </div>
  );
};

const Screen = ({ children, isOn }: { children?: React.ReactNode, isOn: boolean }) => (
  <div className={`w-full aspect-square bg-[#A4B494] border-8 border-stone-600 rounded-lg shadow-inner relative overflow-hidden transition-colors duration-500 ${!isOn ? 'brightness-50 grayscale' : ''}`}>
    <div className="w-full h-full p-2 font-mono text-[#0F380F] flex flex-col relative z-10">
      {children}
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [currentCoin, setCurrentCoin] = useState<CoinType>(COINS[0]);
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const directionRef = useRef<Direction>('RIGHT');
  const moveQueue = useRef<Direction[]>([]); 
  const speedRef = useRef(INITIAL_SPEED);
  const gameIntervalRef = useRef<number | null>(null);

  // Initialize Leaderboard
  useEffect(() => {
    const saved = localStorage.getItem('crypto_snake_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
  }, []);

  // Controls Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatus(GameStatus.START);
      
      if (e.code === 'Space' && (status === GameStatus.PLAYING || status === GameStatus.PAUSED)) {
        togglePause();
        return;
      }

      if (status !== GameStatus.PLAYING) return;

      switch (e.key) {
        case 'ArrowUp': queueMove('UP'); break;
        case 'ArrowDown': queueMove('DOWN'); break;
        case 'ArrowLeft': queueMove('LEFT'); break;
        case 'ArrowRight': queueMove('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // --- Game Logic ---

  const saveScore = () => {
    playSound('click', isMuted);
    setStatus(GameStatus.SAVING);
    setStatusMessage("Saving Score...");

    setTimeout(() => {
      const newRecord: ScoreRecord = {
        id: Math.random().toString(36).substr(2, 9),
        score,
        timestamp: Date.now(),
      };

      const newLeaderboard = [...leaderboard, newRecord].sort((a, b) => b.score - a.score).slice(0, 10);
      setLeaderboard(newLeaderboard);
      localStorage.setItem('crypto_snake_leaderboard', JSON.stringify(newLeaderboard));
      
      playSound('eat', isMuted);
      setStatus(GameStatus.LEADERBOARD);
    }, 1000);
  };

  const togglePause = () => {
    playSound('click', isMuted);
    if (status === GameStatus.PLAYING) {
      setStatus(GameStatus.PAUSED);
    } else if (status === GameStatus.PAUSED) {
      setStatus(GameStatus.PLAYING);
    }
  };

  const isOpposite = (d1: Direction, d2: Direction) => {
    return (d1 === 'UP' && d2 === 'DOWN') ||
           (d1 === 'DOWN' && d2 === 'UP') ||
           (d1 === 'LEFT' && d2 === 'RIGHT') ||
           (d1 === 'RIGHT' && d2 === 'LEFT');
  };

  const queueMove = (newDir: Direction) => {
    const lastScheduledMove = moveQueue.current.length > 0 
      ? moveQueue.current[moveQueue.current.length - 1] 
      : directionRef.current;

    if (isOpposite(newDir, lastScheduledMove)) return;
    if (newDir === lastScheduledMove) return;

    playSound('click', isMuted);
    moveQueue.current.push(newDir);
  };

  const spawnFood = () => {
    const newX = Math.floor(Math.random() * GRID_SIZE);
    const newY = Math.floor(Math.random() * GRID_SIZE);
    setFood({ x: newX, y: newY });
    const randIndex = Math.floor(Math.random() * COINS.length);
    setCurrentCoin(COINS[randIndex]);
  };

  const gameOver = () => {
    playSound('die', isMuted);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    setStatus(GameStatus.GAME_OVER);
  };

  const gameLoop = useCallback(() => {
    setSnake((prevSnake) => {
      if (moveQueue.current.length > 0) {
        const nextMove = moveQueue.current.shift();
        if (nextMove) {
          directionRef.current = nextMove;
        }
      }

      const currentDir = directionRef.current;
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (currentDir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOver();
        return prevSnake;
      }

      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        playSound('eat', isMuted);
        setScore(s => s + 10);
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
        spawnFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, isMuted]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = window.setInterval(gameLoop, speedRef.current);
    } else {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    }
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [status, gameLoop]); 

  const resetGame = () => {
    playSound('click', isMuted);
    setSnake([{ x: 10, y: 10 }]);
    setScore(0);
    directionRef.current = 'RIGHT';
    moveQueue.current = [];
    speedRef.current = INITIAL_SPEED;
    spawnFood();
    setStatus(GameStatus.PLAYING);
  };

  const goHome = () => {
    playSound('click', isMuted);
    setStatus(GameStatus.START);
    setStatusMessage("");
  };

  const goToLeaderboard = () => {
    playSound('click', isMuted);
    setStatus(GameStatus.LEADERBOARD);
  };

  // --- Rendering Layer Logic ---
  const CELL_PCT = 100 / GRID_SIZE;

  const RenderGameLayers = () => (
    <div className="relative w-full h-full border-2 border-[#0F380F]/30 bg-[#A4B494] overflow-hidden">
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0F380F20 1px, transparent 1px),
            linear-gradient(to bottom, #0F380F20 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_PCT}% ${CELL_PCT}%`
        }}
      />
      <div
        className="absolute z-10 animate-pulse transition-none"
        style={{
          left: `${food.x * CELL_PCT}%`,
          top: `${food.y * CELL_PCT}%`,
          width: `${CELL_PCT}%`,
          height: `${CELL_PCT}%`
        }}
      >
        {currentCoin.svg}
      </div>
      {snake.map((segment, i) => {
        const isHead = i === 0;
        return (
          <div
            key={i}
            className={`absolute transition-none ${isHead ? 'z-20' : 'z-10'}`}
            style={{
              left: `${segment.x * CELL_PCT}%`,
              top: `${segment.y * CELL_PCT}%`,
              width: `${CELL_PCT}%`,
              height: `${CELL_PCT}%`
            }}
          >
            <div className="w-full h-full" style={{ opacity: isHead ? 1 : Math.max(0.6, 1 - i / (snake.length + 10)) }}>
              {BTC_ICON}
            </div>
          </div>
        );
      })}
      {status === GameStatus.PAUSED && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#A4B494]/80 backdrop-blur-sm">
          <div className="bg-[#0F380F] text-[#A4B494] px-4 py-2 font-bold animate-pulse text-xl">
            PAUSED
          </div>
        </div>
      )}
    </div>
  );

  const StartScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-widest uppercase mb-1 text-center">Crypto</h1>
        <h1 className="text-4xl font-bold tracking-widest uppercase mb-2 text-center">Snake</h1>
      </div>
      <div className="w-16 h-16 animate-bounce">{BTC_ICON}</div>
      
      <div className="flex gap-2 mt-4">
        <button 
          onClick={resetGame}
          className="px-6 py-2 bg-[#0F380F] text-[#A4B494] font-bold border-2 border-[#0F380F] hover:bg-[#205020] active:translate-y-1 text-xl"
        >
          PLAY
        </button>
      </div>
    </div>
  );

  const GameOverScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h2 className="text-4xl font-bold mb-2">GAME OVER</h2>
      <div className="text-2xl">SCORE: {score}</div>
      
      <div className="flex flex-col gap-3 w-full max-w-[200px] mt-4">
        <button 
          onClick={saveScore}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0F380F] text-[#A4B494] font-bold active:translate-y-1 hover:opacity-90 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
          <Save size={18} /> SAVE SCORE
        </button>
        <button 
          onClick={goHome}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#0F380F] font-bold active:translate-y-1 hover:bg-[#0F380F]/10"
        >
          <RotateCcw size={18} /> HOME
        </button>
      </div>
    </div>
  );

  const SavingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <Save size={48} className="animate-pulse" />
      <div className="text-center">
        <h3 className="text-2xl font-bold">SAVING...</h3>
        <p className="text-sm mt-2">{statusMessage}</p>
      </div>
      <div className="w-3/4 h-3 bg-[#0F380F]/30 rounded overflow-hidden">
        <div className="h-full bg-[#0F380F] animate-progress"></div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0% }
          100% { width: 100% }
        }
        .animate-progress { animation: progress 1s ease-in-out forwards; }
      `}</style>
    </div>
  );

  const LeaderboardScreen = () => (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b-2 border-[#0F380F] pb-2 mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2"><Trophy size={20}/> HIGH SCORES</h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {leaderboard.length === 0 ? (
          <p className="text-center text-sm mt-10">No records yet.</p>
        ) : (
          leaderboard.map((rec, idx) => (
            <div key={rec.id} className="flex justify-between items-center text-sm border-b border-[#0F380F]/20 pb-1">
              <span className="font-bold w-6">{idx + 1}.</span>
              <div className="flex-1 flex flex-col overflow-hidden mr-2">
                   <span className="font-mono text-xs truncate opacity-70">
                    {new Date(rec.timestamp).toLocaleDateString()}
                  </span>
              </div>
              <span className="font-bold">{rec.score}</span>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-[#0F380F]">
         <button onClick={goHome} className="w-full py-1 text-center font-bold hover:bg-[#0F380F]/10">
           BACK TO HOME
         </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="relative bg-stone-200 p-2 md:p-6 rounded-b-3xl rounded-t-2xl pixel-shadow w-full max-w-xl flex flex-col items-center border-l-8 border-r-8 border-t-4 border-b-8 border-stone-300">
        
        <div className="w-full flex justify-between items-center mb-3 px-2">
           <div className="h-2 md:h-3 w-full border-b-4 border-stone-300"></div>
           <span className="text-stone-400 font-bold italic ml-2 text-xs md:text-sm whitespace-nowrap">GAME-CONSOLE v2.0</span>
        </div>

        <div className="bg-stone-500 p-3 md:p-6 rounded-t-lg rounded-b-2xl w-full shadow-lg relative">
          
          <div className="flex justify-end items-end mb-1 px-1">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1 cursor-pointer group"
              title="Toggle Sound"
            >
              <span className="text-[10px] text-stone-300">SOUND</span>
              <div className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${isMuted ? 'bg-stone-700' : 'bg-green-600'}`}>
                 <div className={`w-3 h-3 bg-stone-200 rounded-full shadow-sm transform transition-transform ${isMuted ? 'translate-x-0' : 'translate-x-4'}`}></div>
              </div>
            </button>
          </div>
          
          <Screen isOn={true}>
            {status === GameStatus.START && <StartScreen />}
            {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
              <>
                 <div className="flex justify-between text-xs font-bold mb-1 border-b border-[#0F380F]/50 pb-1">
                    <span>SCORE: {score}</span>
                    <span>COIN: {currentCoin.symbol}</span>
                 </div>
                 <RenderGameLayers />
              </>
            )}
            {status === GameStatus.GAME_OVER && <GameOverScreen />}
            {status === GameStatus.SAVING && <SavingScreen />}
            {status === GameStatus.LEADERBOARD && <LeaderboardScreen />}
          </Screen>

          <div className="text-center mt-2 text-stone-300 text-xs italic font-serif">Portable Gaming System</div>
        </div>

        <div className="w-full mt-6 pb-4 md:pb-8 flex flex-col items-center relative">
          <div className="flex w-full justify-between items-end px-4 md:px-12">
            
            <div className="scale-110 md:scale-125 origin-bottom-left">
               <DPad onDirection={queueMove} onPause={togglePause} isPaused={status === GameStatus.PAUSED} />
            </div>
            
            <div className="flex gap-4 rotate-12 mb-6 ml-4">
              <div className="flex flex-col items-center gap-1">
                 <button 
                  onClick={goToLeaderboard}
                  className="w-14 h-14 bg-blue-600 rounded-full pixel-shadow active:bg-blue-700 active:translate-y-1 flex items-center justify-center text-stone-200"
                  aria-label="Leaderboard"
                >
                  <ListOrdered size={28} />
                </button>
                 <span className="text-stone-400 font-bold text-xs tracking-wider">RANK</span>
              </div>
              <div className="flex flex-col items-center gap-1 mt-6">
                <button 
                  onClick={goHome}
                  className="w-14 h-14 bg-yellow-500 rounded-full pixel-shadow active:bg-yellow-600 active:translate-y-1 flex items-center justify-center text-stone-900"
                  aria-label="Home"
                >
                  <Home size={28} />
                </button>
                <span className="text-stone-400 font-bold text-xs tracking-wider">HOME</span>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-2 right-8 flex gap-1 -rotate-12 opacity-50">
            <div className="w-1 h-8 bg-stone-300 rounded-full inset-shadow"></div>
            <div className="w-1 h-8 bg-stone-300 rounded-full inset-shadow"></div>
            <div className="w-1 h-8 bg-stone-300 rounded-full inset-shadow"></div>
            <div className="w-1 h-8 bg-stone-300 rounded-full inset-shadow"></div>
          </div>

        </div>

      </div>
    </div>
  );
}
