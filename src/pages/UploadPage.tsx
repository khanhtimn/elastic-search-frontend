import { useState, useEffect } from "react";
import { indexDocument, getIndices } from "../services/api";
import { Upload, CheckCircle, XCircle, AlertCircle, Database, Hash, Braces, ChevronDown } from "lucide-react";

export default function UploadPage() {
    const [index, setIndex] = useState("");
    const [id, setId] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState<{ type: "success" | "error" | "warning" | null; message: string }>({
        type: null,
        message: ""
    });
    const [loading, setLoading] = useState(false);
    const [availableIndices, setAvailableIndices] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchIndices = async () => {
            const indices = await getIndices();
            setAvailableIndices(indices);
        };
        fetchIndices();
    }, []);

    const handleUpload = async () => {
        if (!index || !id || !content) {
            setStatus({ type: "warning", message: "Vui lòng điền đầy đủ thông tin" });
            return;
        }

        try {
            setLoading(true);
            setStatus({ type: null, message: "" });

            const parsedContent = JSON.parse(content);
            const success = await indexDocument(index, id, parsedContent);

            if (success) {
                setStatus({ type: "success", message: "Tải lên tài liệu thành công!" });
                setIndex("");
                setId("");
                setContent("");
            } else {
                setStatus({ type: "error", message: "Tải lên thất bại. Vui lòng thử lại." });
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                setStatus({ type: "error", message: "Định dạng JSON không hợp lệ. Hãy kiểm tra lại cú pháp." });
            } else {
                setStatus({ type: "error", message: "Đã xảy ra lỗi không mong muốn." });
            }
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setIndex("");
        setId("");
        setContent("");
        setStatus({ type: null, message: "" });
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Tải lên Tài liệu</h2>
                <p className="text-slate-500 mt-2">Thêm dữ liệu mới vào Elasticsearch</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 space-y-6">

                    {/* Status Alert */}
                    {status.type && (
                        <div className={`
                            flex items-center gap-3 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2
                            ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                                status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    'bg-amber-50 text-amber-700 border border-amber-100'}
                        `}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> :
                                status.type === 'error' ? <XCircle className="w-5 h-5 flex-shrink-0" /> :
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <span className="font-medium">{status.message}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Index Input */}
                        <div className="space-y-2 relative">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Tên Index</label>
                            <div className="relative z-20">
                                <Database className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="ví dụ: products"
                                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    value={index}
                                    onChange={(e) => {
                                        setIndex(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                    disabled={loading}
                                    autoComplete="off"
                                />
                                <ChevronDown className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />

                                {/* Suggestions Dropdown */}
                                {showSuggestions && availableIndices.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="py-2">
                                            {availableIndices
                                                .filter(idx => idx.toLowerCase().includes(index.toLowerCase()))
                                                .map(idx => (
                                                    <button
                                                        key={idx}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
                                                        onClick={() => {
                                                            setIndex(idx);
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        <Database className="w-4 h-4 text-slate-400" />
                                                        {idx}
                                                    </button>
                                                ))}
                                            {availableIndices.filter(idx => idx.toLowerCase().includes(index.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-2.5 text-slate-400 text-sm italic">
                                                    Không tìm thấy index khớp. Index mới sẽ được tạo.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ID Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">ID Tài liệu</label>
                            <div className="relative">
                                <Hash className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="ví dụ: prod-123"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* JSON Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-semibold text-slate-700">Nội dung JSON</label>
                            <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">application/json</span>
                        </div>
                        <div className="relative group">
                            <Braces className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <textarea
                                placeholder='{ "title": "My Document", ... }'
                                className="w-full pl-11 pr-4 py-3 min-h-[200px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-mono text-sm resize-y"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                        <button
                            onClick={clearForm}
                            disabled={loading}
                            className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Làm mới
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-500/20 transition-all
                                ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}
                            `}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang tải...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    <span>Tải lên</span>
                                </>
                            )}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}