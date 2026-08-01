import { useEffect, useState } from "react";

function isBrowserOnline(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean" ? navigator.onLine : true;
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(isBrowserOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function isOnline(): boolean {
  return isBrowserOnline();
}
