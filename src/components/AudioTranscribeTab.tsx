import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth, db, collection, addDoc, serverTimestamp } from '../services/firebase';

export function AudioTranscribeTab() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentUser = auth.currentUser;

  const startRecording = async () => {
    setError(null);
    setTranscript(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err: any) {
      setError(`Microphone access error: ${err.message || 'Permission denied'}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string)?.split(',')[1];
        if (!base64Data) {
          throw new Error('Failed to encode recorded audio');
        }

        const response = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: 'audio/webm'
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Transcription failed');

        const resultText = data.text || 'No transcription generated.';
        setTranscript(resultText);

        // Save to Firestore if authenticated
        if (currentUser) {
          await addDoc(collection(db, `users/${currentUser.uid}/transcripts`), {
            transcript: resultText,
            timestamp: serverTimestamp()
          });
        }
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] text-white p-6 overflow-y-auto font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Mic className="text-cyan-400" size={22} />
            Voice Note & Audio Transcription (Gemini 3.5 Transcribe)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Record voice notes, field inspections, or water control commands for instant AI transcription.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recorder Box */}
        <div className="bg-[#12131A] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 relative ${recording ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' : 'bg-cyan-500/10 border border-cyan-500/30'}`}>
            <Mic size={40} className={recording ? 'text-red-400' : 'text-cyan-400'} />
            {recording && (
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75"></div>
            )}
          </div>

          <h3 className="text-base font-semibold mb-1">
            {recording ? 'Recording Voice Note...' : audioBlob ? 'Recording Ready for Transcription' : 'Tap to Start Recording'}
          </h3>
          <p className="text-xs text-gray-400 mb-6 max-w-sm">
            {recording ? 'Speak clearly into your microphone regarding water turbidity, filtration valve status, or sensor notes.' : 'Record your voice and translate it into actionable technical logs instantly.'}
          </p>

          <div className="flex items-center gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                <Mic size={16} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <Square size={16} />
                <span>Stop Recording</span>
              </button>
            )}

            {audioUrl && !recording && (
              <button
                onClick={() => {
                  const audio = new Audio(audioUrl);
                  audio.play();
                }}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Play size={16} />
                <span>Playback</span>
              </button>
            )}
          </div>

          {audioBlob && !recording && (
            <button
              onClick={handleTranscribe}
              disabled={loading}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Transcribe with gemini-3.5-transcribe</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Transcript Output Box */}
        <div className="bg-[#12131A] border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider pb-3 border-b border-white/10 mb-4">
            <FileText size={15} />
            <span>Transcription Result</span>
          </div>

          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Processing audio via gemini-3.5-transcribe...</p>
              </div>
            )}

            {!loading && !transcript && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <FileText size={32} className="opacity-30 mb-2" />
                <p className="text-sm font-medium">No audio transcribed yet.</p>
                <p className="text-xs">Record audio and click transcribe to see the generated text here.</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!loading && transcript && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  <span>Transcription Successful</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {transcript}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
