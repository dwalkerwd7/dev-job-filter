"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RunPanel() {
  const router = useRouter()
  const [scrapeEnabled, setScrapeEnabled] = useState(false)
  const [filterEnabled, setFilterEnabled] = useState(false)
  const [scrapeLimit, setScrapeLimit] = useState("")
  const [filterLimit, setFilterLimit] = useState("")
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState("")
  const [exitState, setExitState] = useState<"success" | "error" | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const canRun = (scrapeEnabled || filterEnabled) &&
    (!scrapeEnabled || scrapeLimit) &&
    (!filterEnabled || filterLimit)

  async function run() {
    setRunning(true)
    setLog("")
    setExitState(null)

    const res = await fetch("/api/pipeline/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scrape_limit: scrapeEnabled ? Number(scrapeLimit) : null,
        filter_limit: filterEnabled ? Number(filterLimit) : null,
      })
    })

    if (!res.ok || !res.body) {
      setLog(res.status === 409 ? "Pipeline already running." : "Failed to start.")
      setRunning(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)

      if (text.includes("[exit:0]")) {
        setExitState("success")
        setLog(prev => prev + text.replace(/\[exit:0\]\n?/, ""))
        router.refresh()
        break
      }
      if (text.includes("[exit:1]")) {
        setExitState("error")
        setLog(prev => prev + text.replace(/\[exit:1\]\n?/, ""))
        break
      }

      setLog(prev => prev + text)
    }

    setRunning(false)
  }

  const rows = [
    { id: "scrape", label: "Scrape", enabled: scrapeEnabled, setEnabled: setScrapeEnabled, limit: scrapeLimit, setLimit: setScrapeLimit },
    { id: "filter", label: "Filter", enabled: filterEnabled, setEnabled: setFilterEnabled, limit: filterLimit, setLimit: setFilterLimit },
  ]

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">Run Pipeline</h2>

      <div className="flex flex-col gap-3 mb-5">
        {rows.map(({ id, label, enabled, setEnabled, limit, setLimit }) => (
          <div key={id} className="flex items-center gap-3">
            <input type="checkbox" id={id} checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <label htmlFor={id} className="text-sm text-gray-700 w-14">{label}</label>
            <input
              type="number"
              disabled={!enabled}
              value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="limit"
              min={1}
              className="border border-gray-200 px-2 py-1 text-sm w-24 disabled:opacity-40 disabled:bg-gray-50"
            />
          </div>
        ))}
      </div>

      <button
        disabled={running || !canRun}
        onClick={run}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {running ? "Running..." : "Run Pipeline"}
      </button>

      {exitState && (
        <p className={`mt-3 text-sm font-medium ${exitState === "success" ? "text-green-600" : "text-red-600"}`}>
          {exitState === "success" ? "Completed successfully." : "Exited with errors."}
        </p>
      )}

      {log && (
        <pre
          ref={logRef}
          className="mt-4 bg-gray-950 text-gray-100 text-xs p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono select-none"
        >
          {log}
        </pre>
      )}
    </div>
  )
}
