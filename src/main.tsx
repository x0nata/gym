import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./lib/useTheme";
import { AuthProvider } from "./lib/useAuth";
import App from "./App";
import { AppErrorBoundary } from "./components/feedback/AppErrorBoundary";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <ThemeProvider>
          <AppErrorBoundary>
            <AuthProvider>
              <App />
            </AuthProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>
);
