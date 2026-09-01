import { GoogleGenAI } from "@google/genai";
import { ProfileSummaryOutput, ProfileSummaryOutputSchema } from "./schemas";
import { AI_SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { CompactEvidenceRecord, DeterministicSignals } from "./evidence";

export interface GeminiGenerationResult {
  success: boolean;
  data?: ProfileSummaryOutput;
  error?: string;
  code?: string;
}

export class GeminiClient {
  private apiKey: string | null;
  private modelName: string;
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    if (this.apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err: any) {
        console.warn(`[GeminiClient] Could not initialize GoogleGenAI: ${err.message}`);
      }
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.ai);
  }

  getModelName(): string {
    return this.modelName;
  }

  /**
   * Generates structured 30 Things profile summary using Gemini.
   */
  async generateProfileSummary(
    username: string,
    signals: DeterministicSignals,
    evidence: CompactEvidenceRecord[]
  ): Promise<GeminiGenerationResult> {
    if (!this.isConfigured() || !this.ai) {
      return {
        success: false,
        code: "AI_UNAVAILABLE",
        error: "GEMINI_API_KEY is not configured on the server.",
      };
    }

    if (evidence.length === 0) {
      return {
        success: false,
        code: "INSUFFICIENT_DATA",
        error: "Insufficient historical evidence to synthesize profile insights.",
      };
    }

    try {
      const prompt = buildUserPrompt(username, signals, evidence);

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: AI_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2, // low temperature for high evidence fidelity
        },
      });

      const rawText = response.text || "";
      if (!rawText.trim()) {
        return {
          success: false,
          code: "MALFORMED_OUTPUT",
          error: "Gemini returned empty response text.",
        };
      }

      // Clean Markdown code blocks if model wrapped it in ```json
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsedJson = JSON.parse(cleaned);

      // Ensure modelVersion matches the active configured model
      parsedJson.modelVersion = this.modelName;

      const validated = ProfileSummaryOutputSchema.safeParse(parsedJson);
      if (!validated.success) {
        return {
          success: false,
          code: "SCHEMA_VALIDATION_FAILED",
          error: `AI output schema mismatch: ${validated.error.errors[0].message}`,
        };
      }

      return {
        success: true,
        data: validated.data,
      };
    } catch (err: any) {
      console.error(`[GeminiClient] Error calling Gemini: ${err.message}`);
      return {
        success: false,
        code: "GENERATION_ERROR",
        error: err.message,
      };
    }
  }
}

export const defaultGeminiClient = new GeminiClient();
