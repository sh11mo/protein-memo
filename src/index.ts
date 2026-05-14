import Fastify, { FastifyRequest } from "fastify";
import {
  messagingApi,
  validateSignature,
  WebhookEvent,
} from "@line/bot-sdk";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}
import { parseMessage } from "./parser.js";
import {
  addProtein,
  getGoal,
  getTotal,
  getWeekHistory,
  setGoal,
} from "./db/repository.js";

const app = Fastify({ logger: true });

const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
});

app.post("/webhook", {
  config: { rawBody: true },
  handler: async (req, reply) => {
    const signature = req.headers["x-line-signature"] as string;

    if (!validateSignature(req.rawBody as Buffer, channelSecret, signature)) {
      return reply.code(401).send("Invalid signature");
    }

    const body = req.body as { events: WebhookEvent[] };

    await Promise.all(
      body.events.map(async (event) => {
        if (event.type !== "message" || event.message.type !== "text") return;
        if (!event.source.userId) return;

        const userId = event.source.userId;
        const replyToken = event.replyToken;
        const text = event.message.text;
        const parsed = parseMessage(text);

        let replyText: string;

        switch (parsed.type) {
          case "add": {
            const total = await addProtein(userId, parsed.grams);
            const goal = await getGoal(userId);
            const sign = parsed.grams >= 0 ? "+" : "";
            const remaining = goal - total;
            replyText =
              `${sign}${parsed.grams}g 記録しました。\n今日の合計は ${total}g です。\n` +
              (remaining > 0
                ? `目標まであと ${remaining}g です。`
                : `目標の ${goal}g を達成しました！`);
            break;
          }
          case "query": {
            if (parsed.target === "week") {
              const goal = await getGoal(userId);
              const history = await getWeekHistory(userId);
              const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
              const lines = history.map((r) => {
                const [y, m, d] = (r.date as string).split("-").map(Number);
                const dow = weekdays[new Date(y, m - 1, d).getDay()];
                const achieved = r.total_grams >= goal ? " ✓" : "";
                return `${m}/${d}(${dow}): ${r.total_grams}g${achieved}`;
              });
              replyText =
                lines.length > 0
                  ? `過去7日間の記録:\n${lines.join("\n")}`
                  : "過去7日間の記録がありません。";
            } else {
              const offsetDays = parsed.target === "yesterday" ? -1 : 0;
              const label = parsed.target === "yesterday" ? "昨日" : "今日";
              const total = await getTotal(userId, offsetDays);
              replyText = `${label}の合計は ${total}g でした。`;
            }
            break;
          }
          case "set_goal": {
            await setGoal(userId, parsed.grams);
            replyText = `1日の目標を ${parsed.grams}g に設定しました。`;
            break;
          }
          default:
            replyText =
              "使い方：\n" +
              "・ 25 / 25g / +25g → プロテインを記録\n" +
              "・ -10g → 記録を取り消し\n" +
              "・ 今日は？ → 今日の合計\n" +
              "・ 昨日は？ → 昨日の合計\n" +
              "・ 今週 / 一週間 → 過去7日間の一覧\n" +
              "・ 目標 100g → 1日の目標を設定";
            break;
        }

        await client.replyMessage({
          replyToken,
          messages: [{ type: "text", text: replyText }],
        });
      })
    );

    return reply.code(200).send("OK");
  },
});

// Fastify v5 で rawBody を使うための addContentTypeParser
app.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (req, body, done) => {
    try {
      (req as any).rawBody = body;
      done(null, JSON.parse(body.toString()));
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
