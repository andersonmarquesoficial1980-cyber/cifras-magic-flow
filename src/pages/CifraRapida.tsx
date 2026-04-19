import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Music2, Trophy, RotateCcw, CheckCircle2, XCircle, Timer } from 'lucide-react';

// Teoria musical
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_PT: Record<string, string> = {
  C: 'Dó', 'C#': 'Dó#', D: 'Ré', 'D#': 'Ré#', E: 'Mi', F: 'Fá',
  'F#': 'Fá#', G: 'Sol', 'G#': 'Sol#', A: 'Lá', 'A#': 'Lá#', B: 'Si',
};
const INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];
const DEGREE_NAMES = ['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm', 'VIIº'];

// Progressões famosas com nomes
const PROGRESSIONS = [
  { graus: [0, 3, 4, 5], nome: 'I – IV – V – VIm', contexto: 'Super comum no Gospel e Sertanejo' },
  { graus: [0, 4, 5, 3], nome: 'I – V – VIm – IV', contexto: 'A progressão de mil músicas pop' },
  { graus: [0, 5, 3, 4], nome: 'I – VIm – IV – V', contexto: 'Rock e baladas clássicas' },
  { graus: [0, 3, 5, 4], nome: 'I – IV – VIm – V', contexto: 'Gospel moderno' },
  { graus: [5, 3, 0, 4], nome: 'VIm – IV – I – V', contexto: 'Pop melancólico e worship' },
  { graus: [0, 4, 3, 4], nome: 'I – V – IV – V', contexto: 'Blues e rock básico' },
  { graus: [0, 1, 3, 4], nome: 'I – IIm – IV – V', contexto: 'Jazz e bossa nova' },
  { graus: [0, 3, 4, 0], nome: 'I – IV – V – I', contexto: 'Cadência clássica' },
];

