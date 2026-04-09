import React from "react";
import { createRoot } from "react-dom/client";
import CSCBilling from "./csc_billing.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CSCBilling />
  </React.StrictMode>
);
