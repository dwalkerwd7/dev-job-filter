type JobData = {
    _id: string;
    title: string;
    company: string;
    url: string;
    tech_stack: string[];
    location: string | null;
    workArrangement: "remote" | "hybrid" | "in-person" | null;
    applied: boolean;
    scrapedAt: Date | string;
};

const arrangementStyles: Record<string, string> = {
    remote: "bg-green-50 text-green-700 border-green-200",
    hybrid: "bg-blue-50 text-blue-700 border-blue-200",
    "in-person": "bg-gray-100 text-gray-600 border-gray-200"
};

export default function JobCard({ job }: { job: JobData }) {
    const date = new Date(job.scrapedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div className="bg-white border border-gray-200 rounded-md p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">{job.title}</h2>
                    <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {job.company}
                    </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {job.applied && (
                        <span className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                            Applied
                        </span>
                    )}
                    {job.workArrangement && (
                        <span className={`text-xs font-medium border rounded px-2 py-0.5 capitalize ${arrangementStyles[job.workArrangement]}`}>
                            {job.workArrangement}
                        </span>
                    )}
                </div>
            </div>
            {job.tech_stack.length > 0 && (
                <div className="flex flex-wrap mt-3 gap-1.5">
                    {job.tech_stack.map(tech => (
                        <span key={tech} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                            {tech}
                        </span>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>{job.location ?? "Location unknown"}</span>
                <span>{date}</span>
            </div>
        </div>
    );
};
