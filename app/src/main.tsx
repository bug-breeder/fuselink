import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import { initializeDevice } from "./crypto/device.ts";
import { useDeviceStore } from "./state/deviceStore.ts";
import "@/styles/globals.css";

// Initialize device on app startup
initializeDevice().then((device) => {
  useDeviceStore.getState().setCurrentDevice(device);
}).catch((error) => {
  console.error('Failed to initialize device:', error);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
