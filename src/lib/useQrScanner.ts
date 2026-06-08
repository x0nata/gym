import { useEffect, useRef, useState, useCallback } from "react";
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
  const [capturing, setCapturing] = useState(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<Worker | BarcodeDetector | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setupActiveRef = useRef(false);

  useEffect(() => {
    QrScanner.createQrEngine()
      .then((engine) => {
        engineRef.current = engine;
        // engine ready
      })
      .catch(() => { /* engine creation failure handled silently */ });
    return () => {
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setupActiveRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const container = document.getElementById(elementId);
      if (container) container.innerHTML = "";
      setError(null);
      setCapturing(false);
      return;
    }

    setupActiveRef.current = true;
    setError(null);
    let attempts = 0;
    let rafId = 0;
    let streamActive = false;

    const trySetup = () => {
      if (!setupActiveRef.current) return;

      const container = document.getElementById(elementId);
      if (!container) {
        if (attempts++ < 60) {
          rafId = requestAnimationFrame(trySetup);
        } else {
          setError("Scanner not found");
        }
        return;
      }

      streamActive = true;
      const video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.muted = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.display = "block";
      videoRef.current = video;
      container.innerHTML = "";
      container.appendChild(video);

      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        .then((stream) => {
          if (!setupActiveRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          video.srcObject = stream;
          return video.play();
        })
        .then(() => {
          if (setupActiveRef.current) { setError(null); }
        })
        .catch((err: unknown) => {
          if (!setupActiveRef.current) return;
          const message = err instanceof Error ? err.message : String(err);

          setError(message || "Camera failed to start");
        });
    };

    rafId = requestAnimationFrame(trySetup);

    return () => {
      setupActiveRef.current = false;
      cancelAnimationFrame(rafId);
      if (streamRef.current && streamActive) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      videoRef.current = null;
    };
  }, [enabled, elementId]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError("Camera not ready. Wait a moment.");
      return;
    }
    const engine = engineRef.current;
    if (!engine) {
      setError("Scanner not ready. Try again.");
      return;
    }

    setError(null);
    setCapturing(true);

    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = await QrScanner.scanImage(canvas, {
        returnDetailedScanResult: true,
        qrEngine: engine,
        alsoTryWithoutScanRegion: true,
      });
      onScanRef.current(result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("No QR code")) {
        setError("No QR code found. Move closer and try again.");
      } else {
        setError("Scan failed. Try again.");
      }
    } finally {
      setCapturing(false);
    }
  }, []);

  return { error, capture, capturing };
}
