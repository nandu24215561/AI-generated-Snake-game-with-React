import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Trophy, Gamepad2, Music } from 'lucide-react';

// --- Constants & Types ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 1,
    title: "Neon Drive (AI Generated)",
    artist: "SynthMind",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "text-green-400",
    glow: "shadow-[0_0_15px_rgba(74,222,128,0.5)]"
  },
  {
    id: 2,
    title: "Cyber City (AI Generated)",
    artist: "NeuralBeats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "text-fuchsia-400",
    glow: "shadow-[0_0_15px_rgba(232,121,249,0.5)]"
  },
  {
    id: 3,
    title: "Synthwave Nights (AI Generated)",
    artist: "AlgorithmX",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "text-cyan-400",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on the snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGameRunning(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      e.preventDefault(); // Prevent scrolling
    }

    if (!isGameRunning && !gameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      setIsGameRunning(true);
    }

    setDirection(prev => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          return prev.y === 1 ? prev : { x: 0, y: -1 };
        case 'ArrowDown':
        case 's':
          return prev.y === -1 ? prev : { x: 0, y: 1 };
        case 'ArrowLeft':
        case 'a':
          return prev.x === 1 ? prev : { x: -1, y: 0 };
        case 'ArrowRight':
        case 'd':
          return prev.x === -1 ? prev : { x: 1, y: 0 };
        default:
          return prev;
      }
    });
  }, [isGameRunning, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, isGameRunning, generateFood, highScore]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-fuchsia-500/30">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-600/5 rounded-full blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={handleTrackEnd}
        preload="auto"
      />

      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
        
        {/* Left Panel: Stats & Info */}
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold tracking-wider uppercase text-white/90">Scoreboard</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-white/50 text-sm uppercase tracking-widest">Current Score</span>
                <span className="font-mono text-4xl font-bold text-white">{score}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-white/50 text-sm uppercase tracking-widest">High Score</span>
                <span className="font-mono text-2xl font-bold text-yellow-400/80">{highScore}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl hidden lg:block">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-6 h-6 text-white/70" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-white/70">Controls</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto opacity-70">
              <div />
              <kbd className="bg-white/10 border border-white/20 rounded p-2 flex justify-center items-center font-mono text-sm">W</kbd>
              <div />
              <kbd className="bg-white/10 border border-white/20 rounded p-2 flex justify-center items-center font-mono text-sm">A</kbd>
              <kbd className="bg-white/10 border border-white/20 rounded p-2 flex justify-center items-center font-mono text-sm">S</kbd>
              <kbd className="bg-white/10 border border-white/20 rounded p-2 flex justify-center items-center font-mono text-sm">D</kbd>
            </div>
            <p className="text-center text-xs text-white/40 mt-4 uppercase tracking-widest">Or Arrow Keys</p>
          </div>
        </div>

        {/* Center: Game Board */}
        <div className="order-1 lg:order-2 flex flex-col items-center">
          <div className={`relative bg-[#0a0a0a] border-2 ${gameOver ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-white/10 shadow-2xl'} rounded-xl overflow-hidden transition-all duration-300`}>
            
            {/* Game Canvas (Grid based) */}
            <div 
              className="grid bg-[#050505]"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 20px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 20px)`
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                
                const isSnakeHead = snake[0].x === x && snake[0].y === y;
                const isSnakeBody = snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={i} 
                    className={`w-[20px] h-[20px] border-[0.5px] border-white/[0.02] ${
                      isSnakeHead ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] z-10 rounded-sm' :
                      isSnakeBody ? 'bg-green-500/80 rounded-sm scale-90' :
                      isFood ? 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)] rounded-full scale-75 animate-pulse' :
                      ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center animate-pulse">
                  <p className="text-2xl font-bold tracking-widest uppercase mb-2">Ready?</p>
                  <p className="text-white/50 text-sm tracking-widest uppercase">Press any arrow key</p>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
                <h2 className="text-4xl font-black text-red-500 tracking-widest uppercase mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">Game Over</h2>
                <p className="text-white/70 mb-6 font-mono text-lg">Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold tracking-widest uppercase text-sm transition-all hover:scale-105 active:scale-95"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Music Player */}
        <div className="order-3 flex flex-col gap-6">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Music className={`w-5 h-5 ${currentTrack.color} ${isPlaying ? 'animate-pulse' : ''}`} />
                <h2 className="text-sm font-bold tracking-wider uppercase text-white/70">Now Playing</h2>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/50 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Track Info */}
            <div className="mb-8 text-center">
              <div className={`w-24 h-24 mx-auto bg-[#1a1a1a] rounded-full mb-4 flex items-center justify-center border-2 border-white/5 ${isPlaying ? currentTrack.glow : ''} transition-all duration-500`}>
                <div className={`w-8 h-8 rounded-full bg-[#050505] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              </div>
              <h3 className={`font-bold text-lg truncate ${currentTrack.color}`}>{currentTrack.title}</h3>
              <p className="text-white/50 text-sm">{currentTrack.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={prevTrack}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button 
                onClick={togglePlay}
                className={`p-4 rounded-full bg-white text-black hover:scale-105 transition-all active:scale-95 ${isPlaying ? currentTrack.glow : ''}`}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Track List */}
            <div className="mt-8 space-y-2">
              {TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    idx === currentTrackIndex 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <span className="font-mono text-xs opacity-50">0{idx + 1}</span>
                  <span className="truncate">{track.title}</span>
                  {idx === currentTrackIndex && isPlaying && (
                    <div className="ml-auto flex gap-1">
                      <div className="w-1 h-3 bg-current animate-[bounce_1s_infinite_0ms]" />
                      <div className="w-1 h-3 bg-current animate-[bounce_1s_infinite_200ms]" />
                      <div className="w-1 h-3 bg-current animate-[bounce_1s_infinite_400ms]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
