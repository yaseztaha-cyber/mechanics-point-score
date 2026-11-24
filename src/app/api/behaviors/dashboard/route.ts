import { getBehaviorDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getBehaviorDashboardData();
  return Response.json(data);
}
