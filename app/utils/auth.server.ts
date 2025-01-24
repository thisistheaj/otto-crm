export async function verifyApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  
  if (!apiKey) {
    throw new Response("API key is required", { status: 401 });
  }

  if (apiKey !== process.env.API_KEY) {
    throw new Response("Invalid API key", { status: 401 });
  }
} 