"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function useSpeechRecognition(
  onResult: (texto: string) => void
) {
  const recognitionRef = useRef<any>(null);

  const [gravando, setGravando] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setGravando(true);
    };

    recognition.onend = () => {
      setGravando(false);
    };

    recognition.onresult = (event: any) => {
      let texto = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        texto += event.results[i][0].transcript;
      }

      onResult(texto);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  function iniciar() {
    recognitionRef.current?.start();
  }

  function parar() {
    recognitionRef.current?.stop();
  }

  return {
    iniciar,
    parar,
    gravando,
  };
}