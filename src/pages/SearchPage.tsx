import { useState } from "react";
import SearchBar from "../components/SearchBar";
import ResultTable from "../components/ResultTable";
import CountDisplay from "../components/CountDisplay";
import { searchElastic } from "../services/api";
import { Search, AlertCircle, Sparkles } from "lucide-react";

export default function SearchPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError(null);
            setHasSearched(true);

            // Artificial delay for smoother UX (optional, remove if speed is critical)
            // await new Promise(resolve => setTimeout(resolve, 300));

            const data = await searchElastic(query);
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Tìm kiếm thất bại");
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        // In a real app, we might re-run the last search here
        console.log("Refresh triggered");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-2">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    Tìm kiếm Tài liệu
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Tra cứu nhanh chóng toàn bộ dữ liệu Elasticsearch với bộ lọc mạnh mẽ và kết quả tức thì.
                </p>

                <div className="flex justify-center pt-2">
                    <CountDisplay />
                </div>
            </div>

            {/* Search Section */}
            <div className="max-w-3xl mx-auto -mt-4 relative z-10">
                <SearchBar onSearch={handleSearch} loading={loading} />
            </div>

            {/* Error State */}
            {error && (
                <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800">Tìm kiếm thất bại</p>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {hasSearched && !error && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <ResultTable results={results} onRefresh={handleRefresh} loading={loading} />
                </div>
            )}

            {/* Empty/Initial State Visual */}
            {!hasSearched && !error && (
                <div className="text-center py-12 opacity-50">
                    <div className="w-32 h-32 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-12 h-12 text-slate-300" />
                    </div>
                </div>
            )}
        </div>
    );
}