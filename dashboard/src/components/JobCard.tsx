"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";

type JobData = {
    _id: string;
    title: string;
    company: string;
    url: string;
    jobDesc: string;
    tech_stack: string[];
    location: string | null;
    workArrangement: "remote" | "hybrid" | "in-person" | null;
    applied: boolean;
    dismissed: boolean;
    scrapedAt: Date | string;
};

const arrangementStyles: Record<string, string> = {
    remote: "bg-green-50 text-green-700 border-green-200",
    hybrid: "bg-blue-50 text-blue-700 border-blue-200",
    "in-person": "bg-gray-100 text-gray-600 border-gray-200"
};

export default function JobCard({ job, filters }: { job: JobData, filters: Record<string, unknown> }) {
    const date = new Date(job.scrapedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const router = useRouter();

    const [dismissed, setDismissed] = useState(job.dismissed);
    const [isApplied, setIsApplied] = useState(job.applied);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    async function handleDismissRenew(e: React.MouseEvent, dismiss: boolean = true) {
        e.stopPropagation(); // so that it doesn't trigger the container div onClick
        setDismissed(dismiss);
        try {
            const res = await fetch(API(`jobs/${job._id}`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dismissed: dismiss })
            });
            if (!res.ok) throw new Error("Request failed");
            router.refresh();
        } catch {
            setDismissed(!dismiss);
            setError(`Failed to ${dismiss ? 'dismiss' : 'renew'} job. Try again.`);
        }
    }

    async function handleApply(e: React.MouseEvent) {
        e.stopPropagation();
        setIsApplied(!isApplied);
        try {
            const res = await fetch(API(`jobs/${job._id}`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applied: !isApplied }),
            });
            if (!res.ok) throw new Error("Request failed");
            router.refresh();
        } catch {
            setIsApplied(isApplied);
            setError("Failed to update application status. Try again.");
        }
    }

    if (dismissed && filters.view !== "dismissed") return null;

    return (
        <div className="bg-white border border-gray-200 rounded-md p-5 pb-2">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">{job.title}</h2>
                    <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {job.company}
                    </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={e => handleApply(e)}
                        className={`text-xs font-medium border rounded px-2 py-0.5 transition-colors
                            ${isApplied
                                ? "text-green-700 bg-green-50 border-green-200"
                                : "text-gray-400 bg-white border-gray-200 hover:border-gray-400 hover: text-gray-600"
                            }`}
                    >
                        {isApplied ? "Applied" : "Mark Applied"}
                    </button>
                    {job.workArrangement && (
                        <span className={`text-xs font-medium border rounded px-2 py-0.5 capitalize ${arrangementStyles[job.workArrangement]}`}>
                            {job.workArrangement}
                        </span>
                    )}
                    {!dismissed ? (
                        <button onClick={e => handleDismissRenew(e)}
                            className="text-gray-300 hover:text-gray-500 transition-colors ml-1"
                            aria-label="Dismiss"
                        >
                            ✕
                        </button>
                    ) : (
                        <button onClick={e => handleDismissRenew(e, false)}
                            className="text-blue-500 hover:text-green-500 transition-colors ml-1"
                            aria-label="Renew"
                        >
                            +
                        </button>
                    )}
                </div>
            </div>
            {job.tech_stack.length > 0 && (
                <div className="flex flex-wrap mt-3 gap-1.5">
                    {job.tech_stack.map((tech, i) => (
                        <span key={`${tech}-${i}`} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                            {tech}
                        </span>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>{job.location ?? "Location unknown"}</span>
                <span>{date}</span>
            </div>
            <div className="flex flex-row-reverse text-sm text-blue-400">
                {isExpanded ? (
                    <span onClick={() => setIsExpanded(false)} className="hover:cursor-pointer">▴ Details</span>
                ) : (
                    <span onClick={() => setIsExpanded(true)} className="hover:cursor-pointer">▾ Details</span>
                )}
            </div>
            {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {job.jobDesc.split(/\n/).map((p, i) => (
                        <p key={i} className="text-sm text-gray-600 leading-relaxed m-2">
                            {p.trim()}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};
