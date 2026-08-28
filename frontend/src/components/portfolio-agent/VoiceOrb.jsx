import React, { useEffect, useRef, useState } from "react";
import { useConversationControls } from "@elevenlabs/react";

/**
 * Large soft lavender→coral orb used in voice-mode. Reads live
 * output/input frequency data through the SDK to breathe with the
 * audio stream.
 */
export const VoiceOrb = ({ isSpeaking }) => {
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
      } catch (e) { /* silent */ }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSpeaking, getOutputByteFrequencyData, getInputByteFrequencyData]);

  const scale = 1 + level * 0.22;
  const glow = 30 + level * 60;

  return (
    <div
      data-testid="pinky-voice-orb"
      className="relative flex items-center justify-center w-full h-full"
    >
      {/* Soft halo */}
      <div
        className="absolute rounded-full blur-3xl pinky-brand-gradient-soft transition-opacity duration-300"
        style={{ width: 320, height: 320, opacity: 0.55 + level * 0.35 }}
      />
      {/* Main orb */}
      <div
        className="rounded-full transition-transform duration-100 pinky-brand-gradient-soft"
        style={{
          width: 220,
          height: 220,
          transform: `scale(${scale})`,
          boxShadow: `0 0 ${glow}px rgba(182,167,225,0.45), inset 0 0 60px rgba(255,255,255,0.35)`,
          filter: "blur(1px)",
        }}
      />
    </div>
  );
};
