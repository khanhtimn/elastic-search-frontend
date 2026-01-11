import { X, Loader2, FileQuestion, TrendingUp, Hash, Calculator, ChevronRight } from "lucide-react";

type ExplanationNode = {
    value: number;
    description: string;
    details?: ExplanationNode[];
};

type ExplainModalProps = {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    explanation: ExplanationNode | null;
    docId: string;
    query: string;
    score: number;
};

function ExplanationTree({ node, depth = 0 }: { node: ExplanationNode; depth?: number }) {
    const hasDetails = node.details && node.details.length > 0;

    return (
        <div className={`${depth > 0 ? "ml-4 pl-4 border-l-2 border-slate-200" : ""}`}>
            <div className="flex items-start gap-2 py-2 group">
                {hasDetails && (
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            {node.value.toFixed(4)}
                        </span>
                        <span className="text-sm text-slate-600">{node.description}</span>
                    </div>
                </div>
            </div>

            {hasDetails && (
                <div className="space-y-1">
                    {node.details!.map((detail, idx) => (
                        <ExplanationTree key={idx} node={detail} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ExplainModal({
    isOpen,
    onClose,
    loading,
    explanation,
    docId,
    query,
    score
}: ExplainModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Calculator className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Giải thích Cơ chế Xếp hạng</h3>
                            <p className="text-xs text-slate-500">Elasticsearch BM25 Scoring Algorithm</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Meta Info */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-400">Document ID</p>
                            <p className="text-sm font-mono text-slate-700 truncate" title={docId}>{docId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-400">Query</p>
                            <p className="text-sm font-medium text-slate-700 truncate" title={query}>"{query}"</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <div>
                            <p className="text-xs text-slate-400">Final Score</p>
                            <p className="text-sm font-bold text-emerald-600">{score.toFixed(4)}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                            <p className="text-slate-500">Đang phân tích điểm số...</p>
                        </div>
                    ) : explanation ? (
                        <div className="space-y-4">
                            {/* BM25 Explanation */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                                <h4 className="font-semibold text-indigo-800 mb-2">Thuật toán BM25</h4>
                                <p className="text-sm text-indigo-700 leading-relaxed">
                                    Elasticsearch sử dụng thuật toán <strong>BM25 (Best Match 25)</strong> để tính điểm xếp hạng.
                                    Điểm số được tính dựa trên:
                                </p>
                                <ul className="mt-2 text-sm text-indigo-600 space-y-1 ml-4">
                                    <li>• <strong>TF (Term Frequency)</strong>: Tần suất xuất hiện của từ khóa trong document</li>
                                    <li>• <strong>IDF (Inverse Document Frequency)</strong>: Độ hiếm của từ khóa trong toàn bộ index</li>
                                    <li>• <strong>Field Length</strong>: Độ dài của field (field ngắn hơn được ưu tiên)</li>
                                    <li>• <strong>Field Boost</strong>: Trọng số của từng field</li>
                                </ul>
                            </div>

                            {/* Explanation Tree */}
                            <div className="border border-slate-200 rounded-2xl p-4">
                                <h4 className="font-semibold text-slate-800 mb-3">🔍 Chi tiết tính điểm</h4>
                                <ExplanationTree node={explanation} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileQuestion className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-500">Không thể lấy thông tin giải thích</p>
                            <p className="text-sm text-slate-400 mt-1">Vui lòng thử lại sau</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
