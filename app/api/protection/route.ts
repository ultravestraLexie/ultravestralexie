// The Partnership Protection Center was removed by owner decision
// on 2026-11-22. Every method answers 410 Gone so old clients get a
// clear, final answer instead of a half-alive endpoint.
function gone() {
  return Response.json(
    { error: "This feature has been removed." },
    { status: 410 }
  );
}

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}

export async function PATCH() {
  return gone();
}

export async function DELETE() {
  return gone();
}
