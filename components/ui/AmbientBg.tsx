"use client";

export default function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#060810]" />

      <div
        className="absolute -top-32 -left-32 h-[350px] w-[350px] rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle, #F4A261 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute top-1/3 -right-32 h-[300px] w-[300px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle, #6C63FF 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute -bottom-24 left-1/3 h-[250px] w-[250px] rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(circle, #FF6B6B 0%, transparent 70%)",
        }}
      />
    </div>
  );
}