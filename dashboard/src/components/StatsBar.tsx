import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

async function getStats() {
  await connectDB();
  const [total, passed, applied] = await Promise.all([
    Job.countDocuments({}),
    Job.countDocuments({ filterPassed: true }),
    Job.countDocuments({ applied: true }),
  ]);
  return { total, passed, applied };
}

export default async function StatsBar() {
  const { total, passed, applied } = await getStats();

  const stats = [
    { label: "Total Scraped", value: total },
    { label: "Passed Filter", value: passed },
    { label: "Applied", value: applied },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-md px-5 py-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
