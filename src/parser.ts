export type ParsedMessage =
  | { type: "add"; grams: number }
  | { type: "query"; target: "today" | "yesterday" | "week" }
  | { type: "set_goal"; grams: number }
  | { type: "unknown" };

export function parseMessage(text: string): ParsedMessage {
  const normalized = text.trim().replace(/\s+/g, " ");

  // 目標設定: 「目標 100」「目標 100g」「目標を100gに設定」
  const goalMatch = normalized.match(/^目標[をは]?\s*[：:]?\s*([+-]?\d+)\s*g?/);
  if (goalMatch) {
    return { type: "set_goal", grams: parseInt(goalMatch[1], 10) };
  }

  // クエリ: 今週 / 一週間
  if (/今週|一週間|週間/.test(normalized)) {
    return { type: "query", target: "week" };
  }

  // クエリ: 今日
  if (/今日/.test(normalized)) {
    return { type: "query", target: "today" };
  }

  // クエリ: 昨日
  if (/昨日/.test(normalized)) {
    return { type: "query", target: "yesterday" };
  }

  // 数値入力: 「25」「25g」「+15」「+15g」「-10」「-10g」「あと 25」「あと 25g」
  const numMatch = normalized.match(/^(?:あと\s*)?([+-]?\d+)\s*g?$/);
  if (numMatch) {
    return { type: "add", grams: parseInt(numMatch[1], 10) };
  }

  return { type: "unknown" };
}
