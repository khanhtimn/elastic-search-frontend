import { useState } from "react";
import { deleteDocument } from "../services/api";
import { Trash2, Database, Loader2, FileText, ChevronDown, ChevronUp, Eye } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import HighlightedText from "./HighlightedText";
import { useModal } from "../contexts/ModalContext";

type ResultTableProps = {
    results: (SearchHit | DocumentHit)[];
    onRefresh: () => void;
    loading?: boolean;
    query?: string;
    total?: number;
};

// Type for search results with highlight
export type SearchHit = {
    _index: string;
    _id: string;
    _score: number;
    _source: Record<string, unknown>;
    highlight?: Record<string, string[]>;
};

// Type for document listing (no score/highlight)
export type DocumentHit = {
    _index: string;
    _id: string;
    _source: Record<string, unknown>;
};

// Type guard to check if hit is a SearchHit
function isSearchHit(hit: SearchHit | DocumentHit): hit is SearchHit {
    return '_score' in hit && hit._score !== null && hit._score !== undefined;
}

export default function ResultTable({ results, onRefresh, loading = false, query = "", total }: ResultTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Use modal context
    const { openDocumentDetail, openExplainModal } = useModal();

    // Find max score for normalization
    const safeResults = Array.isArray(results) ? results : [];
    const maxScore = Math.max(...safeResults.filter(isSearchHit).map(doc => doc._score), 1);

    const handleDelete = async (index: string, id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa tài liệu này không?")) {
            try {
                setDeletingId(`${index}-${id}`);
                await deleteDocument(index, id);
                onRefresh();
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Xóa tài liệu thất bại");
            } finally {
                setDeletingId(null);
            }
        }
    };

    const toggleRowExpand = (docKey: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docKey)) {
                newSet.delete(docKey);
            } else {
                newSet.add(docKey);
            }
            return newSet;
        });
    };

    // Handle explain click - only for SearchHit
    const handleExplainClick = (doc: SearchHit | DocumentHit) => {
        if (isSearchHit(doc) && query) {
            openExplainModal(doc, query);
        }
    };

    // Render highlighted content or fallback to source
    const renderHighlightedContent = (doc: SearchHit | DocumentHit) => {
        if (!isSearchHit(doc) || !doc.highlight || Object.keys(doc.highlight).length === 0) {
            return (
                <pre className="whitespace-pre-wrap break-words text-slate-600">
                    {JSON.stringify(doc._source, null, 2)}
                </pre>
            );
        }

        return (
            <div className="space-y-3">
                {Object.entries(doc.highlight).map(([field, fragments]) => (
                    <div key={field} className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide block mb-1.5">
                            {field}
                        </span>
                        <div className="space-y-1.5">
                            {fragments.map((fragment: string, idx: number) => (
                                <div key={idx} className="text-sm text-slate-700 leading-relaxed">
                                    <HighlightedText text={`...${fragment}...`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải kết quả...</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Database className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-slate-500 max-w-sm">Không tìm thấy tài liệu nào khớp với câu truy vấn. Hãy thử từ khóa khác.</p>
            </div>
        );
    }

    return (
        <>
            <div className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Table Header */}
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary-500" />
                        Kết quả tìm kiếm
                        <span className="bg-primary-100 text-primary-700 text-xs py-0.5 px-2 rounded-full ml-2">
                            {total !== undefined ? total : results.length}
                        </span>
                    </h3>
                    {query && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            Từ khóa: "{query}"
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                                <th className="px-6 py-4 font-medium">Điểm xếp hạng</th>
                                <th className="px-6 py-4 font-medium">Index</th>
                                <th className="px-6 py-4 font-medium">ID Tài liệu</th>
                                <th className="px-6 py-4 font-medium">Trích đoạn nổi bật</th>
                                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {results.map((doc) => {
                                const docKey = `${doc._index}-${doc._id}`;
                                const isDeleting = deletingId === docKey;
                                const isExpanded = expandedRows.has(docKey);
                                const hasHighlight = isSearchHit(doc) && doc.highlight && Object.keys(doc.highlight).length > 0;

                                return (
                                    <tr
                                        key={docKey}
                                        className="group hover:bg-slate-50/80 transition-colors duration-200"
                                    >
                                        {/* Score */}
                                        <td className="px-6 py-4 align-top">
                                            {isSearchHit(doc) ? (
                                                <ScoreBadge
                                                    score={doc._score}
                                                    maxScore={maxScore}
                                                    onExplainClick={query ? () => handleExplainClick(doc) : undefined}
                                                />
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">N/A</span>
                                            )}
                                        </td>

                                        {/* Index */}
                                        <td className="px-6 py-4 align-top">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {doc._index}
                                            </span>
                                        </td>

                                        {/* ID */}
                                        <td className="px-6 py-4 align-top">
                                            <button
                                                onClick={() => openDocumentDetail(doc)}
                                                className="flex items-center gap-2 group/id cursor-pointer hover:bg-slate-50 px-2 py-1 -mx-2 -my-1 rounded-lg transition-colors"
                                            >
                                                <span className="font-mono text-sm text-primary-600 hover:text-primary-700 truncate max-w-[120px] underline underline-offset-2" title={doc._id}>
                                                    {doc._id}
                                                </span>
                                                <Eye className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                            </button>
                                        </td>

                                        {/* Content / Highlight */}
                                        <td className="px-6 py-4 align-top">
                                            <div className="relative group/content">
                                                <div className={`w-full min-w-[300px] text-sm font-mono bg-slate-50 rounded-lg p-3 border border-slate-100 group-hover/content:border-slate-200 transition-colors ${isExpanded ? '' : 'max-h-32 overflow-hidden'}`}>
                                                    {renderHighlightedContent(doc)}
                                                </div>

                                                {/* Expand/Collapse toggle */}
                                                <button
                                                    onClick={() => toggleRowExpand(docKey)}
                                                    className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-white text-xs text-slate-500 hover:text-primary-600 rounded-md border border-slate-200 shadow-sm transition-all"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="w-3 h-3" />
                                                            Thu gọn
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-3 h-3" />
                                                            Xem thêm
                                                        </>
                                                    )}
                                                </button>

                                                {/* Highlight indicator */}
                                                {hasHighlight && (
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                                        <FileText className="w-3 h-3" />
                                                        Highlighted
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 align-top text-right">
                                            <button
                                                onClick={() => handleDelete(doc._index, doc._id)}
                                                disabled={isDeleting}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                title="Xóa tài liệu"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                    <span>
                        {results.filter(isSearchHit).length > 0 && (
                            <>Điểm cao nhất: <strong className="text-primary-600">{maxScore.toFixed(2)}</strong></>
                        )}
                    </span>
                    <span>Hiển thị {results.length} kết quả</span>
                </div>
            </div>
        </>
    );
}