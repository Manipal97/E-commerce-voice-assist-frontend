import React, { useState, useEffect, useRef } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export function VoiceButton({ onResult, language = "en-IN" }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    recognitionRef.current = recognition;
  }, [language, onResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <p className="text-red-500 text-sm">
        Voice recognition not supported in this browser.
      </p>
    );
  }

  return (
    <button
      onClick={toggleListening}
      className={`m-2 px-3 py-2 rounded-full font-semibold transition-all duration-300 ${
        isListening
          ? "bg-red-500 animate-pulse text-white"
          : "bg-blue-500 hover:bg-blue-700 text-white"
      }`}
    >
      {isListening ? "Listening..." : "🎤"}
    </button>
  );
}
