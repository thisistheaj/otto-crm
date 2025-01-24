import { json } from "@remix-run/node";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY!;

export function requireApiKey(request: Request) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    throw json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
} 