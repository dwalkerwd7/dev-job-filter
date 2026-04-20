import { connectDB } from "@/lib/mongodb"
import Job from "@/models/Job"

export async function GET() {
    await connectDB()
    const [totalScraped, filterRan, filterPassed] = await Promise.all([
        Job.countDocuments({}),
        Job.countDocuments({ filterRan: true }),
        Job.countDocuments({ filterPassed: true })
    ])
    return Response.json({ totalScraped, filterRan, filterPassed })
}
