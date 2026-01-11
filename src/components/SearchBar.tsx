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
        <div className="relative flex items-center gap-3">
            {/* Search Input Textbox with border */}
            <div className={`
                relative flex-1 flex items-center bg-white rounded-xl shadow-lg shadow-slate-200/50 transition-all duration-300 border
                ${isFocused ? 'border-primary-400 ring-4 ring-primary-500/10' : 'border-slate-200 hover:border-slate-300'}
            `}>
                <div className="pl-4 text-slate-400">
                    <Search className={`w-5 h-5 transition-all duration-300 ${isFocused ? 'text-primary-500' : ''}`} />
                </div>

                <input
                    type="text"
                    className="w-full py-4 px-3 text-base font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
                    placeholder="Tìm kiếm tin tức, tiêu đề hoặc nội dung..."
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
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Search Button */}
            <button
                onClick={() => onSearch(query)}
                disabled={loading || !query.trim()}
                className={`
                    px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300
                    ${!query.trim() || loading
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                        : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0 shadow-primary-500/20'}
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
    );
}
