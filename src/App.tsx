import { useState } from "react";
import Header from "./components/Header";
import SearchPage from "./pages/SearchPage";
import IndicesPage from "./pages/IndicesPage";
import UploadPage from "./pages/UploadPage";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import ExplainModal from "./components/ExplainModal";
import DocumentDetailModal from "./components/DocumentDetailModal";

// Component that renders modals using context
function ModalRenderer() {
  const { documentDetailState, explainState, closeDocumentDetail, closeExplainModal } = useModal();

  return (
    <>
      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={documentDetailState.isOpen}
        onClose={closeDocumentDetail}
        document={documentDetailState.document}
      />

      {/* Explain Modal */}
      <ExplainModal
        isOpen={explainState.isOpen}
        onClose={closeExplainModal}
        loading={explainState.loading}
        explanation={explainState.explanation}
        docId={explainState.docId}
        query={explainState.query}
        score={explainState.score}
      />
    </>
  );
}

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
    <ModalProvider>
      <div className="min-h-screen flex flex-col font-sans">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {pageContent}
        </main>
      </div>

      {/* Global Modals */}
      <ModalRenderer />
    </ModalProvider>
  );
}
