import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import JobCard from "@/components/JobCard";
import Pagination from "@/components/Pagination";

type Filters = {
    arrangement?: string;
    view?: string;
    search?: string;
    page?: string;
    pageSize?: string;
};

export default async function JobList({ filters }: { filters: Filters }) {
    await connectDB();
    const query: Record<string, unknown> = {};

    const MIN_PAGE_SIZE = 10;
    const MAX_PAGE_SIZE = 50;
    const PAGE_SIZE_FROM_FILTER = filters.pageSize ? Math.round(Number(filters.pageSize) / 10) * 10 : 10;
    const PAGE_SIZE = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, PAGE_SIZE_FROM_FILTER));
    const page = Math.max(1, Number(filters.page ?? 1));
    const skip = (page - 1) * PAGE_SIZE;

    query.dismissed = { $ne: true };

    if (filters.view === "applied") {
        query.filterPassed = true;
        query.applied = true;
    } else if (filters.view === "dismissed") {
        query.dismissed = true;
    } else if (filters.view === "passed") {
        query.filterPassed = true;
    } else if (filters.view !== "all") {
        query.filterPassed = true;
    }

    if (filters.arrangement) query.workArrangement = filters.arrangement;
    if (filters.search) {
        const regex = { $regex: filters.search, $options: "i" };
        query.$or = [{ title: regex }, { company: regex }];
    }

    const [jobs, numJobs] = await Promise.all([
        Job.find(query)
            .sort({ scrapedAt: -1 })
            .skip(skip).limit(PAGE_SIZE)
            .lean(),
        Job.countDocuments(query)
    ]);

    const SHOWING = [Math.min(PAGE_SIZE, numJobs), numJobs];
    const TOTAL_PAGES = Math.ceil(numJobs / PAGE_SIZE);

    if (jobs.length === 0) {
        return <p className="text-sm text-gray-400">No jobs match your filters.</p>;
    }

    return (
        <div className="flex flex-col mt-6 gap-3">
            <Pagination currentPage={page} totalPages={TOTAL_PAGES} pageSize={PAGE_SIZE} showing={SHOWING} />
            {jobs.map(job => (
                <JobCard key={String(job._id)} job={{ ...job, _id: String(job._id) }} filters={filters} />
            ))}
            <Pagination currentPage={page} totalPages={TOTAL_PAGES} pageSize={PAGE_SIZE} showing={SHOWING} />
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
