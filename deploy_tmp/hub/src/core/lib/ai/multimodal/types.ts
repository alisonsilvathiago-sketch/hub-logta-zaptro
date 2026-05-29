/**
 * 🎛️ MULTIMODAL CAPABILITIES TYPES
 */

export interface MultimodalFile {
  name: string;
  size: number;
  type: string; // 'audio' | 'image' | 'pdf' | 'doc' | 'spreadsheet' | 'text'
  dataUrl?: string; // Preview link or base64 representation
}

export interface MultimodalParseResult {
  fileType: string;
  extractedText: string;
  metadata: Record<string, string | number>;
  suggestedRoute?: string;
  detectedEntities?: string[];
}

export interface MultimodalAIResponse {
  success: boolean;
  responseText: string;
  parseResult: MultimodalParseResult;
  latencyMs: number;
  agentName: string;
}
