"use client";

import { useEffect, useRef, useState } from "react";
import type { Comment } from "@/lib/domain";
import { usePlayer } from "@/lib/player-context";

type WaveformPlayerProps = {
  audioSrc: string;
  durationSeconds: number;
  comments: Comment[];
};

interface PlayheadState {
  currentTime: number;
  isPlaying: boolean;
}

export function WaveformPlayer({ audioSrc, durationSeconds, comments }: WaveformPlayerProps) {
  const { pausePageAudio, registerPageAudio, activePlayer } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    registerPageAudio(audioRef.current);
    return () => registerPageAudio(null);
  }, []);

  const [playhead, setPlayhead] = useState<PlayheadState>({ currentTime: 0, isPlaying: false });
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!audioSrc) {
      setError("No audio source");
      setIsLoading(false);
      return;
    }

    console.log("Waveform useEffect running, audioSrc:", audioSrc, "retryKey:", retryKey);

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Waveform: No canvas ref");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("Waveform: No 2d context");
      return;
    }

    setIsLoading(true);
    setError(null);

    const initAudio = async () => {
      try {
        console.log("Waveform: Fetching audio from:", audioSrc);
        audioContextRef.current = new AudioContext();
        
        const response = await fetch(audioSrc, { 
          credentials: "include",
          mode: "cors"
        });
        
        console.log("Waveform: Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          const text = await response.text();
          console.error("Waveform: Response error:", text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log("Waveform: ArrayBuffer byteLength:", arrayBuffer.byteLength);
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error("Empty audio file");
        }
        
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        console.log("Waveform: Audio decoded, duration:", audioBuffer.duration, "channels:", audioBuffer.numberOfChannels);

        const rawData = audioBuffer.getChannelData(0);
        const samples = 200;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;

          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }

          filteredData.push(sum / blockSize);
        }

        const maxVal = Math.max(...filteredData);
        const normalizedData = filteredData.map((v) => v / maxVal);
        setWaveformData(normalizedData);
        setIsLoading(false);
      } catch (err) {
        console.error("Waveform load error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioSrc, retryKey]);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const playheadRatio = playhead.currentTime / durationSeconds;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(0, 0, width, height);

    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.85;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      const played = index / waveformData.length <= playheadRatio;

      if (played) {
        ctx.fillStyle = "#b197fc";
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    const playheadX = playheadRatio * width;
    ctx.strokeStyle = "#ff8fab";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [waveformData, playhead, durationSeconds]);

  useEffect(() => {
    if (!audioRef.current) return;

    const updatePlayhead = () => {
      const audio = audioRef.current;
      setPlayhead({
        currentTime: audio?.currentTime ?? 0,
        isPlaying: audio ? !audio.paused : false
      });
    };

    const audio = audioRef.current;
    audio.addEventListener("timeupdate", updatePlayhead);
    audio.addEventListener("play", updatePlayhead);
    audio.addEventListener("pause", updatePlayhead);
    audio.addEventListener("ended", () => setPlayhead((p) => ({ ...p, isPlaying: false })));

    return () => {
      audio.removeEventListener("timeupdate", updatePlayhead);
      audio.removeEventListener("play", updatePlayhead);
      audio.removeEventListener("pause", updatePlayhead);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !containerRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const time = ratio * durationSeconds;

    audioRef.current.currentTime = time;
    setPlayhead((p) => ({ ...p, currentTime: time }));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    pausePageAudio();

    if (playhead.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const jumpToTimestamp = (timestamp?: string) => {
    if (!timestamp || !audioRef.current) return;

    const parts = timestamp.split(":").map(Number);
    let seconds = 0;

    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      seconds = parts[0];
    }

    if (!Number.isNaN(seconds)) {
      audioRef.current.currentTime = seconds;
      setPlayhead((p) => ({ ...p, currentTime: seconds }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const timestampComments = comments.filter((c) => c.timestamp);

  return (
    <div className="waveformPlayer">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      <div className="waveformContainer" ref={containerRef} style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          className="waveformCanvas"
          onClick={handleClick}
          width={600}
          height={80}
        />
        {isLoading && (
          <div className="waveformLoadingOverlay">
            {error ? `Error: ${error}` : `Loading waveform...`}
          </div>
        )}
      </div>
      {error && (
        <div style={{ padding: "0.5rem" }}>
          <button className="secondaryButton buttonReset" onClick={() => setRetryKey(k => k + 1)}>
            Retry
          </button>
        </div>
      )}

      <div className="waveformControls">
        <button className="playButton buttonReset" onClick={togglePlay} type="button">
          {playhead.isPlaying ? "⏸" : "▶"}
        </button>
        <span className="timeCurrent">{formatTime(playhead.currentTime)}</span>
        <span className="timeSeparator">/</span>
        <span className="timeDuration">{formatTime(durationSeconds)}</span>
      </div>

      {timestampComments.length > 0 && (
        <div className="timestampMarkers">
          <span className="markersLabel">Comments:</span>
          {timestampComments.map((comment, idx) => (
            <button
              key={`${comment.id}-${idx}`}
              className="markerButton buttonReset"
              onClick={() => jumpToTimestamp(comment.timestamp)}
              type="button"
            >
              {comment.timestamp}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}