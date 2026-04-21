import { connectDB } from "@/lib/mongodb"
import Job from "@/models/Job"
import PipelineView from "@/components/PipelineView"

export const dynamic = "force-dynamic"

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

export default async function PipelinePage() {
    const { totalScraped, filterRan, filterPassed, lastRun } = await getFunnelStats()
    return (
        <div className="flex-1 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
                <PipelineView initial={{ totalScraped, filterRan, filterPassed }} lastRun={lastRun} />
            </div>
        </div>
    )
}
