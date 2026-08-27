import React, { useEffect, useRef, useState } from "react";
import { useConversationControls } from "@elevenlabs/react";

/**
 * Large coral/pink gradient orb used in the voice-mode view.
 * Pulses on speaking state and reads live output-frequency data when
 * available.
 */
export const VoiceOrb = ({ isSpeaking, isListening }) => {
  const { getOutputByteFrequencyData, getInputByteFrequencyData } =
    useConversationControls();
  const [level, setLevel] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      try {
        const data = isSpeaking
          ? getOutputByteFrequencyData && getOutputByteFrequencyData()
          : getInputByteFrequencyData && getInputByteFrequencyData();
        if (data && data.length) {
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;
          if (mounted) setLevel(avg);
        }
      } catch (e) {
        /* silent */
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSpeaking, getOutputByteFrequencyData, getInputByteFrequencyData]);

  const scale = 1 + level * 0.25;
  const glow = 20 + level * 60;

  return (
    <div
      data-testid="pinky-voice-orb"
      className="relative flex items-center justify-center w-full h-full"
    >
      <div
        className="absolute rounded-full bg-coral-100 blur-3xl transition-opacity duration-300"
        style={{
          width: 320,
          height: 320,
          opacity: 0.6 + level * 0.4,
        }}
      />
      <div
        className="rounded-full transition-transform duration-100"
        style={{
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle at 40% 40%, #FFC5C0 0%, #FF8A8A 45%, #FF6B6B 100%)",
          transform: `scale(${scale})`,
          boxShadow: `0 0 ${glow}px rgba(255,107,107,0.55)`,
        }}
      />
    </div>
  );
};
