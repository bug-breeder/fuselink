import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import PairingPage from "@/pages/pairing";

function App() {
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
