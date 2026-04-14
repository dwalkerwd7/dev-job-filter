"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function FilterBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function updateFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "") {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        router.push(`${pathname}?${params.toString()}`);
    }

    const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

    useEffect(() => {
        const timeout = setTimeout(() => {
            updateFilter("search", searchInput)
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const arrangement = searchParams.get("arrangement") ?? "";

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <select
                value={arrangement}
                onChange={e => updateFilter("arrangement", e.target.value)}
                className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-700"
            >
                <option value="">All arrangements</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="in-person">In-Person</option>
            </select>

            <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title or company..."
                className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-700 w-64 
                    focus:outline-none focus:border-gray-400"
            />
        </div>
    )
};
