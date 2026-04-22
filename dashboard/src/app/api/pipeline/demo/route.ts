import { spawn, ChildProcess } from "child_process"
import path from "path"

let isRunning = false
let activeProc: ChildProcess | null = null

export async function POST() {
    if (isRunning) {
        return new Response("Pipeline running...", { status: 409 })
    }

    const projectRoot = path.resolve(process.cwd(), "../pipeline")

    const stream = new ReadableStream({
        start(controller) {
            isRunning = true
            const proc = spawn("npm", ["run", "pipeline-demo"], {
                cwd: projectRoot,
                detached: true,
                shell: true
            })
            activeProc = proc

            const send = (chunk: string) => {
                for (const line of chunk.split("\n").filter(l => l.trim()))
                    controller.enqueue(new TextEncoder().encode(`data: ${line.trimEnd()}\n\n`))
            }

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
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    })
}

export async function DELETE() {
    if (!activeProc) {
        return new Response("No pipeline running", { status: 404 })
    }
    process.kill(-activeProc.pid!, "SIGTERM")
    return new Response("OK", { status: 200 })
}
