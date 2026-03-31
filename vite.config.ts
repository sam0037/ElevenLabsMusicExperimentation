import { defineConfig } from 'vite'
import path from 'path'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'

import react from '@vitejs/plugin-react'

const historyFilePath = path.resolve(__dirname, 'data/history.json')
const audioDirPath = path.resolve(__dirname, 'data/audio')
const apiLogsDirPath = path.resolve(__dirname, 'api_logs')

interface HistoryStore {
  chatConversations?: unknown[]
  compositionPlans?: unknown[]
  musicGenerations?: unknown[]
  updatedAt?: string
}

async function ensureHistoryFile() {
  await fs.mkdir(path.dirname(historyFilePath), { recursive: true })
  if (!existsSync(historyFilePath)) {
    await fs.writeFile(historyFilePath, JSON.stringify({}, null, 2), 'utf-8')
  }
}

async function ensureAudioDir() {
  await fs.mkdir(audioDirPath, { recursive: true })
}

async function ensureApiLogsDir() {
  await fs.mkdir(apiLogsDirPath, { recursive: true })
}

async function readHistoryFile(): Promise<HistoryStore> {
  await ensureHistoryFile()
  try {
    const raw = await fs.readFile(historyFilePath, 'utf-8')
    if (!raw.trim()) {
      return {}
    }
    return JSON.parse(raw) as HistoryStore
  } catch {
    return {}
  }
}

async function writeHistoryFile(data: HistoryStore) {
  await ensureHistoryFile()
  const tempPath = `${historyFilePath}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tempPath, historyFilePath)
}

function formatLocalDate(epochMs: number) {
  const date = new Date(epochMs)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function writeApiLogFile(entry: Record<string, unknown>) {
  await ensureApiLogsDir()

  const apiName = sanitizePathSegment(String(entry.apiName || 'unknown-api'))
  const epoch = Number(entry.fileEpochMs || Date.now())
  const dateDir = formatLocalDate(epoch)
  const targetDir = path.join(apiLogsDirPath, dateDir, apiName)

  await fs.mkdir(targetDir, { recursive: true })
  await fs.writeFile(
    path.join(targetDir, `${epoch}.json`),
    JSON.stringify(entry, null, 2),
    'utf-8',
  )
}

function localHistoryPlugin() {
  let writeQueue = Promise.resolve()
  let logWriteQueue = Promise.resolve()

  return {
    name: 'local-history-api',
    configureServer(server: any) {
      server.middlewares.use('/api/history', async (req: any, res: any) => {
        if (req.method === 'GET') {
          const data = await readHistoryFile()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on('end', async () => {
            try {
              const partial = body ? (JSON.parse(body) as HistoryStore) : {}
              // Serialize writes to avoid concurrent updates corrupting JSON on disk.
              await (writeQueue = writeQueue.then(async () => {
                const current = await readHistoryFile()
                const merged: HistoryStore = {
                  ...current,
                  ...partial,
                  updatedAt: new Date().toISOString(),
                }
                await writeHistoryFile(merged)
              }))
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (error) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 400
              res.end(
                JSON.stringify({
                  ok: false,
                  error: error instanceof Error ? error.message : 'Invalid payload',
                }),
              )
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })

      server.middlewares.use('/api/logs', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        req.on('end', async () => {
          try {
            const entry = body ? (JSON.parse(body) as Record<string, unknown>) : {}
            await (logWriteQueue = logWriteQueue.then(() => writeApiLogFile(entry)))
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
          } catch (error) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : 'Invalid log payload',
              }),
            )
          }
        })
      })

      server.middlewares.use('/api/audio', async (req: any, res: any) => {
        const requestUrl = new URL(req.url || '', 'http://localhost')

        if (req.method === 'POST') {
          const filenameParam = requestUrl.searchParams.get('filename') || `audio_${Date.now()}.mp3`
          const safeFilename = path.basename(filenameParam).replace(/[^a-zA-Z0-9._-]/g, '_')
          const filename = safeFilename.endsWith('.mp3') ? safeFilename : `${safeFilename}.mp3`

          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })
          req.on('end', async () => {
            try {
              const audioBuffer = Buffer.concat(chunks)
              await ensureAudioDir()
              const fullAudioPath = path.join(audioDirPath, filename)
              await fs.writeFile(fullAudioPath, audioBuffer)
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(
                JSON.stringify({
                  ok: true,
                  audioUrl: `/api/audio/${encodeURIComponent(filename)}`,
                  audioPath: `data/audio/${filename}`,
                }),
              )
            } catch (error) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 500
              res.end(
                JSON.stringify({
                  ok: false,
                  error: error instanceof Error ? error.message : 'Failed to save audio',
                }),
              )
            }
          })
          return
        }

        if (req.method === 'GET') {
          try {
            const encodedName = requestUrl.pathname.replace(/^\//, '')
            if (!encodedName) {
              res.statusCode = 400
              res.end()
              return
            }

            const decodedName = decodeURIComponent(encodedName)
            const safeName = path.basename(decodedName)
            const fullAudioPath = path.join(audioDirPath, safeName)
            const audioData = await fs.readFile(fullAudioPath)

            res.setHeader('Content-Type', 'audio/mpeg')
            res.statusCode = 200
            res.end(audioData)
          } catch {
            res.statusCode = 404
            res.end()
          }
          return
        }

        res.statusCode = 405
        res.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    localHistoryPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
