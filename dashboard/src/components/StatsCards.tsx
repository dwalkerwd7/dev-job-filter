"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState } from "react";

type Props = {
    total: number;
    passed: number;
    applied: number;
    dismissed: number;
};

export default function StatsCards({ total, passed, applied, dismissed }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isPending, startTransition] = useTransition();
    const [pendingView, setPendingView] = useState<string | null>(null);

    const activeView = pendingView ?? searchParams.get("view") ?? "passed";

    function setView(view: string) {
        setPendingView(view);
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", view);
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    const stats = [
        { label: "Total Scraped", value: total, view: "all" },
        { label: "Passed Filter", value: passed, view: "passed" },
        { label: "Applied", value: applied, view: "applied" },
        { label: "Dismissed", value: dismissed, view: "dismissed" }
    ];

    return (
        <div className="grid grid-cols-4 gap-2">
            {stats.map(({ label, value, view }) => (
                <button
                    key={label}
                    onClick={() => setView(view)}
                    className={`text-left bg-white border rounded-md px-3 py-4 transition-colors 
                        ${activeView === view
                            ? "border-blue-500 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                >
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
                </button>
            ))}
        </div>
    );
}
