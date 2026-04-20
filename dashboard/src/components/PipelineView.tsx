"use client"

import { useState, useCallback, useRef, Fragment } from "react"
import RunPanel from "@/components/RunPanel"

type Stats = {
    totalScraped: number
    filterRan: number
    filterPassed: number
}
type ActiveStep = "scrape" | "filter" | "complete" | null

const stepTags = {
    scraper: "[scraper]",
    filter: "[filter]",
    passed: "successfully!",
    db: "[db]"
}

function pct(n: number, of: number) {
    if (!of) return "—"
    return `${Math.round((n / of) * 100)}%`
}

export default function PipelineView({ initial, lastRun }: { initial: Stats, lastRun: Date | null }) {
    const [running, setRunning] = useState(false)
    const [activeStep, setActiveStep] = useState<ActiveStep>(null)
    const [stats, setStats] = useState(initial)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchStats = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            const res = await fetch("/api/pipeline/stats")
            if (res.ok) setStats(await res.json())
        }, 500)
    }, [])

    const onChunk = useCallback((text: string) => {
        if (text.includes(stepTags.scraper)) setActiveStep("scrape")
        else if (text.includes(stepTags.filter)) setActiveStep("filter")
        else if (text.includes(stepTags.passed)) setActiveStep("complete")

        if (text.toLowerCase().includes(stepTags.db)) fetchStats()
    }, [fetchStats])

    const cards = [
        { step: "scrape", label: "Total Scraped", value: stats.totalScraped, sub: null },
        { step: "filter", label: "Filter Runnable", value: stats.filterRan, sub: `${pct(stats.filterRan, stats.totalScraped)} of scraped` },
        { step: "complete", label: "Filter Passed", value: stats.filterPassed, sub: `${pct(stats.filterPassed, stats.totalScraped)} of scraped` },
    ]

    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
                    {lastRun && <p className="text-xs text-gray-400">Last
                        run: {new Date(lastRun).toLocaleString()}</p>}
                </div>
                <div className="flex items-stretch">
                    {cards.map((card, i) => {
                        const isActive = activeStep === card.step
                        const isMuted = running && !isActive
                        return (
                            <Fragment key={card.label}>
                                <div className={`bg-white border px-5 py-4 flex-1 transition-all duration-700 
                                        ${isActive ? "border-green-500 ring-2 ring-green-500" : "border-gray-200"} 
                                        ${isMuted ? "opacity-50" : ""}`}
                                >
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
                                    <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
                                    {card.sub && <p className="mt-1 text-xs text-gray-400">{card.sub}</p>}
                                </div>
                                {i < cards.length - 1 && (
                                    <div className="flex items-center px-3 text-gray-700 text-xl">→</div>
                                )}
                            </Fragment>
                        )
                    })}
                </div>
            </div>
            <RunPanel running={running} setRunning={setRunning} onChunk={onChunk} onStop={() => setActiveStep(null)} />
        </div >
    );
}
