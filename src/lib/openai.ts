import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

const endpoint =
  process.env.AZURE_AISERVICES_OPENAI_BASE ?? process.env.AZURE_OPENAI_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

// 必須チェック
function requireEnv(name: string, val?: string) {
  if (!val) throw new Error(`Missing env: ${name}`);
}
requireEnv("AZURE_AISERVICES_OPENAI_BASE or AZURE_OPENAI_ENDPOINT", endpoint);
requireEnv("AZURE_OPENAI_DEPLOYMENT", deployment);

// Entra ID でのトークン発行 (スコープは Azure OpenAI 共通)
const credential = new DefaultAzureCredential();
const azureADTokenProvider = getBearerTokenProvider(
  credential,
  "https://cognitiveservices.azure.com/.default"
); // 重要: Entra 認証は custom subdomain が必須

export const aoai = new AzureOpenAI({
  endpoint, // 例: https://<custom-subdomain>.openai.azure.com/
  deployment, // 例: gpt-5-mini（＝デプロイメント名）
  apiVersion,
  azureADTokenProvider,
}); // getBearerTokenProvider による JS v4 の推奨実装 :contentReference[oaicite:2]{index=2}
