"use client";

import { useState, useRef, useEffect } from "react";
import type { Stem } from "@/lib/domain";

type StemsPanelProps = {
  versionId: number;
  stems: Stem[];
};

const INSTRUMENTS = [
  "Drums",
  "Bass",
  "Guitar",
  "Vocals",
  "Piano",
  "Synth",
  "Strings",
  "Horn",
  "Other"
];

export function StemsPanel({ versionId, stems: initialStems }: StemsPanelProps) {
  const [stems, setStems] = useState(initialStems);
  const [isOpen, setIsOpen] = useState(false);
  const [muted, setMuted] = useState<Set<number>>(new Set());
  const [soloed, setSoloed] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const hasSolo = soloed.size > 0;
    
    stems.forEach(stem => {
      const audio = audioRefs.current.get(stem.id);
      if (!audio) return;

      const isMuted = muted.has(stem.id);
      const shouldPlay = hasSolo ? soloed.has(stem.id) : !isMuted;
      
      if (shouldPlay && audio.paused) {
        try { audio.play(); } catch {}
      } else if (!shouldPlay && !audio.paused) {
        audio.pause();
      }
    });
  }, [muted, soloed, stems]);

  function toggleMute(stemId: number) {
    setMuted(prev => {
      const next = new Set(prev);
      if (next.has(stemId)) next.delete(stemId);
      else next.add(stemId);
      return next;
    });
  }

  function toggleSolo(stemId: number) {
    setSoloed(prev => {
      const next = new Set(prev);
      if (next.has(stemId)) next.delete(stemId);
      else next.add(stemId);
      return next;
    });
  }

  async function handleUpload(formData: FormData) {
    setUploading(true);
    try {
      const res = await fetch(`/api/versions/${versionId}/stems`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const newStem: Stem = {
          id: data.stemId,
          versionId,
          name: formData.get("name") as string,
          instrument: (formData.get("instrument") as string) || null,
          audioUrl: `/api/stems/${data.stemId}`,
          durationSeconds: null
        };
        setStems([...stems, newStem]);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <article className="panel detailPanel">
      <div className="sectionHeading">
        <h2>Stems ({stems.length})</h2>
        <button className="secondaryButton buttonReset inlineButton" onClick={() => setIsOpen(!isOpen)} type="button">
          {isOpen ? "Close" : stems.length > 0 ? "Manage" : "Add"}
        </button>
      </div>

      {stems.length > 0 && (
        <div className="stemsList">
          {stems.map(stem => (
            <div key={stem.id} className="stemRow">
              <audio
                ref={el => { if (el) audioRefs.current.set(stem.id, el); }}
                src={stem.audioUrl || ""}
                loop
              />
              <div className="stemInfo">
                <strong>{stem.name}</strong>
                <span>{stem.instrument || "Track"}</span>
              </div>
              <div className="stemControls">
                <button
                  className={`stemButton mute${muted.has(stem.id) ? " active" : ""}`}
                  onClick={() => toggleMute(stem.id)}
                  title="Mute"
                >
                  M
                </button>
                <button
                  className={`stemButton solo${soloed.has(stem.id) ? " active" : ""}`}
                  onClick={() => toggleSolo(stem.id)}
                  title="Solo"
                >
                  S
                </button>
              </div>
            </div>
          ))}
          {(muted.size > 0 || soloed.size > 0) && (
            <button className="secondaryButton buttonReset" onClick={() => { setMuted(new Set()); setSoloed(new Set()); }}>
              Reset All
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <form className="stemUpload" onSubmit={(e) => { e.preventDefault(); handleUpload(new FormData(e.currentTarget)); }}>
          <input className="fieldInput" name="name" placeholder="Stem name (e.g., Bass Take 2)" required />
          <select className="fieldInput" name="instrument">
            <option value="">Select instrument</option>
            {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <input accept="audio/*" className="fieldInput" name="audio" ref={fileInputRef} required type="file" />
          <button className="primaryButton buttonReset" disabled={uploading} type="submit">
            {uploading ? "Uploading..." : "Upload Stem"}
          </button>
        </form>
      )}
    </article>
  );
}