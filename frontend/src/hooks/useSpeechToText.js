import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser-native speech-to-text via the Web Speech API. Used by the
 * mic button in the ChatInput: while active, the user's spoken words
 * are appended to the text input. The visitor still has to press Send
 * to actually dispatch the message.
 *
 * onResult(transcript) is called with the incremental / final
 * transcript whenever recognition emits.
 */
export function useSpeechToText({ onResult, onError }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setIsSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      const combined = [baseTextRef.current, final, interim]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (final) baseTextRef.current = [baseTextRef.current, final]
        .filter(Boolean)
        .join(" ")
        .trim();
      onResult && onResult(combined);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      setIsListening(false);
      onError && onError(e);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    };
  }, [onResult, onError]);

  const start = useCallback((initialText = "") => {
    if (!recognitionRef.current) return;
    baseTextRef.current = initialText.trim();
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      onError && onError(e);
    }
  }, [onError]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    setIsListening(false);
  }, []);

  const toggle = useCallback((initialText = "") => {
    if (isListening) stop();
    else start(initialText);
  }, [isListening, start, stop]);

  return { isListening, isSupported, start, stop, toggle };
}
