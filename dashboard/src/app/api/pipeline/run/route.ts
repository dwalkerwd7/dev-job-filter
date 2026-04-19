import { spawn, ChildProcess } from "child_process"
import path from "path"

let isRunning = false
let activeProc: ChildProcess | null = null

export async function POST(req: Request) {
    if (isRunning) {
        return new Response("Pipeline running...", { status: 409 })
    }

    const { scrape_limit, filter_limit, clear_jobs } = await req.json()
    const flags: string[] = []

    if (clear_jobs) flags.push("--clear_jobs")

    if (!scrape_limit) flags.push("--no-scraping")
    else flags.push(`--scrape_limit=${scrape_limit}`)

    if (!filter_limit) flags.push("--no-filtering")
    else flags.push(`--filter_limit=${filter_limit}`)

    const projectRoot = path.resolve(process.cwd(), "../pipeline")

    const stream = new ReadableStream({
        start(controller) {
            isRunning = true
            const proc = spawn("npm", ["run", "pipeline", "--", ...flags], {
                cwd: projectRoot
            })
            activeProc = proc

            const send = (line: string) =>
                controller.enqueue(new TextEncoder().encode(line + "\n"))

            proc.stdout.on("data", chunk => send(chunk.toString()))
            proc.stderr.on("data", chunk => send(chunk.toString()))

            proc.on("close", (code, signal) => {
                send(signal ? "[exit:killed]" : `[exit:${code}]`)
                controller.close()
                isRunning = false
                activeProc = null
            })
        }
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache"
        }
    })
}

export async function DELETE() {
    if (!activeProc) {
        return new Response("No pipeline running", { status: 404 })
    }
    activeProc.kill("SIGTERM")
    return new Response("OK", { status: 200 })
}
