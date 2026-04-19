import { spawn } from "child_process"
import path from "path"

let isRunning = false

export async function POST(req: Request) {
    if (isRunning) {
        return new Response("Pipeline running...", { status: 409 })
    }

    const { scrape_limit, filter_limit } = await req.json()
    const flags: string[] = []

    if (!scrape_limit) flags.push("--no-scraping")
    else flags.push(`--scrape-limit=${scrape_limit}`)

    if (!filter_limit) flags.push("--no-filtering")
    else flags.push(`--filter_limit=${filter_limit}`)

    const projectRoot = path.resolve(process.cwd(), "../")

    const stream = new ReadableStream({
        start(controller) {
            isRunning = true
            const proc = spawn("npm", ["run", "pipeline", "--", ...flags], {
                cwd: projectRoot
            })

            const send = (line: string) =>
                controller.enqueue(new TextEncoder().encode(line + "\n"))

            proc.stdout.on("data", chunk => send(chunk.toString()))
            proc.stderr.on("data", chunk => send(chunk.toString()))

            proc.on("close", code => {
                send(`[exit:${code}]`) // signal to client that proc finished
                controller.close()
                isRunning = false
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
