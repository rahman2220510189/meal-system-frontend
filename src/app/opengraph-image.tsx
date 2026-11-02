import { ImageResponse } from "next/og";

export const alt = "Meal System — mess meal & bazar accounts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Text is English: the OG renderer cannot shape Bangla script.
export default function OgImage() {
  const plates = Array.from({ length: 14 }, (_, i) => i % 5 !== 3);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f1f5f1", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#0e5a47", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 36, background: "#e3a414", border: "6px solid #f1f5f1" }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#15211d" }}>Meal System</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 76, fontWeight: 800, color: "#15211d", lineHeight: 1.05, maxWidth: 820 }}>Your mess accounts, in one ledger.</div>
            <div style={{ fontSize: 30, color: "#4a5a54", maxWidth: 820 }}>Meals, bazar, meal rate, dues and pluses — calculated for you.</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {plates.map((on, i) => (
              <div
                key={i}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 54,
                  background: on ? "#e3a414" : "#ffffff",
                  border: on ? "4px solid #fbefcc" : "3px dashed #d4ded7",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
