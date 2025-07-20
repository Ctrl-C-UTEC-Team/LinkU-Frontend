import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID no configurado' },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key no configurada' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error obteniendo URL firmada:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error obteniendo URL firmada' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error: any) {
    console.error('Error en ruta get-signed-url:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 