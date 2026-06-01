import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export function useQrScanner({
    onScan,
    enabled = true,
    elementId,
    cooldownMs = 3000,
}: {
    onScan: (code: string) => void;
    enabled?: boolean;
    elementId: string;
    cooldownMs?: number;
}) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string>("");

    const handleScan = useCallback(
        (code: string) => {
            if (code === lastScannedRef.current) return;
            lastScannedRef.current = code;
            onScan(code);
            setTimeout(() => {
                lastScannedRef.current = "";
            }, cooldownMs);
        },
        [onScan, cooldownMs]
    );

    useEffect(() => {
        if (!enabled) return;

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 230, height: 230 } },
                (decodedText) => handleScan(decodedText),
                () => {}
            )
            .catch((err) => {
                setError(err?.message || "Camera failed to start");
            });

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(() => {});
            }
        };
    }, [enabled, elementId, handleScan]);

    return { isScanning, setIsScanning, error };
}
