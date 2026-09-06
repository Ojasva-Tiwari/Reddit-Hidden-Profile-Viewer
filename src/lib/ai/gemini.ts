import { GoogleGenAI, Type } from "@google/genai";
import { ProfileSummaryOutput, ProfileSummaryOutputSchema } from "./schemas";
import { AI_SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { CompactEvidenceRecord, DeterministicSignals } from "./evidence";

export interface GeminiGenerationResult {
  success: boolean;
  data?: ProfileSummaryOutput;
  error?: string;
  code?: string;
}

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const MAX_PROMPT_CHARS = 100_000;
const REQUEST_TIMEOUT_MS = 25_000;

const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    username: { type: Type.STRING },
    totalInsights: { type: Type.INTEGER },
    generatedAt: { type: Type.STRING },
    modelVersion: { type: Type.STRING },
    schemaVersion: { type: Type.STRING },
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          number: { type: Type.INTEGER },
          category: {
            type: Type.STRING,
            enum: [
              "PROFILE",
              "PREFERENCES",
              "LIFE_AND_TIMELINE",
              "PERSONALITY_AND_BEHAVIOUR",
              "INTERESTS_AND_PATTERNS",
              "INTERESTS",
              "MEDIA",
              "FOOD",
              "GAMES",
              "HOBBIES",
              "COMMUNITIES",
              "ACTIVITY",
              "COMMUNICATION",
              "TIMELINE",
              "NOTABLE_PUBLIC_EVENTS",
            ],
          },
          title: { type: Type.STRING },
          finding: { type: Type.STRING },
          classification: {
            type: Type.STRING,
            enum: ["EXPLICIT", "STRONGLY_SUPPORTED", "WEAK_INFERENCE", "INSUFFICIENT_EVIDENCE"],
          },
          confidence: {
            type: Type.STRING,
            enum: ["HIGH", "MEDIUM", "SPECULATIVE"],
          },
          evidenceIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          supportingEntities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          timeRange: { type: Type.STRING },
          subredditContext: { type: Type.STRING },
        },
        required: [
          "id",
          "number",
          "category",
          "title",
          "finding",
          "classification",
          "confidence",
          "evidenceIds",
        ],
      },
    },
  },
  required: [
    "username",
    "totalInsights",
    "generatedAt",
    "modelVersion",
    "schemaVersion",
    "insights",
  ],
};

export class GeminiClient {
  private apiKey: string | null = null;
  private modelName: string = DEFAULT_MODEL;
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.refreshConfig();
  }

  /**
   * Dynamically synchronizes client configuration with server environment variables.
   * Avoids freezing stale or null configuration from build-time module evaluation.
   */
  public refreshConfig(): void {
    const activeKey = process.env.GEMINI_API_KEY?.trim() || null;
    const activeModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

    if (activeKey !== this.apiKey || activeModel !== this.modelName || (!this.ai && activeKey)) {
      this.apiKey = activeKey;
      this.modelName = activeModel;
      if (this.apiKey) {
        try {
          this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        } catch (err: any) {
          console.warn("[GeminiClient] Could not initialize GoogleGenAI client:", err?.message || "Unknown error");
          this.ai = null;
        }
      } else {
        this.ai = null;
      }
    }
  }

  isConfigured(): boolean {
    this.refreshConfig();
    return Boolean(this.apiKey && this.ai);
  }

  getModelName(): string {
    this.refreshConfig();
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
    this.refreshConfig();

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

      if (prompt.length > MAX_PROMPT_CHARS) {
        return {
          success: false,
          code: "INPUT_TOO_LARGE",
          error: "Synthesized evidence payload exceeds maximum allowed size for AI analysis.",
        };
      }

      // Wrapped in explicit timeout with unref'd timer
      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const timeoutErr = new Error("Gemini generation request timed out after 25 seconds.");
          (timeoutErr as any).code = "AI_TIMEOUT";
          reject(timeoutErr);
        }, REQUEST_TIMEOUT_MS);
        if (timer.unref) {
          timer.unref();
        }
      });

      const requestPromise = this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: AI_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.2, // low temperature for high evidence fidelity
        },
      });

      let response: any;
      try {
        response = await Promise.race([requestPromise, timeoutPromise]);
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }

      const rawText = response.text || "";
      if (!rawText.trim()) {
        return {
          success: false,
          code: "MALFORMED_OUTPUT",
          error: "Gemini returned empty response text.",
        };
      }

      // Clean Markdown code blocks if model wrapped it in ```json ... ```
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch (parseErr: any) {
        return {
          success: false,
          code: "MALFORMED_OUTPUT",
          error: "Failed to parse structured JSON from Gemini response.",
        };
      }

      // Ensure modelVersion matches the active configured model
      parsedJson.modelVersion = this.modelName;

      const validated = ProfileSummaryOutputSchema.safeParse(parsedJson);
      if (!validated.success) {
        return {
          success: false,
          code: "SCHEMA_VALIDATION_FAILED",
          error: `AI output schema mismatch: ${validated.error.errors[0]?.message || "Invalid structure"}`,
        };
      }

      return {
        success: true,
        data: validated.data,
      };
    } catch (err: any) {
      // Map error types cleanly without exposing credentials or internal traces
      const errMsg = (err?.message || "").toLowerCase();
      const status = err?.status || err?.statusCode || 0;

      if (err?.code === "AI_TIMEOUT" || errMsg.includes("timed out") || errMsg.includes("timeout")) {
        return {
          success: false,
          code: "AI_TIMEOUT",
          error: "The AI request timed out. Please try again in a few moments.",
        };
      }

      if (
        status === 429 ||
        errMsg.includes("resource has been exhausted") ||
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("rate limit")
      ) {
        return {
          success: false,
          code: "RATE_LIMITED",
          error: "AI service rate limit or quota exceeded. Please wait a moment before trying again.",
        };
      }

      if (
        status === 404 ||
        errMsg.includes("404") ||
        errMsg.includes("not found") ||
        errMsg.includes("not_found")
      ) {
        return {
          success: false,
          code: "AI_PROVIDER_ERROR",
          error: "The configured Gemini model is currently unavailable. Please verify model configuration.",
        };
      }

      if (
        (status >= 500 && status < 600) ||
        errMsg.includes("500") ||
        errMsg.includes("503") ||
        errMsg.includes("unavailable") ||
        errMsg.includes("overloaded")
      ) {
        return {
          success: false,
          code: "AI_PROVIDER_ERROR",
          error: "Google Gemini service is temporarily experiencing difficulties. Please try again shortly.",
        };
      }

      if (
        status === 401 ||
        status === 403 ||
        errMsg.includes("api_key") ||
        errMsg.includes("apikey") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("forbidden")
      ) {
        return {
          success: false,
          code: "AI_UNAVAILABLE",
          error: "Gemini API authentication failed. Please verify that GEMINI_API_KEY is configured properly.",
        };
      }

      return {
        success: false,
        code: "GENERATION_ERROR",
        error: "An unexpected error occurred during AI analysis. Please try again later.",
      };
    }
  }
}

export const defaultGeminiClient = new GeminiClient();
