/**
 * 🧠 HUB AI GATEWAY CLIENT
 * 
 * Centraliza as chamadas de Inteligência Artificial através do Hub Master.
 * Isso garante que todos os sistemas (Logta, Zaptro, LogDock) usem a mesma
 * infraestrutura, permitindo controle de créditos, logs e segurança.
 */

export interface AIResponse {
  success: boolean;
  response: string;
  error?: string;
  details?: any;
}

export async function askHubAI(prompt: string, model = "llama3.2"): Promise<AIResponse> {
  // Tenta pegar a URL do Hub das variáveis de ambiente ou usa o padrão local
  const hubUrl = (import.meta.env.VITE_HUB_URL as string) || 'http://localhost:5175';
  
  // Limpa a barra final se existir
  const cleanHubUrl = hubUrl.replace(/\/$/, '');

  try {
    const response = await fetch(`${cleanHubUrl}/api/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        response: '',
        error: errorData.error || `Erro na API do Hub (Status ${response.status})`,
        details: errorData.details
      };
    }

    const data = await response.json();
    return {
      success: true,
      response: data.response
    };
  } catch (error: any) {
    console.error("[Hub AI Gateway Client Error]:", error);
    return {
      success: false,
      response: '',
      error: "Falha na conexão com o Cérebro Central (Hub Master)",
      details: error.message
    };
  }
}
