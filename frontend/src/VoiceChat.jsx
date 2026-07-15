import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// We share the same socket connection
const socket = io('http://localhost:3001');

export default function VoiceChat() {
  const [micEnabled, setMicEnabled] = useState(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Basic AI Voice Moderation Simulation
    const checkFoulLanguage = (text) => {
      const badWords = ['badword1', 'badword2', 'toxic', 'hate'];
      const hasBadWord = badWords.some(w => text.toLowerCase().includes(w));
      if (hasBadWord) {
        alert("AI MODERATION WARNING: Foul language detected. You have been banned for 3 days.");
        window.location.reload(); // Simulate kick/ban
      }
    };

    // Initialize Web Speech API for AI Moderation if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        checkFoulLanguage(transcript);
      };
    }

    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setMicEnabled(true);
        if (recognition) recognition.start();
        
        // Notify others we are ready to receive calls
        socket.emit('readyToTalk');
      } catch (err) {
        console.error("Mic access denied or unavailable", err);
      }
    };

    initMic();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognition) recognition.stop();
    };
  }, []);

  return (
    <div className="absolute bottom-4 left-4 p-4 bg-black/50 rounded-lg text-white font-mono backdrop-blur-sm z-10 flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${micEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <span>{micEnabled ? 'Voice Chat: LIVE' : 'Voice Chat: Muted'}</span>
      {micEnabled && <span className="text-xs text-yellow-400 ml-2">AI Moderation Active</span>}
    </div>
  );
}
