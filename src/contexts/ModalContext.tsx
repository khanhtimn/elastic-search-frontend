import { createContext, useContext, useState, ReactNode } from "react";
import { searchWithExplanation } from "../services/api";
import type { SearchHit, DocumentHit } from "../components/ResultTable";

// Explanation node type
type ExplanationNode = {
    value: number;
    description: string;
    details?: ExplanationNode[];
};

// Document for modal
type ModalDocument = {
    _index: string;
    _id: string;
    _score?: number;
    _source: Record<string, unknown>;
};

// Context type
type ModalContextType = {
    // Document Detail Modal
    openDocumentDetail: (doc: SearchHit | DocumentHit) => void;
    closeDocumentDetail: () => void;

    // Explain Modal
    openExplainModal: (doc: SearchHit, query: string) => void;
    closeExplainModal: () => void;

    // States (for modal components)
    documentDetailState: {
        isOpen: boolean;
        document: ModalDocument | null;
    };
    explainState: {
        isOpen: boolean;
        loading: boolean;
        explanation: ExplanationNode | null;
        docId: string;
        query: string;
        score: number;
    };
};

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within ModalProvider");
    }
    return context;
}

type ModalProviderProps = {
    children: ReactNode;
};

export function ModalProvider({ children }: ModalProviderProps) {
    // Document Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<ModalDocument | null>(null);

    // Explain Modal State
    const [explainModalOpen, setExplainModalOpen] = useState(false);
    const [explainLoading, setExplainLoading] = useState(false);
    const [currentExplanation, setCurrentExplanation] = useState<ExplanationNode | null>(null);
    const [explainDocId, setExplainDocId] = useState("");
    const [explainQuery, setExplainQuery] = useState("");
    const [explainScore, setExplainScore] = useState(0);

    // Open Document Detail
    const openDocumentDetail = (doc: SearchHit | DocumentHit) => {
        setSelectedDocument({
            _index: doc._index,
            _id: doc._id,
            _score: '_score' in doc ? doc._score : undefined,
            _source: doc._source,
        });
        setDetailModalOpen(true);
    };

    // Close Document Detail
    const closeDocumentDetail = () => {
        setDetailModalOpen(false);
        setSelectedDocument(null);
    };

    // Open Explain Modal
    const openExplainModal = async (doc: SearchHit, query: string) => {
        setExplainDocId(doc._id);
        setExplainQuery(query);
        setExplainScore(doc._score);
        setExplainModalOpen(true);
        setExplainLoading(true);
        setCurrentExplanation(null);

        try {
            const data = await searchWithExplanation(query, doc._id, doc._index);
            if (data.explanation) {
                setCurrentExplanation(data.explanation);
            }
        } catch (error) {
            console.error("Failed to get explanation:", error);
        } finally {
            setExplainLoading(false);
        }
    };

    // Close Explain Modal
    const closeExplainModal = () => {
        setExplainModalOpen(false);
        setCurrentExplanation(null);
    };

    const value: ModalContextType = {
        openDocumentDetail,
        closeDocumentDetail,
        openExplainModal,
        closeExplainModal,
        documentDetailState: {
            isOpen: detailModalOpen,
            document: selectedDocument,
        },
        explainState: {
            isOpen: explainModalOpen,
            loading: explainLoading,
            explanation: currentExplanation,
            docId: explainDocId,
            query: explainQuery,
            score: explainScore,
        },
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
}
