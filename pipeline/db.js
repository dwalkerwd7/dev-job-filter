const mongoose = require("mongoose");

const FilteredJobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    extractedText: { type: String },
    tech_stack: { type: [String], default: [] },
    employee_count: { type: Number, default: null },
    embedding: { type: [Number], default: [] },
    matchScore: { type: Number, default: null },
    applied: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now }
});

const RawJobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    extractedText: { type: String },
    scrapedAt: { type: Date, default: Date.now() }
});

const RawJob = mongoose.model("RawJob", RawJobSchema);
const FilteredJob = mongoose.model("FilteredJob", FilteredJobSchema);

async function connect() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
}

async function disconnect() {
    await mongoose.disconnect();
}

async function upsertRawJobs(jobs) {
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

    return RawJob.bulkWrite(ops); // updates existing records and adds new ones
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

async function getAppliedUrls() {
    const applied = await FilteredJob.find({ applied: true }, { url: 1, _id: 0 }).lean();
    return new Set(applied.map(j => j.url));
}

module.exports = { connect, disconnect, upsertRawJobs, upsertFilteredJobs, getAppliedUrls, RawJob, FilteredJob };
