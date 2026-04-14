import { Suspense } from "react";
import StatsBar, { StatsBarSkeleton } from "@/components/StatsBar";
import JobList, { JobListSkeleton } from "@/components/JobList";

export default function Home() {
    return (
        <div className="min-h-full bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">Job Board</h1>
                </div>
                <Suspense fallback={<StatsBarSkeleton />}>
                    <StatsBar />
                </Suspense>
                <div className="mt-6">
                    <Suspense fallback={<JobListSkeleton />}>
                        <JobList />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
