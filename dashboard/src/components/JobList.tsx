import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import JobCard from "@/components/JobCard";

export default async function JobList() {
    await connectDB();
    const jobs = await Job.find({ filterPassed: true })
        .sort({ scrapedAt: -1 })
        .lean();
    return (
        <div className="flex flex-col mt-6 gap-3">
            {jobs.map(job => (
                <JobCard key={String(job._id)} job={{ ...job, _id: String(job._id) }} />
            ))}
        </div>
    );
};

export function JobListSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-md p-5 animate-pulse">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="mt-2 h-3 w-32 bg-gray-200 rounded" />
                    <div className="mt-3 flex gap-2">
                        <div className="h-5 w-16 bg-gray-100 rounded" />
                        <div className="h-5 w-16 bg-gray-100 rounded" />
                        <div className="h-5 w-16 bg-gray-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
};
