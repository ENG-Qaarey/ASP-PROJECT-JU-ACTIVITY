import { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";

interface WaveformVisualizerProps {
  audioUrl: string;
  isMine: boolean;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export default function WaveformVisualizer({
  audioUrl,
  isMine,
  isPlaying: controlledPlaying,
  onPlayPause,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const actualPlaying = controlledPlaying !== undefined ? controlledPlaying : isPlaying;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bars = 40;
    for (let i = 0; i < bars; i++) {
      const barHeight = Math.max(2, Math.sin((i / bars) * Math.PI * 3) * h * 0.6 + h * 0.2 + Math.random() * 4);
      const x = (i / bars) * w;
      const barW = w / bars - 1.5;
      ctx.fillStyle = isMine ? "rgba(255,255,255,0.5)" : "hsl(var(--primary))";
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.roundRect(x, h - barHeight, barW, barHeight, 2);
      ctx.fill();
    }
  }, [isMine]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    });

    return () => {
      audio.pause();
      audio.src = "";
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (onPlayPause) { onPlayPause(); return; }
    const audio = audioRef.current;
    if (!audio) return;
    if (actualPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    } else {
      audio.play();
      setIsPlaying(true);
      if (!audioCtxRef.current) {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
      const animate = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const bars = 40;
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor((i / bars) * dataArray.length);
          const barHeight = Math.max(2, (dataArray[idx] / 255) * h);
          const x = (i / bars) * w;
          const barW = w / bars - 1.5;
          ctx.fillStyle = isMine ? "rgba(255,255,255,0.8)" : "hsl(var(--primary))";
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.roundRect(x, h - barHeight, barW, barHeight, 2);
          ctx.fill();
        }
        animRef.current = requestAnimationFrame(animate);
      };
      animate();
    }
  };

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex items-center gap-2">
      <button onClick={togglePlay}
        className={`rounded-full p-1.5 shrink-0 transition-all hover:scale-110 ${
          isMine ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20"
        }`}>
        {actualPlaying
          ? <Pause className={`h-4 w-4 ${isMine ? "text-white" : "text-primary"}`} />
          : <Play className={`h-4 w-4 ${isMine ? "text-white" : "text-primary"}`} />
        }
      </button>
      <span className={`text-xs font-medium tabular-nums ${
        isMine ? "text-white/80" : "text-black dark:text-white"
      }`}>
        {formatDur(actualPlaying ? currentTime : duration)}
      </span>
      <div className="relative flex-1 h-8 mx-1">
        <canvas ref={canvasRef} width={140} height={32} className="w-full h-full rounded" />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary/50 rounded-full"
            style={{ width: `${progress * 100}%` }} />
        )}
      </div>
      <Mic className={`h-4 w-4 ${
        isMine ? "text-white/60" : "text-black/60 dark:text-white/60"
      }`} />
    </div>
  );
}
