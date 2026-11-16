/**
 * Cloudflare Pages Functions: POST /api/ai-explain
 * Cloudflare のダッシュボードで GEMINI_API_KEY（シークレット）を設定すること。
 */
import { handleAiExplain, type AiEnv } from '../../server/aiExplain'

export const onRequestPost = (ctx: { request: Request; env: AiEnv }) => handleAiExplain(ctx.request, ctx.env)
