import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import StatsBar from "@/components/StatsBar";
import JobCard from "@/components/JobCard";

export default async function Home() {
    await connectDB();
    const jobs = await Job.find({ filterPassed: true })
        .sort({ scrapedAt: -1 })
        .lean();

    return (
        <div className="min-h-full bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">Job Board</h1>
                </div>
                <StatsBar />
                <div className="flex flex-col mt-6 gap-3">
                    {jobs.map(job => (
                        <JobCard key={String(job._id)} job={{ ...job, _id: String(job._id) }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
