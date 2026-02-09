// import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
// import { AuthProvider } from "./authContext";
import { BlocklistProvider } from "./context/blocklistContext.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <BlocklistProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </BlocklistProvider>,
);
