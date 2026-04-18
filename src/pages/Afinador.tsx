import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const GUITAR_STRINGS = [
  { note: 'E', octave: 2, freq: 82.41 },
  { note: 'A', octave: 2, freq: 110.0 },
  { note: 'D', octave: 3, freq: 146.83 },
  { note: 'G', octave: 3, freq: 196.0 },
  { note: 'B', octave: 3, freq: 246.94 },
  { note: 'e', octave: 4, freq: 329.63 },
];

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = size - 1;
  const threshold = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < threshold) { r2 = size - i; break; }
  }

  buf = buf.slice(r1, r2);
  size = buf.length;

  const c = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxval = -1, maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }

  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

function frequencyToNote(freq: number) {
  const noteNum = 12 * (Math.log2(freq / 440));
  const rounded = Math.round(noteNum);
  const cents = Math.floor((noteNum - rounded) * 100);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor((rounded + 69) / 12) - 1;
  return { note: NOTE_NAMES[noteIndex], octave, cents, noteIndex };
}

function findClosestString(note: string, octave: number) {
  let closest = GUITAR_STRINGS[0];
  let minDist = Infinity;
  for (const s of GUITAR_STRINGS) {
    const dist = Math.abs(s.octave * 12 + NOTE_NAMES.indexOf(s.note.toUpperCase()) - (octave * 12 + NOTE_NAMES.indexOf(note)));
    if (dist < minDist) { minDist = dist; closest = s; }
  }
  return closest;
}

const Afinador = () => {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [currentNote, setCurrentNote] = useState('—');
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [closestString, setClosestString] = useState<typeof GUITAR_STRINGS[0] | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const detect = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || !audioCtxRef.current) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const freq = autoCorrelate(buf, audioCtxRef.current.sampleRate);

    if (freq > 0 && freq < 1200) {
      const { note, octave, cents: c } = frequencyToNote(freq);
      setCurrentNote(note);
      setCents(c);
      setFrequency(Math.round(freq * 10) / 10);
      setClosestString(findClosestString(note, octave));
    }
    rafRef.current = requestAnimationFrame(detect);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      src.connect(analyser);
      analyserRef.current = analyser;
      setListening(true);
      rafRef.current = requestAnimationFrame(detect);
    } catch {
      console.error('Microphone access denied');
    }
  }, [detect]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    setListening(false);
    setCurrentNote('—');
    setCents(0);
    setFrequency(0);
    setClosestString(null);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  // Needle rotation: cents range -50 to +50 mapped to -45deg to +45deg
  const needleAngle = Math.max(-45, Math.min(45, cents * 0.9));
  const inTune = Math.abs(cents) <= 5 && currentNote !== '—';

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)}>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Afinador</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-12">
        {/* Guitar string indicators */}
        <div className="flex gap-3">
          {GUITAR_STRINGS.map((s) => {
            const isActive = closestString?.note === s.note && closestString?.octave === s.octave;
            return (
              <div
                key={s.note + s.octave}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-mono font-bold transition-all ${
                  isActive
                    ? inTune
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_-3px_hsl(160,84%,39%,0.4)]'
                      : 'border-chord bg-chord/10 text-chord'
                    : 'border-white/10 bg-white/[0.03] text-muted-foreground'
                }`}
              >
                {s.note}
              </div>
            );
          })}
        </div>

        {/* Gauge */}
        <div className="relative w-64 h-40">
          {/* Arc ticks */}
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(0 0% 20%)"
              strokeWidth="2"
            />
            {/* Center green zone */}
            <path
              d="M 95 22 A 80 80 0 0 1 105 22"
              fill="none"
              stroke="hsl(160 84% 39%)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Tick marks */}
            {Array.from({ length: 21 }, (_, i) => {
              const angle = -90 + (i * 180) / 20;
              const rad = (angle * Math.PI) / 180;
              const cx = 100, cy = 100, r1 = 76, r2 = i % 5 === 0 ? 66 : 70;
              return (
                <line
                  key={i}
                  x1={cx + r1 * Math.cos(rad)}
                  y1={cy + r1 * Math.sin(rad)}
                  x2={cx + r2 * Math.cos(rad)}
                  y2={cy + r2 * Math.sin(rad)}
                  stroke={i === 10 ? 'hsl(160 84% 39%)' : 'hsl(0 0% 30%)'}
                  strokeWidth={i % 5 === 0 ? 2 : 1}
                />
              );
            })}
            {/* Labels */}
            <text x="28" y="105" fill="hsl(0 0% 40%)" fontSize="8" fontFamily="monospace">♭</text>
            <text x="168" y="105" fill="hsl(0 0% 40%)" fontSize="8" fontFamily="monospace">♯</text>

            {/* Needle */}
            <g transform={`rotate(${needleAngle} 100 100)`} style={{ transition: 'transform 0.15s ease-out' }}>
              <line
                x1="100" y1="100" x2="100" y2="28"
                stroke={inTune ? 'hsl(160 84% 39%)' : 'hsl(47 95% 54%)'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="5"
                fill={inTune ? 'hsl(160 84% 39%)' : 'hsl(47 95% 54%)'}
              />
            </g>
          </svg>
        </div>

        {/* Note display */}
        <motion.div
          key={currentNote}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className={`text-6xl font-display font-bold ${
            inTune ? 'text-emerald-400' : 'text-foreground'
          } transition-colors`}>
            {currentNote}
          </span>
          {frequency > 0 && (
            <p className="text-sm font-mono text-muted-foreground mt-2">
              {frequency} Hz &nbsp;·&nbsp; {cents > 0 ? '+' : ''}{cents} cents
            </p>
          )}
        </motion.div>

        {/* Mic button */}
        <Button
          onClick={listening ? stop : start}
          size="lg"
          className={`rounded-full h-16 w-16 transition-all ${
            listening
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 shadow-[0_0_20px_-5px_hsl(0,70%,50%,0.3)]'
              : 'bg-chord/10 text-chord border border-chord/30 hover:bg-chord/20 shadow-[0_0_20px_-5px_hsl(47,95%,54%,0.3)]'
          }`}
          variant="ghost"
        >
          {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <p className="text-xs text-muted-foreground">
          {listening ? 'Toque uma corda' : 'Toque para iniciar'}
        </p>
      </div>
    </div>
  );
};

export default Afinador;
