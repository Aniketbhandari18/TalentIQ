import { embedMany } from "ai";
import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";

const embeddingModel = google.embedding("gemini-embedding-001");

export async function generateEmbeddings(values: string[]) {
  if (values.length === 0) {
    return [];
  }

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values,
    maxParallelCalls: 2,
    providerOptions: {
      google: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      } satisfies GoogleEmbeddingModelOptions,
    },
  });

  return embeddings;
}
