"use client";

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";

type PlayerTrack = {
  songId: number;
  songName: string;
  workspaceName: string;
  versionId: number;
  audioSrc: string;
  duration: number;
};

type PlayerContextType = {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  waveformData: number[];
  activePlayer: "page" | "persistent";
  play: (track: PlayerTrack) => void;
  pause: () => void;
  pausePageAudio: () => void;
  registerPageAudio: (el: HTMLAudioElement | null) => void;
  toggle: () => void;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  stop: () => void;
  setActivePlayer: (player: "page" | "persistent") => void;
  clearAll: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [activePlayer, setActivePlayer] = useState<"page" | "persistent">("page");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!currentTrack?.audioSrc) {
      setWaveformData([]);
      return;
    }

    const analyzeAudio = async () => {
      try {
        const response = await fetch(currentTrack.audioSrc, { credentials: "include", mode: "cors" });
        if (!response.ok) return;
        
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 100;
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
        setWaveformData(filteredData.map((v) => v / maxVal));
        await audioContext.close();
      } catch (err) {
        console.error("Waveform analysis error:", err);
      }
    };

    analyzeAudio();
  }, [currentTrack?.audioSrc]);

  function play(track: PlayerTrack) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setActivePlayer("persistent");
  }

  function pause() {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }

function toggle() {
    if (isPlaying) {
      pause();
    } else if (audioRef.current && currentTrack) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function pausePageAudio() {
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
    }
  }

  function registerPageAudio(el: HTMLAudioElement | null) {
    pageAudioRef.current = el;
  }

  function seek(time: number) {
    const clampedTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(clampedTime);
    if (audioRef.current) {
      audioRef.current.currentTime = clampedTime;
    }
  }

  function skipForward(seconds: number = 15) {
    seek(currentTime + seconds);
  }

  function skipBackward(seconds: number = 15) {
    seek(currentTime - seconds);
  }

  function setVolumeLevel(vol: number) {
    setVolume(vol);
    setIsMuted(false);
  }

  function toggleMute() {
    setIsMuted((m) => !m);
  }

  function setPlaybackRateLevel(rate: number) {
    setPlaybackRate(rate);
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current.currentTime = 0;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }

  function clearAll() {
    stop();
    setVolume(1);
    setPlaybackRate(1);
    setIsMuted(false);
    setWaveformData([]);
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        isMuted,
        waveformData,
        activePlayer,
        play,
        pause,
        pausePageAudio,
        registerPageAudio,
        toggle,
        seek,
        skipForward,
        skipBackward,
        setVolume: setVolumeLevel,
        toggleMute,
        setPlaybackRate: setPlaybackRateLevel,
        stop,
        clearAll,
        setActivePlayer
      }}
    >
      {children}
      {currentTrack && <PersistentPlayer audioRef={audioRef} />}
    </PlayerContext.Provider>
  );
}

function PersistentPlayer({ audioRef }: { audioRef: React.MutableRefObject<HTMLAudioElement | null> }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isMuted,
    waveformData,
    toggle,
    seek,
    skipForward,
    skipBackward,
    setVolume,
    toggleMute,
    setPlaybackRate,
    stop
  } = usePlayer();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0 || !duration) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const progress = currentTime / duration;

    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(0, 0, width, height);

    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.85;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      const played = index / waveformData.length <= progress;

      ctx.fillStyle = played ? "#22c55e" : "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    const playheadX = progress * width;
    ctx.strokeStyle = "#ff8fab";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [waveformData, currentTime, duration]);

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  }

  function handleProgressMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
  }

  function handleProgressMouseLeave() {
    setHoverTime(null);
  }

  function handleDragStart(e: React.MouseEvent<HTMLDivElement>) {
    setIsDragging(true);
    handleProgressClick(e);
  }

  function handleDragMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isDragging) {
      handleProgressClick(e);
    }
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  function handleVolumeClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setVolume(Math.max(0, Math.min(1, ratio)));
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const secsRem = Math.floor(secs % 60);
    return `${mins}:${secsRem.toString().padStart(2, "0")}`;
  };

  const displayTime = hoverTime ?? currentTime;
  const progress = duration ? displayTime / duration : 0;
  const hoverDisplayTime = hoverTime !== null ? hoverTime : null;

  return (
    <div className="persistentPlayer">
      <audio ref={audioRef} src={currentTrack?.audioSrc} autoPlay />
      <button className="persistentStopButton buttonReset" onClick={stop} title="Stop" type="button">
        ⏹
      </button>
      <div className="persistentTrackInfo">
        <strong>{currentTrack?.songName}</strong>
        <span>{currentTrack?.workspaceName}</span>
      </div>
      <div className="persistentControls">
        <button className="persistentSkipButton buttonReset" onClick={() => skipBackward(15)} title="-15s" type="button">
          -15
        </button>
        <button className="persistentPlayButton buttonReset" onClick={toggle} type="button">
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="persistentSkipButton buttonReset" onClick={() => skipForward(15)} title="+15s" type="button">
          +15
        </button>
      </div>
      <button className="persistentSkipButton buttonReset small" onClick={() => skipBackward(5)} title="-5s" type="button">
        -5
      </button>
      <div
        className="persistentProgress"
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseMove={handleProgressMouseMove}
        onMouseLeave={handleProgressMouseLeave}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseOut={handleDragEnd}
      >
        <canvas
          ref={canvasRef}
          className="persistentWaveform"
          width={200}
          height={40}
        />
        <div className="persistentProgressHandle" style={{ left: `${progress * 100}%` }} />
        <div className="persistentProgressHover" style={{ width: hoverDisplayTime !== null ? `${(hoverDisplayTime / duration) * 100}%` : 0 }} />
      </div>
      <button className="persistentSkipButton buttonReset small" onClick={() => skipForward(5)} title="+5s" type="button">
        +5
      </button>
      <span className="persistentTime">
        {formatTime(displayTime)} / {formatTime(duration)}
      </span>
      <div className="persistentVolume" ref={volumeRef} onClick={handleVolumeClick}>
        <div
          className="persistentVolumeBar"
          style={{ width: isMuted ? "0%" : `${volume * 100}%` }}
        />
      </div>
      <button className="persistentMuteButton buttonReset" onClick={toggleMute} type="button">
        {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
      </button>
      <select
        className="persistentRateSelect"
        value={playbackRate}
        onChange={(e) => setPlaybackRate(Number(e.target.value))}
      >
        <option value={0.5}>0.5x</option>
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>
    </div>
  );
}