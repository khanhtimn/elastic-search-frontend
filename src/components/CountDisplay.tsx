import { useEffect, useState } from "react";
import { countDocuments } from "../services/api";
import { Layers } from "lucide-react";

export default function CountDisplay() {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const total = await countDocuments();
                setCount(total);
            } catch (error) {
                console.error("Failed to count documents", error);
            }
        };
        fetchCount();
    }, []);

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
                Bao gồm <span className="text-slate-900 font-bold">{count.toLocaleString()}</span> tài liệu
            </span>
        </div>
    );
}
