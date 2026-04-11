const fs = require("fs");
const path = require("path");

const LOGS_DIR = path.join(__dirname, "../../logs");

function initLogger() {
    fs.mkdirSync(LOGS_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(LOGS_DIR, `pipeline-${timestamp}.log`);
    const stream = fs.createWriteStream(logPath, { flags: "a" });

    const write = (label, args) => {
        const line = `[${new Date().toISOString()}] ${label} ${args.map(a =>
            typeof a === "string" ? a : JSON.stringify(a)
        ).join(" ")}\n`;
        stream.write(line);
    };

    const origLog = console.log.bind(console);
    const origError = console.error.bind(console);

    console.log = (...args) => { origLog(...args); write("LOG  ", args); };
    console.error = (...args) => { origError(...args); write("ERROR", args); };

    console.log(`[logger] writing to ${logPath}`);
    return logPath;
}

module.exports = { initLogger };
