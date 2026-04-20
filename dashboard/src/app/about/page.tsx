export default function AboutPage() {
    const steps = [
        {
            tag: "Scraper",
            desc: "Discovers companies hiring on Greenhouse via a Google search API, then scrapes each job listing using Playwright to pull the full job description."
        },
        {
            tag: "Stack Filter",
            desc: "Sends job descriptions to Claude (Haiku) to extract the tech stack. Jobs matching the target skills — React, Next.js, TypeScript, Node.js — pass through. The rest are discarded."
        },
        {
            tag: "Info Gather",
            desc: "For each passing job, Claude extracts structured metadata: location and work arrangement (remote, hybrid, or in-person)."
        },
        {
            tag: "Dashboard",
            desc: "Filtered jobs surface here. Filter by work arrangement, search by keyword, and mark jobs as applied."
        },
    ]

    const stack = [
        ["Scraper", "Playwright + Serper"],
        ["AI Extraction", "Claude Haiku (Anthropic)"],
        ["Database", "MongoDB Atlas"],
        ["Dashboard", "Next.js + Tailwind"],
        ["Job Source", "Greenhouse ATS (public API)"],
    ]

    return (
        <div className="flex-1 bg-gray-50">
            <div className="max-w-2xl mx-auto px-6 py-12">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">About</h1>
                <p className="text-gray-500 text-sm mb-10">
                    A job search and filter tool for software developers that automates discovery, filtering, and tracking of roles at companies on Greenhouse.
                </p>

                <section className="mb-10">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">How it works</h2>
                    <div className="flex flex-col gap-px">
                        {steps.map((step, i) => (
                            <div key={step.tag} className="bg-white border border-gray-200 px-5 py-4 flex gap-4">
                                <div className="flex flex-col items-center gap-1 pt-0.5">
                                    <span className="text-xs font-mono text-gray-400">{String(i + 1).padStart(2, "0")}</span>
                                    {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-100" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">{step.tag}</p>
                                    <p className="text-sm text-gray-500">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">Stack</h2>
                    <div className="bg-white border border-gray-200">
                        {stack.map(([label, value], i) => (
                            <div key={label} className={`flex items-center px-5 py-3 text-sm ${i < stack.length - 1 ? "border-b border-gray-100" : ""}`}>
                                <span className="text-gray-400 w-36">{label}</span>
                                <span className="text-gray-900">{value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
