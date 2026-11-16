/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleAiExplain } from './server/aiExplain'

/**
 * 開発サーバー用: /api/ai-explain を本番（Cloudflare Pages Functions）と同じロジックで処理する。
 * GEMINI_API_KEY は .env.local から読み込み、クライアントには公開しない（VITE_ 接頭辞なし）。
 */
function aiDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'ai-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-explain', async (req, res) => {
        const chunks: Buffer[] = []
        for await (const c of req) chunks.push(c as Buffer)
        const request = new Request('http://localhost/api/ai-explain', {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        })
        const response = await handleAiExplain(request, {
          GEMINI_API_KEY: env.GEMINI_API_KEY,
          GEMINI_MODEL: env.GEMINI_MODEL,
        })
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(await response.text())
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), aiDevApi(env)],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    },
  }
})
