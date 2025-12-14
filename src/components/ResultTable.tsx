import { useState } from "react";
import { deleteDocument } from "../services/api";
import { Trash2, Database, Loader2, Copy, Check } from "lucide-react";

type ResultTableProps = {
    results: any[];
    onRefresh: () => void;
    loading?: boolean;
};

export default function ResultTable({ results, onRefresh, loading = false }: ResultTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
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
        <div className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Table Header */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    Kết quả tìm kiếm
                    <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full ml-2">
                        {results.length}
                    </span>
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                            <th className="px-6 py-4 font-medium">Index</th>
                            <th className="px-6 py-4 font-medium">ID Tài liệu</th>
                            <th className="px-6 py-4 font-medium">Xem trước nội dung</th>
                            <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {results.map((doc) => {
                            const docKey = `${doc._index}-${doc._id}`;
                            const isDeleting = deletingId === docKey;
                            const isCopied = copiedId === docKey;

                            return (
                                <tr
                                    key={docKey}
                                    className="group hover:bg-slate-50/80 transition-colors duration-200"
                                >
                                    {/* Index */}
                                    <td className="px-6 py-4 align-top">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {doc._index}
                                        </span>
                                    </td>

                                    {/* ID */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-2 group/id cursor-pointer" onClick={() => copyToClipboard(doc._id, docKey)}>
                                            <span className="font-mono text-sm text-slate-600 truncate max-w-[120px]" title={doc._id}>
                                                {doc._id}
                                            </span>
                                            {isCopied ? (
                                                <Check className="w-3.5 h-3.5 text-green-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </td>

                                    {/* Content */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="relative group/content">
                                            <div className="max-h-32 overflow-y-auto w-full min-w-[300px] text-sm text-slate-600 font-mono bg-slate-50 rounded-lg p-3 border border-slate-100 group-hover/content:border-slate-200 transition-colors">
                                                <pre className="whitespace-pre-wrap break-words">
                                                    {JSON.stringify(doc._source, null, 2)}
                                                </pre>
                                            </div>
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

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex justify-end">
                <span>Hiển thị {results.length} kết quả</span>
            </div>
        </div>
    );
}