function getField(root: string) {
  const idx = NOTES.indexOf(root);
  return INTERVALS.map((interval, i) => {
    const note = NOTES[(idx + interval) % 12];
    return { chord: note + QUALITIES[i], degree: DEGREE_NAMES[i] };
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Question {
  tom: string;
  progressao: typeof PROGRESSIONS[0];
  acordes: string[];
  // Pergunta: qual acorde é o grau X?
  grauIdx: number; // índice na progressão (0-3)
  correctChord: string;
  options: string[];
}

function generateQuestion(): Question {
  const tom = randomFrom(NOTES);
  const field = getField(tom);
  const prog = randomFrom(PROGRESSIONS);
  const acordes = prog.graus.map(g => field[g].chord);
  const grauIdx = Math.floor(Math.random() * 4);
  const correctChord = acordes[grauIdx];
  const correctDegree = DEGREE_NAMES[prog.graus[grauIdx]];

  // Opções: acorde correto + 3 errados do campo harmônico
  const outros = field.map(f => f.chord).filter(c => c !== correctChord);
  const options = shuffle([correctChord, ...shuffle(outros).slice(0, 3)]);

  return { tom, progressao: prog, acordes, grauIdx, correctChord, options };
}

const TOTAL = 8;
const TEMPO = 15; // segundos por pergunta

export default function CifraRapida() {
  const navigate = useNavigate();
  const [fase, setFase] = useState<'intro' | 'game' | 'result'>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<Question>(generateQuestion);
  const [selected, setSelected] = useState<string | null>(null);
  const [tempo, setTempo] = useState(TEMPO);
  const [acertos, setAcertos] = useState<boolean[]>([]);

  // Timer
  useEffect(() => {
    if (fase !== 'game' || selected) return;
    if (tempo <= 0) {
      handleAnswer('__timeout__');
      return;
    }
    const t = setTimeout(() => setTempo(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [fase, tempo, selected]);

  const handleAnswer = useCallback((resposta: string) => {
    if (selected) return;
    setSelected(resposta);
    const correto = resposta === question.correctChord;
    if (correto) setScore(s => s + 1);
    setAcertos(a => [...a, correto]);
  }, [selected, question]);

  const proxima = useCallback(() => {
    if (qIdx + 1 >= TOTAL) {
      setFase('result');
      return;
    }
    setQIdx(i => i + 1);
    setQuestion(generateQuestion());
    setSelected(null);
    setTempo(TEMPO);
  }, [qIdx]);

  const reiniciar = () => {
    setFase('game');
    setQIdx(0);
    setScore(0);
    setQuestion(generateQuestion());
    setSelected(null);
    setTempo(TEMPO);
    setAcertos([]);
  };

  const grauCorreto = DEGREE_NAMES[question.progressao.graus[question.grauIdx]];

  // ── Intro ──
  if (fase === 'intro') return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold text-white">Cifra Rápida</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FACC15]/20 border border-[#FACC15]/30">
          <Music2 className="h-10 w-10 text-[#FACC15]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cifra Rápida ⚡</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Uma progressão aparece na tela. Você tem <strong className="text-white">{TEMPO} segundos</strong> para identificar o acorde correto de cada grau.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2 text-left">
          {['Veja o tom e a progressão', 'Identifique o grau destacado', 'Escolha o acorde certo'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FACC15]/20 text-[#FACC15] text-xs font-bold shrink-0">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <button onClick={() => { setFase('game'); setQuestion(generateQuestion()); }}
          className="w-full max-w-xs bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold text-base py-3 rounded-xl transition-colors">
          Começar! 🎸
        </button>
      </div>
    </div>
  );

  // ── Resultado ──
  if (fase === 'result') {
    const pct = Math.round((score / TOTAL) * 100);
    const msg = pct >= 80 ? '🎸 Incrível!' : pct >= 60 ? '👍 Bom!' : '💪 Continue praticando!';
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center gap-6">
        <Trophy className={`h-16 w-16 ${pct >= 80 ? 'text-[#FACC15]' : 'text-gray-500'}`} />
        <div>
          <p className="text-4xl font-bold text-white">{score}/{TOTAL}</p>
          <p className="text-lg text-gray-400 mt-1">{msg}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {acertos.map((a, i) => a
            ? <CheckCircle2 key={i} className="h-6 w-6 text-emerald-400" />
            : <XCircle key={i} className="h-6 w-6 text-red-400" />
          )}
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={reiniciar}
            className="flex-1 flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold py-3 rounded-xl">
            <RotateCcw size={16} /> Jogar Novamente
          </button>
          <button onClick={() => navigate(-1)}
            className="flex-1 border border-white/10 text-gray-400 hover:text-white py-3 rounded-xl transition-colors">
            Sair
          </button>
        </div>
      </div>
    );
  }

  // ── Game ──
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1 text-[#FACC15] font-mono font-bold">
          <Trophy className="h-4 w-4" />
          {score}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{qIdx + 1} de {TOTAL}</span>
          <span className={`flex items-center gap-1 ${tempo <= 5 ? 'text-red-400' : 'text-gray-400'}`}>
            <Timer size={12} /> {tempo}s
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#FACC15] rounded-full transition-all"
            style={{ width: `${((qIdx) / TOTAL) * 100}%` }} />
        </div>
        {/* Timer bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
          <motion.div className={`h-full rounded-full ${tempo <= 5 ? 'bg-red-400' : 'bg-blue-400'}`}
            animate={{ width: `${(tempo / TEMPO) * 100}%` }}
            transition={{ duration: 0.5 }} />
        </div>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-5">
        {/* Tom */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Tom</p>
          <p className="text-3xl font-display font-bold text-white">
            {question.tom} <span className="text-base text-muted-foreground">({NOTE_PT[question.tom]} Maior)</span>
          </p>
        </div>

        {/* Progressão */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-muted-foreground mb-3 text-center">{question.progressao.contexto}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {question.acordes.map((acorde, i) => (
              <div key={i} className={`flex flex-col items-center rounded-xl px-4 py-3 border transition-all ${
                i === question.grauIdx
                  ? 'bg-[#FACC15]/20 border-[#FACC15] scale-110'
                  : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-lg font-bold font-mono ${i === question.grauIdx ? 'text-[#FACC15]' : 'text-white'}`}>
                  {i === question.grauIdx ? '?' : acorde}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {DEGREE_NAMES[question.progressao.graus[i]]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#FACC15] mt-3 font-medium">
            Qual é o acorde {grauCorreto}?
          </p>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === question.correctChord;
            let style = 'bg-white/[0.05] border-white/10 text-white';
            if (selected) {
              if (isCorrect) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
              else if (isSelected) style = 'bg-red-500/20 border-red-500 text-red-300';
              else style = 'bg-white/[0.02] border-white/5 text-muted-foreground';
            }
            return (
              <motion.button key={opt}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                className={`rounded-xl border p-4 text-xl font-bold font-mono transition-all ${style}`}>
                {opt}
                {selected && isCorrect && <CheckCircle2 className="h-4 w-4 inline ml-2" />}
                {selected && isSelected && !isCorrect && <XCircle className="h-4 w-4 inline ml-2" />}
              </motion.button>
            );
          })}
        </div>

        {/* Próxima */}
        {selected && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={proxima}
            className="w-full bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold py-3 rounded-xl">
            {qIdx + 1 >= TOTAL ? 'Ver Resultado 🏆' : 'Próxima →'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
