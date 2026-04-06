import { createRoot } from "react-dom/client";
import { SchemaProvider } from "./context/SchemaContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <SchemaProvider>
    <App />
  </SchemaProvider>
);
