import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

type SortDirection = "asc" | "desc";

interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { _id?: string | unknown }>({
    data,
    columns,
    searchPlaceholder,
    searchKeys,
    emptyMessage = "No data found.",
}: {
    data: T[];
    columns: Column<T>[];
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[];
    emptyMessage?: string;
}) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>("asc");
    const [search, setSearch] = useState("");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const filtered = useMemo(() => {
        let result = [...data];
        if (search && searchKeys) {
            const q = search.toLowerCase().trim();
            result = result.filter((row) =>
                searchKeys.some((k) => {
                    const val = row[k];
                    if (typeof val === "string") return val.toLowerCase().includes(q);
                    return false;
                })
            );
        }
        return result;
    }, [data, search, searchKeys]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const aVal = a[sortKey as keyof T];
            const bVal = b[sortKey as keyof T];
            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortDir === "asc" ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }, [filtered, sortKey, sortDir]);

    return (
        <div>
            {searchPlaceholder && searchKeys && (
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-theme-strong bg-theme-sidebar text-theme font-bold uppercase tracking-wider text-sm placeholder:text-theme-muted focus:border-[#ccff00] focus:outline-none"
                    />
                </div>
            )}

            <div className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden">
                {sorted.length === 0 ? (
                    <div className="p-10 text-center text-theme-muted font-black uppercase tracking-wider">{emptyMessage}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-4 border-theme-strong bg-theme-sidebar">
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-theme-muted ${col.sortable ? "cursor-pointer hover:text-[#ccff00] select-none" : ""}`}
                                            onClick={() => col.sortable && handleSort(col.key)}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {col.header}
                                                {col.sortable && sortKey === col.key && (
                                                    sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-theme-strong">
                                {sorted.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-theme-sidebar transition-colors">
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 text-sm font-bold text-theme">
                                                {col.render(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {sorted.length > 0 && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-theme-muted">
                    {sorted.length} {sorted.length === 1 ? "record" : "records"}
                </p>
            )}
        </div>
    );
}
