import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJob extends Document {
  title: string;
  company: string;
  url: string;
  jobDesc: string;
  tech_stack: string[];
  location: string | null;
  workArrangement: "remote" | "hybrid" | "in-person" | null;
  applied: boolean;
  filterRan: boolean;
  filterPassed: boolean;
  dismissed: boolean;
  scrapedAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  jobDesc: { type: String, default: "" },
  tech_stack: { type: [String], default: [] },
  location: { type: String, default: null },
  workArrangement: { type: String, enum: ["remote", "hybrid", "in-person", null], default: null },
  applied: { type: Boolean, default: false },
  filterRan: { type: Boolean, default: false },
  filterPassed: { type: Boolean, default: false },
  dismissed: { type: Boolean, default: false },
  scrapedAt: { type: Date, default: Date.now },
});

const Job: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>("Job", JobSchema);

export default Job;
