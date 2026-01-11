import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

type DocumentDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    document: {
        _index: string;
        _id: string;
        _score?: number;
        _source: Record<string, unknown>;
    } | null;
};

export default function DocumentDetailModal({ isOpen, onClose, document }: DocumentDetailModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !document) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(document._source, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header - ID và Điểm */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-8">
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">ID</span>
                            <p className="font-mono text-sm text-slate-800">{document._id}</p>
                        </div>
                        {document._score !== undefined && (
                            <div>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Điểm</span>
                                <p className="text-sm font-semibold text-primary-600">{document._score.toFixed(4)}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Index</span>
                            <p className="text-sm text-slate-700">{document._index}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* JSON Content */}
                <div className="flex-1 overflow-auto p-6 bg-slate-50">
                    <pre className="text-sm text-slate-800 font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(document._source, null, 2)}
                    </pre>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white">
                    <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-green-500" />
                                Đã copy!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy JSON
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
