"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Props = {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    showing: number[];
};

export default function Pagination({ currentPage, totalPages, pageSize, showing }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function goToPage(page: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        router.push(`${pathname}?${params.toString()}`);
    }

    function changePageSize(pageSize: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("pageSize", String(pageSize));
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    }

    function handlePageChange(e: React.FocusEvent<HTMLInputElement>) {
        goToPage(Math.min(totalPages, Math.max(1, Number(e.currentTarget.value))));
    }

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-left justify-between gap-3 mt-4">
            <div className="flex items-start gap-3">
                <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="text-sm px-3 py-1.5 border border-gray-200 rounded bg-white text-gray-600
                        hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Home
                </button>
                <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="justify-self-end text-sm px-3 py-1.5 border border-gray-200 rounded bg-white text-gray-600
                        hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    End
                </button>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-sm px-3 py-1.5 border border-gray-200 rounded bg-white text-gray-600
                        hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-sm px-3 py-1.5 border border-gray-200 rounded bg-white text-gray-600
                        hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
            <div className="flex gap-3 sm:justify-between">
                <div className="flex flex-row items-center">
                    <label className="text-xs text-gray-500">Go to</label>
                    <input
                        onBlur={handlePageChange}
                        defaultValue={currentPage}
                        type="number"
                        min={1}
                        max={totalPages}
                        className="w-8 ml-2 text-center text-sm text-gray-600 border border-gray-200"
                    />
                </div>

                <select
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 text-sm text-center"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
    );
}
