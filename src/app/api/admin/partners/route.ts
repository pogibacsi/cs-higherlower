import { NextResponse, type NextRequest } from "next/server";
import { createPartner, listPartners } from "@/lib/partners";

export async function GET() {
  return NextResponse.json(await listPartners());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  try {
    return NextResponse.json(await createPartner(body), { status: 201 });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Could not create partner.",
      { status: 400 }
    );
  }
}
