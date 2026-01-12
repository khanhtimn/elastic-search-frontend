import { TrendingUp, Info } from "lucide-react";

type ScoreBadgeProps = {
    score: number;
    maxScore?: number;
    onExplainClick?: () => void;
};

export default function ScoreBadge({ score, maxScore = 10, onExplainClick }: ScoreBadgeProps) {
    // Normalize score to 0-100 range for color calculation
    const normalizedScore = Math.min((score / maxScore) * 100, 100);

    // Generate gradient color based on score (red -> yellow -> green)
    const getScoreColor = () => {
        if (normalizedScore >= 70) return "from-emerald-500 to-green-600";
        if (normalizedScore >= 40) return "from-amber-400 to-yellow-500";
        return "from-orange-400 to-red-500";
    };

    const getScoreBgColor = () => {
        if (normalizedScore >= 70) return "bg-emerald-50 border-emerald-200";
        if (normalizedScore >= 40) return "bg-amber-50 border-amber-200";
        return "bg-orange-50 border-orange-200";
    };

    const getScoreTextColor = () => {
        if (normalizedScore >= 70) return "text-emerald-700";
        if (normalizedScore >= 40) return "text-amber-700";
        return "text-orange-700";
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getScoreBgColor()} transition-all duration-300`}>
                {/* Score icon with gradient */}
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getScoreColor()} flex items-center justify-center`}>
                    <TrendingUp className="w-3 h-3 text-white" />
                </div>

                {/* Score value */}
                <span className={`font-bold text-sm ${getScoreTextColor()}`}>
                    {score.toFixed(2)}
                </span>

                {/* Score bar visualization */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1">
                    <div
                        className={`h-full bg-gradient-to-r ${getScoreColor()} rounded-full transition-all duration-500`}
                        style={{ width: `${normalizedScore}%` }}
                    />
                </div>
            </div>

            {/* Explain button */}
            {/* {onExplainClick && (
                <button
                    onClick={onExplainClick}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    title="Xem chi tiết cách tính điểm"
                >
                    <Info className="w-4 h-4" />
                </button>
            )} */}
        </div>
    );
}
