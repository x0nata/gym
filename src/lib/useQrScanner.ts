import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

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

    // Create or reuse video element
    let video = container.querySelector("video") as HTMLVideoElement | null;
    if (!video) {
      video = document.createElement("video");
      video.setAttribute("playsinline", "true");
      video.setAttribute("autoplay", "true");
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.display = "block";
      container.appendChild(video);
    }

    const codeReader = new BrowserQRCodeReader();
    setError(null);
    let active = true;
    let controlsRef: { stop: () => void } | null = null;

    codeReader
      .decodeFromVideoDevice(undefined, video, (result, err, controls) => {
        if (!active) {
          controls.stop();
          return;
        }
        if (result) {
          const text = result.getText();
          console.log("[ZXing] QR detected:", text);
          onScanRef.current(text);
        }
        if (err && err.name !== "NotFoundException") {
          console.debug("[ZXing] decode error:", err.name);
        }
        controlsRef = controls;
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ZXing] Camera start failed:", message);
        setError(message || "Camera failed to start");
      });

    return () => {
      active = false;
      if (controlsRef) {
        controlsRef.stop();
      }
      // Remove video element to clean up
      if (video && video.parentNode === container) {
        container.removeChild(video);
      }
    };
  }, [enabled, elementId]);

  return { error };
}
