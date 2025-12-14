import { Search, Database, Upload, LayoutGrid } from "lucide-react";

type HeaderProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

const tabs = [
    { id: "search", label: "Tìm kiếm", icon: Search },
    { id: "indices", label: "Quản lý Index", icon: Database },
    { id: "upload", label: "Tải lên", icon: Upload },
];

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => setActiveTab('search')}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                            <LayoutGrid size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-800">
                            Elastic<span className="text-blue-600">Search</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300
                                        ${isActive
                                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}
                                    `}
                                >
                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-blue-600" : "text-slate-400"} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}