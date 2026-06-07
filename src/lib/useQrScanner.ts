import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export function useQrScanner({
  onScan,
  enabled = false,
  containerId,
  cooldownMs = 3000,
  fps = 15,
}: {
  onScan: (code: string) => void;
  enabled?: boolean;
  containerId: string;
  cooldownMs?: number;
  fps?: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScannedRef = useRef("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return;
    }

    setError(null);

    const container = document.getElementById(containerId);
    if (!container) {
      setError("Scanner container not found");
      return;
    }

    container.innerHTML = "";

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    container.appendChild(video);
    videoRef.current = video;

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const interval = fps > 0 ? 1000 / fps : 100;
    let started = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        started = true;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setError("Canvas context unavailable");
          return;
        }

        intervalRef.current = setInterval(() => {
          if (video.readyState < video.HAVE_ENOUGH_DATA) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data !== lastScannedRef.current) {
            lastScannedRef.current = code.data;
            onScanRef.current(code.data);
            setTimeout(() => {
              lastScannedRef.current = "";
            }, cooldownMs);
          }
        }, interval);
      } catch (err: unknown) {
        if (!started) {
          if (err instanceof DOMException) {
            if (err.name === "NotAllowedError") {
              setError("Camera permission denied. Please allow camera access in your browser settings and try again.");
            } else if (err.name === "NotFoundError") {
              setError("No camera found on this device.");
            } else if (err.name === "NotReadableError") {
              setError("Camera is already in use by another application.");
            } else {
              setError(`Camera error: ${err.message}`);
            }
          } else {
            setError("Failed to access camera. Please try again.");
          }
        }
      }
    };

    startCamera();

    return () => {
      stopCamera();
      canvas.remove();
      container.innerHTML = "";
    };
  }, [enabled, containerId, fps, cooldownMs]);

  return { error, stopCamera };
}
