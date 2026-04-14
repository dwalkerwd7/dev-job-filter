import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const job = await Job.findByIdAndUpdate(
        id,
        { $set: body },
        { returnDocument: "after" }
    ).lean();

    if (!job) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    return NextResponse.json(job);
};
