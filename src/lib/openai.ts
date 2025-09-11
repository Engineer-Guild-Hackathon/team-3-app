import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

// 環境変数依存の初期化は import 時に行わない（ビルドを壊さないため）
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

function requireEnv(name: string, val?: string) {
  if (!val) throw new Error(`Missing env: ${name}`);
}

let client: AzureOpenAI | null = null;

export function getAOAI(): AzureOpenAI {
  if (client) return client;

  const endpoint =
    process.env.AZURE_AISERVICES_OPENAI_BASE ?? process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  // 必須チェックは実行時にのみ行う
  requireEnv("AZURE_AISERVICES_OPENAI_BASE or AZURE_OPENAI_ENDPOINT", endpoint);
  requireEnv("AZURE_OPENAI_DEPLOYMENT", deployment);

  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    "https://cognitiveservices.azure.com/.default"
  );

  client = new AzureOpenAI({
    endpoint: endpoint!,
    deployment: deployment!,
    apiVersion: API_VERSION,
    azureADTokenProvider,
  });

  return client;
}
