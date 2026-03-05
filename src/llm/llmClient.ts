/** Backward-compat token; implementation is OllamaClient. */
export abstract class LlmClient {
  abstract generate(model: string, prompt: string, options?: { stream?: boolean }): Promise<string>;
  abstract chat(model: string, messages: Array<{ role: string; content: string }>): Promise<string>;
  abstract generateWithImage(model: string, prompt: string, imageBase64: string): Promise<string>;
}
