import { X, Loader2, FileQuestion, TrendingUp, Hash, Calculator, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

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
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const hasDetails = node.details && node.details.length > 0;

    return (
        <div className={`${depth > 0 ? "ml-4 pl-4 border-l-2 border-slate-200" : ""}`}>
            <div
                className={`flex items-start gap-2 py-2 group ${hasDetails ? 'cursor-pointer hover:bg-slate-50 rounded-lg -ml-2 pl-2' : ''}`}
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                {hasDetails && (
                    isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                )}
                {!hasDetails && <div className="w-4" />}
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            {node.value.toFixed(4)}
                        </span>
                        <span className="text-sm text-slate-600">{node.description}</span>
                    </div>
                </div>
            </div>

            {hasDetails && isExpanded && (
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
                            <h3 className="text-lg font-bold text-slate-800">Giải thích Điểm xếp hạng</h3>
                            <p className="text-xs text-slate-500">Thuật toán BM25 của Elasticsearch</p>
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
                            <p className="text-xs text-slate-400">Mã tài liệu</p>
                            <p className="text-sm font-mono text-slate-700 truncate" title={docId}>{docId.slice(0, 12)}...</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-400">Từ khóa tìm</p>
                            <p className="text-sm font-medium text-slate-700 truncate" title={query}>"{query}"</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <div>
                            <p className="text-xs text-slate-400">Điểm cuối cùng</p>
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
                        <div className="space-y-6">
                            {/* Your Algorithm Explanation */}
                            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-200">
                                <h4 className="font-semibold text-violet-800 mb-3">
                                    Thuật toán tính điểm tìm kiếm
                                </h4>

                                {/* Main Formula */}
                                <div className="bg-white rounded-xl p-4 border border-violet-200 mb-4">
                                    <div className="text-center font-mono">
                                        <div className="text-lg text-slate-700 mb-2 leading-relaxed">
                                            <span className="text-violet-600 font-bold">Điểm tổng</span> = <span className="text-indigo-600">Search_Score</span> + <span className="text-emerald-600">Filter_Score</span>
                                        </div>
                                        <div className="text-sm text-slate-500 space-y-1">
                                            <div><span className="text-indigo-600">Search_Score</span> = ∑ (Exact + Phrase + NoAccent + Fuzzy)</div>
                                            <div><span className="text-emerald-600">Filter_Score</span> = ∑ (Source + Category + Date Range) match? 1 : 0</div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-violet-700 mb-4">
                                    Hệ thống sử dụng truy vấn <strong>bool.must</strong>, kết hợp điểm từ thuật toán tìm kiếm và các bộ lọc được áp dụng.
                                </p>
                            </div>

                            {/* Priority Levels */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary-500" />
                                    Các thành phần Search_Score
                                </h4>

                                {/* Priority 1 - Exact Vietnamese */}
                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                                            <span className="font-semibold text-indigo-700">Match có dấu chính xác</span>
                                        </div>
                                        <span className="font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-bold">boost: 10</span>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 font-mono text-sm mb-2 border border-indigo-100/50">
                                        <span className="text-slate-600">score = BM25 × </span>
                                        <span className="text-indigo-600 font-bold">10</span>
                                        <span className="text-slate-600"> × max(title×5, body×1)</span>
                                    </div>
                                    <p className="text-xs text-indigo-600">
                                        Ưu tiên tìm từ khóa có dấu tiếng Việt chính xác. Sử dụng <strong>best_fields</strong> để lấy điểm từ trường tốt nhất.
                                    </p>
                                </div>

                                {/* Priority 2 - Phrase Match */}
                                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                                            <span className="font-semibold text-rose-700">Phrase Match (Cụm từ)</span>
                                        </div>
                                        <span className="font-mono bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm font-bold">boost: 15</span>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 font-mono text-sm mb-2 border border-rose-100/50">
                                        <span className="text-slate-600">score = BM25 × </span>
                                        <span className="text-rose-600 font-bold">15</span>
                                        <span className="text-slate-600"> × max(title×10, body×2)</span>
                                    </div>
                                    <p className="text-xs text-rose-600 italic">
                                        Match cụm từ liên tiếp (slop=2), trọng số tiêu đề rất cao (x10).
                                    </p>
                                </div>

                                {/* Priority 3 - No Accent */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                                            <span className="font-semibold text-amber-700">Match không dấu</span>
                                        </div>
                                        <span className="font-mono bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm font-bold">boost: 7.5</span>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 font-mono text-sm mb-2 border border-amber-100/50">
                                        <span className="text-slate-600">score = BM25 × </span>
                                        <span className="text-amber-600 font-bold">7.5</span>
                                        <span className="text-slate-600"> × max(title.no_accent×5, body.no_accent×1)</span>
                                    </div>
                                    <p className="text-xs text-amber-600">
                                        Hỗ trợ tìm kiếm khi không gõ dấu. VD: "quân sự" match "quan su".
                                    </p>
                                </div>

                                {/* Priority 4 - Fuzzy */}
                                <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                                            <span className="font-semibold text-slate-700">Fuzzy Match (Gần đúng)</span>
                                        </div>
                                        <span className="font-mono bg-slate-200 text-slate-700 px-2 py-1 rounded text-sm font-bold">boost: 2</span>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 font-mono text-sm mb-2 border border-slate-200/50">
                                        <span className="text-slate-600">score = BM25 × </span>
                                        <span className="text-slate-600 font-bold">2</span>
                                        <span className="text-slate-600"> × max(title×5, body×1)</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Xử lý lỗi gõ phím (fuzziness="AUTO"). Cho phép sai lệch 1-2 ký tự.
                                    </p>
                                </div>
                            </div>

                            {/* BM25 Base Formula */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                                <h4 className="font-semibold text-emerald-800 mb-3">
                                    Công thức BM25 cơ bản
                                </h4>

                                <div className="bg-white rounded-xl p-4 border border-emerald-200 mb-4 overflow-x-auto">
                                    <div className="text-center font-mono text-base">
                                        <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                                            <span className="text-slate-700">BM25 = </span>
                                            <span className="text-emerald-600">∑</span>
                                            <span className="text-slate-500 text-sm">(từng từ)</span>
                                            <span className="text-indigo-600 mx-1">IDF</span>
                                            <span className="text-slate-500">×</span>
                                            <div className="inline-flex flex-col items-center mx-1">
                                                <span className="border-b border-slate-400 px-2 text-emerald-600">TF × 2.2</span>
                                                <span className="px-2 text-amber-600">TF + 1.2 × norm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white/70 rounded-lg p-3">
                                        <div className="font-medium text-emerald-700 mb-1">IDF = log(1 + (N-n+0.5)/(n+0.5))</div>
                                        <p className="text-xs text-emerald-600">
                                            Từ càng hiếm → IDF càng cao
                                        </p>
                                    </div>
                                    <div className="bg-white/70 rounded-lg p-3">
                                        <div className="font-medium text-emerald-700 mb-1">TF = √(số lần xuất hiện)</div>
                                        <p className="text-xs text-emerald-600">
                                            Xuất hiện nhiều → TF cao (nhưng giảm dần)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Explanation Tree */}
                            <div className="border border-slate-200 rounded-2xl p-4">
                                <h4 className="font-semibold text-slate-800 mb-3">Chi tiết từ Elasticsearch</h4>
                                <p className="text-xs text-slate-500 mb-3">Click vào các mục để mở rộng/thu gọn</p>
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
