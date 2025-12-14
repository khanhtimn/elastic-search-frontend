import { useState } from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
    onSearch: (query: string) => void;
    loading?: boolean;
};

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
        setQuery("");
    };

    return (
        <div className={`
            relative group transition-all duration-500 ease-out
            ${isFocused ? 'scale-[1.02]' : 'scale-100'}
        `}>
            {/* Glow Effect */}
            <div className={`
                absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl opacity-0 blur-lg transition duration-500
                ${isFocused ? 'opacity-30' : 'group-hover:opacity-10'}
            `}></div>

            <div className={`
                relative flex items-center bg-white rounded-2xl shadow-xl transition-all duration-300 border
                ${isFocused ? 'border-blue-200 ring-4 ring-blue-500/10' : 'border-slate-100'}
            `}>
                <div className="pl-6 text-slate-400">
                    <Search className={`w-6 h-6 transition-all duration-300 ${isFocused ? 'text-blue-500' : ''}`} />
                </div>

                <input
                    type="text"
                    className="w-full py-5 px-4 text-lg font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
                    placeholder="Tìm kiếm tài liệu, ID hoặc nội dung..."
                    value={query}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSearch(query);
                    }}
                    disabled={loading}
                />

                {query && (
                    <button
                        onClick={handleClear}
                        className="p-2 mr-2 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}

                <button
                    onClick={() => onSearch(query)}
                    disabled={loading || !query.trim()}
                    className={`
                        m-2 px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300
                        ${!query.trim() || loading
                            ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0'}
                    `}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Đang tìm...
                        </span>
                    ) : (
                        "Tìm kiếm"
                    )}
                </button>
            </div>
        </div>
    );
}
