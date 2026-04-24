"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function FilterBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFirstRender = useRef(true);

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
        // skips first render to prevent infinite loop of this effect firing
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            updateFilter("search", searchInput)
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const arrangement = searchParams.get("arrangement") ?? "";
    const sort = searchParams.get("sort") ?? "";

    return (
        <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-2 items-center justify-center">
                <label aria-label="Sort By" className="text-xs text-gray-400">Sort by</label>
                <select
                    value={sort}
                    onChange={e => updateFilter("sort", e.target.value)}
                    className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-700"
                >
                    <option value="">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="company">Company</option>
                    <option value="title">Title</option>
                </select>
            </div>
            <div className="flex flex-col gap-2 items-center justify-center">
                <label aria-label="Arrangements" className="text-xs text-gray-400">Arrangement</label>
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
            </div>
            <div className="flex flex-col items-end justify-end">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by title or company..."
                    className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white text-gray-700 w-64 
                    focus:outline-none focus:border-gray-400"
                />
            </div>
        </div>
    )
};
