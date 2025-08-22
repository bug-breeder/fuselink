import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/error-boundary";
import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import PairingPage from "@/pages/pairing";
import { initializeDevice } from "@/crypto/device";
import { useDeviceStore } from "@/state/deviceStore";

function App() {
  const setCurrentDevice = useDeviceStore((state) => state.setCurrentDevice);

  useEffect(() => {
    // Initialize device on app startup
    initializeDevice()
      .then((device) => {
        setCurrentDevice(device);
      })
      .catch((error) => {
        console.error("Failed to initialize device:", error);
      });
  }, [setCurrentDevice]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<PairingPage />} path="/pairing" />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
