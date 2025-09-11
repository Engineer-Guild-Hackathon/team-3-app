export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "now",
      description:
        "指定されたIANAタイムゾーンの現在日時をISO文字列で返す（例: Asia/Tokyo）。",
      parameters: {
        type: "object",
        properties: {
          tz: { type: "string", description: "IANAタイムゾーン（例: Asia/Tokyo）" },
        },
        required: ["tz"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calc",
      description:
        "四則演算（+ - * /）と括弧のみの式を評価し数値で返す。単位や関数は不可。",
      parameters: {
        type: "object",
        properties: {
          expr: { type: "string", description: "評価する数式（例: (2+3)*4/5 ）" },
        },
        required: ["expr"],
        additionalProperties: false,
      },
    },
  },
] as const;

export type ToolName = "now" | "calc";

// 実行器（本来は外部APIやDBアクセスなどを行う）
export function runTool(name: ToolName, args: any): string {
  if (name === "now") {
    const tz = args?.tz ?? "UTC";
    const d = new Date();
    // 簡易にISO相当を返す（厳密TZはライブラリ導入推奨）
    const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .replace("Z", "");
    return JSON.stringify({ tz, isoLocal });
  }
  if (name === "calc") {
    const expr = String(args?.expr ?? "");
    if (!/^[\d+\-*/().\s]+$/.test(expr)) {
      return JSON.stringify({ error: "unsupported characters" });
    }
    try {
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${expr});`)();
      if (typeof val !== "number" || !isFinite(val)) {
        return JSON.stringify({ error: "not a finite number" });
      }
      return JSON.stringify({ result: val });
    } catch (e) {
      return JSON.stringify({ error: String(e) });
    }
  }
  return JSON.stringify({ error: `unknown tool: ${name}` });
}
