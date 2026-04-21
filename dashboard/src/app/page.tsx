import { Suspense } from "react";
import StatsBar, { StatsBarSkeleton } from "@/components/StatsBar";
import JobList, { JobListSkeleton } from "@/components/JobList";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const params = await searchParams;

    return (
        <div className="flex-1 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">Find a dev job!</h1>
                </div>
                <Suspense fallback={<StatsBarSkeleton />}>
                    <StatsBar />
                </Suspense>
                <div className="mt-6 flex flex-col gap-4">
                    <FilterBar />
                    <Suspense key={
                        `${params.view ?? "passed"}
                            -${params.search ?? ""}
                            -${params.page ?? "1"}
                            -${params.sort ?? ""}
                        `
                    } fallback={<JobListSkeleton />}>
                        <JobList filters={params} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
