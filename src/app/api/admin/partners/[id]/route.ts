import { NextResponse, type NextRequest } from "next/server";
import { updatePartner } from "@/lib/partners";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => null);
  const { id } = await params;
  try {
    const partner = await updatePartner(id, body);
    if (!partner) return new NextResponse("Partner not found.", { status: 404 });
    return NextResponse.json(partner);
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Could not update partner.",
      { status: 400 }
    );
  }
}
