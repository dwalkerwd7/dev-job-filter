const mongoose = require("mongoose");

const ScrapedJobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    extractedText: { type: String },
    scrapedAt: { type: Date, default: Date.now() }
});

const FilteredJobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    tech_stack: { type: [String], default: [] },
    employee_count: { type: Number, default: null },
    applied: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now }
});

const ScrapedJob = mongoose.model("ScrapedJob", ScrapedJobSchema);
const FilteredJob = mongoose.model("FilteredJob", FilteredJobSchema);

async function connect() {
    const uri = process.env.MONGODB_URI;
    // socketTimeoutMS: keep the connection alive for up to 2 min to survive the filter pipeline step
    // step (batched Claude API calls). Default is 0 (no timeout), but Atlas free tier
    // drops idle sockets around 60s — explicit value prevents pool-closed errors mid-run.
    await mongoose.connect(uri, { socketTimeoutMS: 120000, serverSelectionTimeoutMS: 30000 });
}

async function disconnect() {
    await mongoose.disconnect();
}

async function upsertScrapedJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: {
                $set: {
                    title: job.title,
                    company: job.company,
                    extractedText: job.extractedText ?? null,
                    scrapedAt: new Date()
                },
            },
            upsert: true
        }
    }));

    return ScrapedJob.bulkWrite(ops);
}

async function upsertFilteredJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: {
                $set: {
                    title: job.title,
                    company: job.company,
                    extractedText: job.extractedText ?? null,
                    tech_stack: job.tech_stack,
                    employee_count: job.employee_count ?? null,
                    scrapedAt: new Date()
                },
                $setOnInsert: { applied: false }
            },
            upsert: true
        }
    }));

    return FilteredJob.bulkWrite(ops); // updates existing records and adds new ones
}

async function upsertAlignedJobs(_) {
    return true;
}

async function getScrapedJobs() {
    return await ScrapedJob.find().lean();
}

async function getFilteredJobs() {
    return await FilteredJob.find().lean();
}

async function getAppliedUrls() {
    const applied = await FilteredJob.find({ applied: true }, { url: 1, _id: 0 }).lean();
    return new Set(applied.map(j => j.url));
}

module.exports = {
    connect, disconnect,
    upsertScrapedJobs, upsertFilteredJobs, upsertAlignedJobs,
    getScrapedJobs, getFilteredJobs, getAppliedUrls
};
