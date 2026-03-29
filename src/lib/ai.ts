const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

export async function generateCompletion(prompt: string, system?: string): Promise<string | null> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        system: system || 'You are a helpful operations assistant for a franchise management platform.',
        stream: false,
        options: { temperature: 0.3, num_predict: 500 },
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.response?.trim() || null;
  } catch {
    return null; // Ollama not running or timed out
  }
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
