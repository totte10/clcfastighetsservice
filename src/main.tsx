import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element "#root" was not found.');
  document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1220;color:#fff;font-family:system-ui,sans-serif;padding:24px;text-align:center;">Appen kunde inte starta eftersom root-elementet saknas.</div>';
} else {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
