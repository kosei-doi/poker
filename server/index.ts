import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = 'claude-opus-5';

// 認証情報がなくてもサーバー自体は起動できるよう、クライアントは初回利用時に作る
let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

// フロントから送られてくるリクエスト
const PlanRequestSchema = z.object({
  preferences: z.object({
    area: z.string(),
    duration: z.string(),
    interests: z.array(z.string()),
    companion: z.string(),
    pace: z.string(),
    transport: z.string(),
    note: z.string().optional(),
    mustIncludeSpotId: z.string().optional(),
  }),
  spots: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      area: z.string(),
      description: z.string(),
      localTip: z.string(),
      bestTime: z.string(),
      stayMinutes: z.number(),
      tags: z.array(z.string()),
      localFootprints: z.number(),
      visitorFootprints: z.number(),
    }),
  ),
});

// Claude に返してもらう旅プランの形
const TripPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
  days: z.array(
    z.object({
      day: z.number(),
      theme: z.string(),
      items: z.array(
        z.object({
          time: z.string(),
          spotId: z.string().nullable(),
          title: z.string(),
          description: z.string(),
          localTip: z.string().nullable(),
          transport: z.string().nullable(),
          durationMin: z.number(),
        }),
      ),
    }),
  ),
  tips: z.array(z.string()),
});

const SYSTEM_PROMPT = `あなたは地方の穴場を知り尽くした旅のコンシェルジュです。
地元の人が投稿した「穴場スポット」のリストと旅行者の希望をもとに、その地域でしかできない体験を軸にした旅程を日本語で作ります。

方針:
- 旅程の中心には必ずリスト内のスポットを使い、その項目の spotId にはリストの id をそのまま入れる。リスト外の移動・食事・休憩は spotId を null にする。
- 有名観光地の定番ではなく、地元の人の足跡が多いスポットや localTip の内容を活かし、「地元の人に案内してもらったような旅」にする。
- 移動手段・同行者・ペースに無理がない時間配分にする（スポットの stayMinutes と移動時間を考慮）。
- description は旅行者がワクワクする一言＋そこで何をするかを2文程度で。localTip は地元の人の目線の小ワザ。
- 地域経済に貢献できる行動（地元の店での食事・買い物、体験への参加）を自然に織り込む。
- 時刻は "09:30" の形式で書く。`;

/** 利用者にそのまま見せてよいエラー */
class PlanError extends Error {}

async function generatePlan(body: z.infer<typeof PlanRequestSchema>) {
  const { preferences, spots } = body;
  const userMessage = `## 旅行者の希望
- エリア: ${preferences.area}
- 日程: ${preferences.duration}
- 興味: ${preferences.interests.join('、') || '特になし'}
- 同行者: ${preferences.companion}
- ペース: ${preferences.pace}
- 移動手段: ${preferences.transport}
- その他の要望: ${preferences.note || 'なし'}
- 必ず入れたいスポットのid: ${preferences.mustIncludeSpotId ?? 'なし'}

## 地元の人が投稿した穴場スポット（JSON）
${JSON.stringify(spots, null, 2)}

この条件で旅プランを作ってください。`;

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: betaZodOutputFormat(TripPlanSchema) },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  if (response.stop_reason === 'refusal') {
    throw new PlanError('AIがこのリクエストへの回答を控えました。条件を変えてお試しください。');
  }
  if (!response.parsed_output) {
    throw new PlanError('AIの応答を旅プランとして読み取れませんでした。');
  }
  return response.parsed_output;
}

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, { ok: true, model: MODEL });
  }

  if (req.method === 'POST' && req.url === '/api/plan') {
    let body: z.infer<typeof PlanRequestSchema>;
    try {
      body = PlanRequestSchema.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { error: 'リクエストの形式が正しくありません。' });
    }

    try {
      const plan = await generatePlan(body);
      return sendJson(res, 200, { plan });
    } catch (error) {
      console.error(error);
      if (error instanceof Anthropic.AuthenticationError) {
        return sendJson(res, 503, { error: 'APIキーが設定されていません（ANTHROPIC_API_KEY）。' });
      }
      if (error instanceof Anthropic.RateLimitError) {
        return sendJson(res, 429, { error: 'アクセスが集中しています。少し待ってから再度お試しください。' });
      }
      if (error instanceof Anthropic.APIError) {
        return sendJson(res, 502, { error: `AI APIでエラーが発生しました (${error.status ?? "接続エラー"})` });
      }
      if (error instanceof PlanError) {
        return sendJson(res, 500, { error: error.message });
      }
      // それ以外は主に認証情報が見つからないなどの設定の問題
      return sendJson(res, 503, { error: 'AIに接続できませんでした（server/.env の ANTHROPIC_API_KEY を確認してください）。' });
    }
  }

  sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`AI plan server listening on http://localhost:${PORT}`);
});
