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
  const [active, setActive] = useState(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const scannerRef = useRef<QrScanner | null>(null);
  const lastScanRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      const container = document.getElementById(elementId);
      if (container) container.innerHTML = "";
      setError(null);
      setActive(false);
      return;
    }

    setError(null);
    setActive(false);
    let attempts = 0;
    let rafId = 0;

    const trySetup = () => {
      const container = document.getElementById(elementId);
      if (!container) {
        if (attempts++ < 60) {
          rafId = requestAnimationFrame(trySetup);
        } else {
          setError("Scanner not found");
        }
        return;
      }

      const video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.muted = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.display = "block";
      container.innerHTML = "";
      container.appendChild(video);

      const scanner = new QrScanner(
        video,
        (result) => {
          const now = Date.now();
          if (now - lastScanRef.current < 1000) return;
          lastScanRef.current = now;
          setActive(false);
          onScanRef.current(result.data);
        },
        {
          returnDetailedScanResult: true,
          alsoTryWithoutScanRegion: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 15,
        },
      );

      scanner.start().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Camera failed to start");
        setActive(false);
      });

      setActive(true);
      scannerRef.current = scanner;
    };

    rafId = requestAnimationFrame(trySetup);

    return () => {
      cancelAnimationFrame(rafId);
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setActive(false);
    };
  }, [enabled, elementId]);

  return { error, active };
}
