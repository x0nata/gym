import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
      return;
    }

    const container = document.getElementById(elementId);
    if (!container) {
      setError("Scanner container not found");
      return;
    }

    const scanner = new Html5Qrcode(elementId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    scannerRef.current = scanner;
    setError(null);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 15 },
        (decodedText) => {
          console.log("[QR] Scanned:", decodedText);
          onScanRef.current(decodedText);
        },
        (errorMessage) => {
          // Called on every frame without a QR code — ignore
          // console.debug("[QR] no code:", errorMessage);
        }
      )
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[QR] Camera start failed:", message);
        setError(message || "Camera failed to start");
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [enabled, elementId]);

  return { error };
}
