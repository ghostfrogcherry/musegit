"use client";

import { useState, useRef, useEffect } from "react";
import type { Version } from "@/lib/domain";

type ComparePanelProps = {
  versions: Version[];
};

export function ComparePanel({ versions }: ComparePanelProps) {
  const [versionA, setVersionA] = useState<Version | null>(versions[versions.length - 1] || null);
  const [versionB, setVersionB] = useState<Version | null>(versions[0] || null);
  const [isSynced, setIsSynced] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioARef = useRef<HTMLAudioElement>(null);
  const audioBRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isSynced || !audioARef.current || !audioBRef.current) return;

    const audioA = audioARef.current;
    const audioB = audioBRef.current;

    const syncBtoA = () => {
      if (Math.abs(audioA.currentTime - audioB.currentTime) > 0.1) {
        audioB.currentTime = audioA.currentTime;
      }
    };

    audioA.addEventListener("timeupdate", syncBtoA);
    return () => audioA.removeEventListener("timeupdate", syncBtoA);
  }, [isSynced, versionA, versionB]);

  const togglePlay = () => {
    if (isPlaying) {
      audioARef.current?.pause();
      audioBRef.current?.pause();
    } else {
      if (audioARef.current) {
        audioARef.current.play();
        if (isSynced && audioBRef.current) {
          audioBRef.current.currentTime = audioARef.current.currentTime;
          audioBRef.current.play();
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (audioARef.current) {
      audioARef.current.currentTime = time;
      if (isSynced && audioBRef.current) {
        audioBRef.current.currentTime = time;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!versionA || !versionB || !versionA.audioUrl || !versionB.audioUrl) {
    return (
      <div className="emptyState">
        <strong>Not enough versions</strong>
        <p>Upload at least 2 versions with audio to compare.</p>
      </div>
    );
  }

  return (
    <div className="comparePanel">
      <div className="compareControls">
        <label className="compareSync">
          <input checked={isSynced} onChange={(e) => setIsSynced(e.target.checked)} type="checkbox" />
          Sync playback
        </label>
        <button className="primaryButton buttonReset" onClick={togglePlay} type="button">
          {isPlaying ? "⏸ Play both" : "▶ Play both"}
        </button>
      </div>

      <div className="compareGrid">
        <div className="compareColumn">
          <div className="compareHeader">
            <select className="fieldInput" value={versionA.id} onChange={(e) => setVersionA(versions.find(v => v.id === Number(e.target.value)) || versionA)}>
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.fileName}</option>
              ))}
            </select>
          </div>
          <audio ref={audioARef} src={versionA.audioUrl} />
          <div className="compareWaveform">
            <div className="compareWaveformPlaceholder">A: {versionA.fileName}</div>
          </div>
          <p className="compareMeta">Uploaded by {versionA.uploadedBy} · {versionA.uploadedAt}</p>
          <p className="compareSummary">{versionA.summary}</p>
        </div>

        <div className="compareColumn">
          <div className="compareHeader">
            <select className="fieldInput" value={versionB.id} onChange={(e) => setVersionB(versions.find(v => v.id === Number(e.target.value)) || versionB)}>
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.fileName}</option>
              ))}
            </select>
          </div>
          <audio ref={audioBRef} src={versionB.audioUrl} />
          <div className="compareWaveform">
            <div className="compareWaveformPlaceholder">B: {versionB.fileName}</div>
          </div>
          <p className="compareMeta">Uploaded by {versionB.uploadedBy} · {versionB.uploadedAt}</p>
          <p className="compareSummary">{versionB.summary}</p>
        </div>
      </div>
    </div>
  );
}