import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

export function useQrScanner({
  elementId,
  onScan,
  enabled,
}: {
  elementId: string;
  onScan: (code: string) => void;
  enabled: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) {
      setError(null);
      return;
    }

    const container = document.getElementById(elementId);
    if (!container) {
      setError("Scanner container not found");
      return;
    }

    const video = document.createElement("video");
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.display = "block";
    container.innerHTML = "";
    container.appendChild(video);

    let active = true;

    const scanner = new QrScanner(
      video,
      (result) => {
        if (!active) return;
        console.log("[QR] Detected:", result.data);
        onScanRef.current(result.data);
      },
      {
        returnDetailedScanResult: true,
        onDecodeError: (err) => {
          if (err !== QrScanner.NO_QR_CODE_FOUND) {
            console.log("[QR] Error:", err);
          }
        },
        preferredCamera: "environment",
        maxScansPerSecond: 25,
        highlightScanRegion: true,
      }
    );

    setError(null);

    scanner.start().catch((err: unknown) => {
      if (!active) return;
      const message = err instanceof Error ? err.message : String(err);
      console.error("[QR] Camera start failed:", message);
      setError(message || "Camera failed to start");
    });

    return () => {
      active = false;
      scanner.stop();
      scanner.destroy();
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    };
  }, [enabled, elementId]);

  return { error };
}
