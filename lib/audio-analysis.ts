"use client";

export interface AudioAnalysis {
  durationSeconds: number;
  bpm?: number;
  key?: string;
  sampleRate: number;
  channels: number;
}

function detectKey(audioBuffer: AudioBuffer): string | undefined {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const samples = Math.min(channelData.length, sampleRate * 30);
  
  const fftSize = 4096;
  const rootMeanSquare = Math.sqrt(channelData.slice(0, samples).reduce((sum, v) => sum + v * v, 0) / samples);
  
  if (rootMeanSquare < 0.01) return undefined;
  
  const chroma = new Array(12).fill(0);
  
  for (let i = 0; i < 12; i++) {
    let energy = 0;
    const noteFreq = 440 * Math.pow(2, (i - 9) / 12);
    const binIndex = Math.round(noteFreq * fftSize / sampleRate);
    
    for (let j = 0; j < fftSize && binIndex + j < samples; j++) {
      energy += channelData[binIndex + j] ** 2;
    }
    chroma[i] = energy;
  }
  
  const maxChroma = Math.max(...chroma);
  const keyIndex = chroma.indexOf(maxChroma);
  
  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return keys[keyIndex];
}

function detectBpm(audioBuffer: AudioBuffer): number | undefined {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const samples = Math.min(channelData.length, sampleRate * 60);
  
  const threshold = 0.1;
  const onsetSamples: number[] = [];
  
  let prevVal = 0;
  for (let i = 0; i < samples; i++) {
    const absVal = Math.abs(channelData[i]);
    if (absVal > threshold && prevVal <= threshold) {
      onsetSamples.push(i);
    }
    prevVal = absVal;
  }
  
  if (onsetSamples.length < 4) return undefined;
  
  const intervals: number[] = [];
  for (let i = 1; i < onsetSamples.length; i++) {
    const interval = (onsetSamples[i] - onsetSamples[i - 1]) / sampleRate;
    if (interval > 0.2 && interval < 2) {
      intervals.push(interval);
    }
  }
  
  if (intervals.length === 0) return undefined;
  
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  const bpm = Math.round(60 / medianInterval);
  
  if (bpm < 60 || bpm > 200) return undefined;
  
  return bpm;
}

export async function analyzeAudioFile(file: File): Promise<AudioAnalysis> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    
    return {
      durationSeconds: Math.round(audioBuffer.duration),
      bpm: detectBpm(audioBuffer),
      key: detectKey(audioBuffer),
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels
    };
  } finally {
    await audioContext.close();
  }
}