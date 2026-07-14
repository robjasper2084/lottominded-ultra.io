import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LottoMindNewsPage } from "./pages/LottoMindNewsPage";
import "./styles/news.css";

document.body.classList.add("home-page", "has-sphere-header", "has-global-sphere-header");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LottoMindNewsPage />
  </StrictMode>,
);
