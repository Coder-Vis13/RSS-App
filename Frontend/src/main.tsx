import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./app.tsx";
import { BlocklistProvider } from "./context/blocklistContext.tsx";

createRoot(document.getElementById("root")!).render(
  <BlocklistProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </BlocklistProvider>,
);
