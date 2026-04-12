const mongoose = require("mongoose");

const SlugSchema = new mongoose.Schema({
    name: { type: String, required: true }
});

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    jobDesc: { type: String },
    tech_stack: { type: [String], default: [] },
    location: { type: String, default: null },
    workArrangement: { type: String, enum: ["remote", "hybrid", "in-person", null], default: null },
    applied: { type: Boolean, default: false },
    filterRan: { type: Boolean, default: false },
    filterPassed: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now }
});

const Slug = mongoose.model("Slug", SlugSchema);
const Job = mongoose.model("Job", JobSchema);

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

async function renewSlugs(slugs) {
    await Slug.deleteMany({});
    const docs = slugs.map(slug => ({ name: slug }));
    return Slug.insertMany(docs);
}

async function upsertScrapedJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: {
                $set: {
                    title: job.title,
                    company: job.company,
                    jobDesc: job.jobDesc ?? null,
                    scrapedAt: new Date()
                },
            },
            upsert: true
        }
    }));

    return Job.bulkWrite(ops);
}

async function upsertFilteredJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: {
                $set: {
                    title: job.title,
                    company: job.company,
                    tech_stack: job.tech_stack,
                    location: job.location ?? null,
                    workArrangement: job.workArrangement ?? null,
                    filterRan: true,
                    filterPassed: true,
                },
                $setOnInsert: { applied: false, scrapedAt: new Date() }
            },
            upsert: true
        }
    }));

    return Job.bulkWrite(ops);
}


async function getSlugs() {
    const docs = await Slug.find().lean();
    return docs.map(s => s.name);
}

async function getScrapedJobs() {
    return await Job.find().lean();
}

async function getFilteredJobs() {
    return await Job.find({ filterPassed: true }).lean();
}

async function getAppliedUrls() {
    const applied = await Job.find({ applied: true }, { url: 1, _id: 0 }).lean();
    return new Set(applied.map(j => j.url));
}

module.exports = {
    connect, disconnect,
    renewSlugs, upsertScrapedJobs, upsertFilteredJobs,
    getSlugs, getScrapedJobs, getFilteredJobs, getAppliedUrls
};
