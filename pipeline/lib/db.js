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

function logResult(res, label) {
    if ((res.upsertedCount ?? 0) + (res.modifiedCount ?? 0) > 0) {
        console.log(`[db] ${label}: ${res.upsertedCount} inserted, ${res.modifiedCount} modified.`);
    }
}

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

    const res = await Job.bulkWrite(ops);
    logResult(res, 'scraped');
    return res;
}

async function upsertStackPassedJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: {
                $set: {
                    title: job.title,
                    company: job.company,
                    tech_stack: job.tech_stack,
                    filterRan: true,
                    filterPassed: true,
                },
                $setOnInsert: { applied: false, scrapedAt: new Date() }
            },
            upsert: true
        }
    }));

    const res = await Job.bulkWrite(ops);
    logResult(res, 'stack-passed');
    return res;
}

async function upsertTechStackProgress(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: { $set: { tech_stack: job.tech_stack } },
        }
    }));

    const res = await Job.bulkWrite(ops);
    logResult(res, 'tech stack progress');
    return res;
}

async function upsertPreFilteredJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: { $set: { filterRan: true, filterPassed: false } },
        }
    }));

    const res = await Job.bulkWrite(ops);
    logResult(res, 'pre-filtered');
    return res;
}

async function upsertInfoJobs(jobs) {
    const ops = jobs.map(job => ({
        updateOne: {
            filter: { url: job.url },
            update: {
                $set: {
                    location: job.location ?? null,
                    workArrangement: job.workArrangement ?? null,
                }
            },
        }
    }));

    const res = await Job.bulkWrite(ops);
    logResult(res, 'info');
    return res;
}


async function getSlugs() {
    const docs = await Slug.find().lean();
    return docs.map(s => s.name);
}

async function getScrapedJobs() {
    return await Job.find().lean();
}

async function getUnfilteredJobs() {
    return await Job.find({ filterRan: false }).lean();
}

async function getStackPassedJobs() {
    return await Job.find({ filterPassed: true }).lean();
}

async function getAppliedUrls() {
    const applied = await Job.find({ applied: true }, { url: 1, _id: 0 }).lean();
    return new Set(applied.map(j => j.url));
}

async function deleteAll() {
    return await Job.deleteMany({})
}

module.exports = {
    connect, disconnect,
    renewSlugs, upsertScrapedJobs, upsertStackPassedJobs, upsertTechStackProgress, upsertPreFilteredJobs, upsertInfoJobs,
    getSlugs, getScrapedJobs, getUnfilteredJobs, getStackPassedJobs, getAppliedUrls,
    deleteAll
};
