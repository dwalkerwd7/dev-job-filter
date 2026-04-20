import { connectDB } from "@/lib/mongodb"
import Job from "@/models/Job"
import RunPanel from "@/components/RunPanel"
import PipelineView from "@/components/PipelineView"
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
                <PipelineView initial={{ totalScraped, filterRan, filterPassed }} lastRun={lastRun} />
            </div>
        </div>
    )
}
