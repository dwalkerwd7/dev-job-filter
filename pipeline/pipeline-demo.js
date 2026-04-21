const fs = require("fs")
const path = require("path")

const DEMO_SPEED = 10;
const DEMO_LOG_PATH = path.join(__dirname, "..", "logs", "demo.log")
const LINE_RE = /^\[(.+?)\] LOG\s+(.+)$/

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

async function replay() {
    const lines = fs.readFileSync(DEMO_LOG_PATH, "utf8").split("\n");

    const parsed = [];
    for (const line of lines) {
        const m = line.match(LINE_RE)
        if (m) parsed.push({
            ts: new Date(m[1]).getTime(),
            msg: m[2]
        });
    }

    for (let i = 0; i < parsed.length; i++) {
        if (i > 0) {
            const delta = parsed[i].ts - parsed[i - 1].ts;
            await sleep(delta / DEMO_SPEED);
        }
        process.stdout.write(parsed[i].msg + "\n")
    }
}

replay().catch(e => {
    console.error(e);
    process.exit(1);
});
