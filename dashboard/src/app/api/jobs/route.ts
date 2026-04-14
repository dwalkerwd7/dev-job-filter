import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export async function GET() {
  await connectDB();
  const jobs = await Job.find({}).sort({ scrapedAt: -1 }).lean();
  return NextResponse.json(jobs);
}
