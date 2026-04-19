import { connectDB } from "@/lib/mongodb"
import Job from "@/models/Job"
import RunPanel from "@/components/RunPanel"
import { Fragment } from "react"

async function getFunnelStats() {
    await connectDB()
    const [totalScraped, filterRan, filterPassed, lastJob] = await Promise.all([
        Job.countDocuments({}),
        Job.countDocuments({ filterRan: true }),
        Job.countDocuments({ filterPassed: true }),
        Job.findOne({}, { scrapedAt: 1 }).sort({ scrapedAt: -1 }).lean()
    ])
    return { totalScraped, filterRan, filterPassed, lastRun: (lastJob as { scrapedAt?: Date } | null)?.scrapedAt ?? null }
}

function pct(n: number, of: number) {
    if (!of) return "—"
    return `${Math.round((n / of) * 100)}%`
}

export default async function PipelinePage() {
    const { totalScraped, filterRan, filterPassed, lastRun } = await getFunnelStats()

    const cards = [
        { label: "Total Scraped", value: totalScraped, sub: null },
        { label: "Filter Ran", value: filterRan, sub: `${pct(filterRan, totalScraped)} of scraped` },
        { label: "Filter Passed", value: filterPassed, sub: `${pct(filterPassed, filterRan)} of filter ran` },
    ]

    return (
        <div className="flex-1 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
                        {lastRun && (
                            <p className="text-xs text-gray-400">
                                Last run: {new Date(lastRun).toLocaleString()}
                            </p>
                        )}
                    </div>

                    <div className="flex items-stretch">
                        {cards.map((card, i) => (
                            <Fragment key={card.label}>
                                <div className="bg-white border border-gray-200 px-5 py-4 flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
                                    <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
                                    {card.sub && <p className="mt-1 text-xs text-gray-400">{card.sub}</p>}
                                </div>
                                {i < cards.length - 1 && (
                                    <div className="flex items-center px-3 text-gray-700 text-xl">→</div>
                                )}
                            </Fragment>
                        ))}
                    </div>
                </div>

                <RunPanel />
            </div>
        </div>
    )
}
