import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./store";
import { LangProvider } from "./i18n";
import App from "./App";
import { startMonitoring } from "./lib/monitor";
import "./styles.css";

startMonitoring();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);