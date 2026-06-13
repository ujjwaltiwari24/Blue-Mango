// components/anonymous-chat/AmbientBackground.tsx
"use client";

export default function AmbientBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "#060810",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(37,99,235,0.14) 0%,transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: -160,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: "35%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(192,108,132,0.09) 0%,transparent 70%)",
        }}
      />
    </div>
  );
}