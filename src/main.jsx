// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import axios from "axios";

import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/ledger/400.css";

import App from "./App";

// axios global
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={clientId}>
          <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
