/**
 * evolutionService.ts
 * Integração com a Evolution API para disparos de WhatsApp.
 */

const EVOLUTION_BASE_URL = 'http://5.78.184.161:8080';
const EVOLUTION_API_KEY  = '429683fb-9883-4316-90f1-17f16cc4a3c6';
const DEFAULT_INSTANCE   = 'Zaptro_Master'; // Nome da instância master no Evolution

export async function sendEvolutionMessage(data: {
  number: string;
  text: string;
  instance?: string;
}) {
  const instance = data.instance || DEFAULT_INSTANCE;
  const number = data.number.replace(/\D/g, ''); // Garante que só tenha números

  try {
    const res = await fetch(`${EVOLUTION_BASE_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: number,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: true
        },
        textMessage: {
          text: data.text
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[EVOLUTION ERROR]', err);
      return { success: false, error: err };
    }

    return { success: true, data: await res.json() };
  } catch (error) {
    console.error('[EVOLUTION FETCH ERROR]', error);
    return { success: false, error };
  }
}

/**
 * Envia uma imagem ou arquivo
 */
export async function sendEvolutionMedia(data: {
  number: string;
  mediaUrl: string;
  caption?: string;
  instance?: string;
  fileName?: string;
  mediaType: 'image' | 'video' | 'document';
}) {
  const instance = data.instance || DEFAULT_INSTANCE;
  const number = data.number.replace(/\D/g, '');

  try {
    const res = await fetch(`${EVOLUTION_BASE_URL}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: number,
        mediaMessage: {
          mediatype: data.mediaType,
          caption: data.caption,
          media: data.mediaUrl,
          fileName: data.fileName || 'arquivo'
        }
      })
    });

    return { success: res.ok, data: await res.json() };
  } catch (error) {
    return { success: false, error };
  }
}
