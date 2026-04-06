import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJob extends Document {
  title: string;
  company: string;
  extractedText: string;
  tech_stack: string[];
  employee_count: number;
  embedding: number[];
  matchScore: number;
  applied: boolean;
  scrapedAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  extractedText: { type: String, default: "" },
  tech_stack: { type: [String], default: [] },
  employee_count: { type: Number, default: 0 },
  embedding: { type: [Number], default: [] },
  matchScore: { type: Number, default: 0 },
  applied: { type: Boolean, default: false },
  scrapedAt: { type: Date, default: Date.now },
});

const Job: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>("Job", JobSchema);

export default Job;
