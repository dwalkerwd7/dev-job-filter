import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import StatsCards from "@/components/StatsCards";

async function getStats() {
    await connectDB();
    const [total, passed, applied, dismissed] = await Promise.all([
        Job.countDocuments({}),
        Job.countDocuments({ filterPassed: true }),
        Job.countDocuments({ applied: true }),
        Job.countDocuments({ dismissed: true })
    ]);
    return { total, passed, applied, dismissed };
}

export default async function StatsBar() {
    const { total, passed, applied, dismissed } = await getStats();
    return <StatsCards total={total} passed={passed} applied={applied} dismissed={dismissed} />;
}

export function StatsBarSkeleton() {
    return (
        <div className="flex flex-row gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-md px-5 py-4 animate-pulse">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="mt-2 h-7 w-12 bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    )
};
