import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trophy, Timer, XCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SCALES = {
  C: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  G: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  D: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  A: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  E: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  F: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
};

const DEGREES = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const ALL_CHORDS = Array.from(new Set(Object.values(SCALES).flat()));

export default function MestreCampoHarmonico() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentScale, setCurrentScale] = useState<keyof typeof SCALES>('C');
  const [missingDegreeIndex, setMissingDegreeIndex] = useState(3);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generateRound = () => {
    const scaleKeys = Object.keys(SCALES) as (keyof typeof SCALES)[];
    const randomScale = scaleKeys[Math.floor(Math.random() * scaleKeys.length)];
    const randomDegree = Math.floor(Math.random() * 7);
    
    const correctChord = SCALES[randomScale][randomDegree];
    const wrongOptions = ALL_CHORDS.filter(c => c !== correctChord)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setCurrentScale(randomScale);
    setMissingDegreeIndex(randomDegree);
    setOptions([correctChord, ...wrongOptions].sort(() => 0.5 - Math.random()));
    setFeedback(null);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    generateRound();
  };

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) {
      if (timeLeft <= 0) setIsPlaying(false);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleGuess = (chord: string) => {
    const correctChord = SCALES[currentScale][missingDegreeIndex];
    if (chord === correctChord) {
      setFeedback('correct');
      setScore(s => s + 10);
      setTimeout(generateRound, 400);
    } else {
      setFeedback('wrong');
      setTimeLeft(t => Math.max(0, t - 3)); // penalidade
      setTimeout(() => setFeedback(null), 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-body pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/estude" className="p-2 bg-white/5 rounded-full hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-display font-bold">Mestre do Campo Harmônico</h1>
      </div>

      {!isPlaying && timeLeft === 60 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-orange-500" />
          </div>
          <h2 className="text-3xl font-display font-bold">Pronto para o desafio?</h2>
          <p className="text-gray-400 max-w-sm">
            Complete a sequência do campo harmônico o mais rápido que puder. Erros custam tempo!
          </p>
          <Button 
            onClick={startGame}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-2xl text-lg font-bold w-full max-w-md mt-8"
          >
            <Play className="mr-2 h-6 w-6" /> Começar (60s)
          </Button>
        </div>
      ) : !isPlaying && timeLeft <= 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <h2 className="text-4xl font-display font-bold text-orange-500">Fim de Jogo!</h2>
          <p className="text-2xl">Sua pontuação: <span className="font-bold">{score}</span></p>
          <Button 
            onClick={startGame}
            className="bg-white text-black hover:bg-gray-200 px-8 py-6 rounded-2xl text-lg font-bold w-full max-w-md mt-8"
          >
            Jogar Novamente
          </Button>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-8">
          {/* HUD */}
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              <span className="font-bold text-xl">{score}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              <Timer className="h-5 w-5" />
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Puzzle */}
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center relative overflow-hidden">
            <h3 className="text-lg text-gray-400 mb-6">Tom: <span className="text-white font-bold">{currentScale} Maior</span></h3>
            
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {SCALES[currentScale].map((chord, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">{DEGREES[idx]}</span>
                  {idx === missingDegreeIndex ? (
                    <motion.div 
                      animate={feedback === 'correct' ? { scale: [1, 1.2, 1], backgroundColor: '#22c55e' } : feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0], backgroundColor: '#ef4444' } : {}}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 border-dashed ${feedback === 'correct' ? 'border-green-500 bg-green-500/20' : feedback === 'wrong' ? 'border-red-500 bg-red-500/20' : 'border-orange-500/50 bg-orange-500/10'}`}
                    >
                      <span className="text-xl font-bold text-white">?</span>
                    </motion.div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-sm font-bold">{chord}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((chord, idx) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={idx}
                onClick={() => handleGuess(chord)}
                className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl text-2xl font-bold transition-colors active:bg-orange-500/50"
              >
                {chord}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
