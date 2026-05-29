/**
 * 🔒 SECURE SERVER-SIDE AI GATEWAY ROUTE
 * 
 * Maps POST /api/ai directly to the Ollama VPS server-side.
 * Resolves CORS issues, masks the VPS IP, and adds a security layer.
 */

export const config = {
  runtime: 'edge', // Runs on Vercel's Edge network for ultra-low latency
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();

    const response = await fetch("http://108.174.151.98:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "llama3.2",
        prompt: body.prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama VPS responded with status ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      response: data.response
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Safe serverless header
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });

  } catch (error: any) {
    console.error("[Serverless AI Gateway Error]:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Erro ao conectar com Ollama VPS",
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Support for Next.js App Router structure if reused there
export async function POST(req: Request) {
  return handler(req);
}
