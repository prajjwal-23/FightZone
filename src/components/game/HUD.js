"use client";

export default function HUD({ p1Health, p2Health, winner, onRestart, onToggleBgm, bgmMuted }) {
  return (
    <div style={{ pointerEvents: "none" }}>
      {/* Health bars */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "system-ui, sans-serif",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#2b2b2b",
            height: 22,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: `${p1Health}%`,
              height: "100%",
              background: "#e74c3c",
              borderRadius: 6,
              transition: "width 120ms",
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            background: "#2b2b2b",
            height: 22,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: `${p2Health}%`,
              height: "100%",
              background: "#27ae60",
              borderRadius: 6,
              transition: "width 120ms",
            }}
          />
        </div>
      </div>

      {/* Winner overlay */}
      {winner && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              background: "rgba(20,20,20,0.9)",
              color: "white",
              padding: "24px 32px",
              borderRadius: 12,
              textAlign: "center",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 16 }}>{winner}</div>
            <button
              onClick={onRestart}
              style={{
                cursor: "pointer",
                background: "white",
                color: "black",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 600,
              }}
            >
              Restart
            </button>
          </div>
        </div>
      )}
      {/* ✅ BGM Toggle Button */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 20,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={onToggleBgm}
          style={{
            background: "black",
            color: "white",
            border: "1px solid white",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          {bgmMuted ? "Unmute BGM" : "Mute BGM"}
        </button>
      </div>
    </div>
  );
}
