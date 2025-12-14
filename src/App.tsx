import { useState } from "react";
import Header from "./components/Header";
import SearchPage from "./pages/SearchPage";
import IndicesPage from "./pages/IndicesPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("search");

  let pageContent;
  switch (activeTab) {
    case "search":
      pageContent = <SearchPage />;
      break;
    case "indices":
      pageContent = <IndicesPage />;
      break;
    case "upload":
      pageContent = <UploadPage />;
      break;
    default:
      pageContent = <SearchPage />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {pageContent}
      </main>
    </div>
  );
}
