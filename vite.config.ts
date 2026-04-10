import { defineConfig } from 'vite'
import path from 'path'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'

import react from '@vitejs/plugin-react'

const historyFilePath = path.resolve(__dirname, 'data/history.json')
const audioDirPath = path.resolve(__dirname, 'data/audio')
const apiLogsDirPath = path.resolve(__dirname, 'api_logs')
const myPrayersClubDownloadsDirPath = path.resolve(__dirname, 'data/myprayersclub_downloads')

interface HistoryStore {
  chatConversations?: unknown[]
  compositionPlans?: unknown[]
  musicGenerations?: unknown[]
  updatedAt?: string
}

type MyPrayersClubGeneratedMusicMetadata = {
  toolId?: string
  feeling?: string
  root?: string
  tempo?: number
  duration?: string
  fileSize?: string
  generatedAt?: string
  processingTime?: string
}

type MyPrayersClubTrackSummary = {
  folderName: string
  folderPath: string
  audioPath: string
  songName: string
  toolId: string
  feeling: string
  key: string
  bpm: number | null
  duration: string
  size: string
  generatedAt: string
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

async function ensureMyPrayersClubDownloadsDir() {
  await fs.mkdir(myPrayersClubDownloadsDirPath, { recursive: true })
}

async function readJsonFile(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return raw.trim() ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

async function listMyPrayersClubTracks(toolId?: string): Promise<{ tracks: MyPrayersClubTrackSummary[]; toolIds: string[] }> {
  await ensureMyPrayersClubDownloadsDir()

  const entries = await fs.readdir(myPrayersClubDownloadsDirPath, { withFileTypes: true })
  const trackSummaries = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const folderName = entry.name
        const folderPath = path.join(myPrayersClubDownloadsDirPath, folderName)
        const [folderItems, step1, step4, stats] = await Promise.all([
          fs.readdir(folderPath, { withFileTypes: true }),
          readJsonFile(path.join(folderPath, 'step1_music_parameters.json')),
          readJsonFile(path.join(folderPath, 'step4_generated_music.json')),
          fs.stat(folderPath),
        ])

        const audioEntry = folderItems.find((item) => item.isFile() && /\.(mp3|wav|m4a|ogg)$/i.test(item.name))
        if (!audioEntry) {
          return null
        }

        const audioRelativePath = `data/myprayersclub_downloads/${folderName}/${audioEntry.name}`
        const audioStats = await fs.stat(path.join(folderPath, audioEntry.name))
        const generatedMusic = (step4 ?? {}) as MyPrayersClubGeneratedMusicMetadata
        const parameters = (step1 ?? {}) as { key?: string; tempo_bpm?: number }
        const generatedAt = String(generatedMusic.generatedAt || stats.mtime.toISOString())
        const summary: MyPrayersClubTrackSummary = {
          folderName,
          folderPath: `data/myprayersclub_downloads/${folderName}`,
          audioPath: audioRelativePath,
          songName: folderName,
          toolId: String(generatedMusic.toolId || ''),
          feeling: String(generatedMusic.feeling || ''),
          key: String(generatedMusic.root || parameters.key || ''),
          bpm: typeof generatedMusic.tempo === 'number' ? generatedMusic.tempo : typeof parameters.tempo_bpm === 'number' ? parameters.tempo_bpm : null,
          duration: String(generatedMusic.duration || 'N/A'),
          size: String(generatedMusic.fileSize || formatBytes(audioStats.size)),
          generatedAt,
        }

        return summary
      }),
  )

  const allTracks = trackSummaries
    .filter((track): track is MyPrayersClubTrackSummary => Boolean(track))
  const tracks = allTracks
    .filter((track) => !toolId || track.toolId === toolId)
    .sort((left, right) => new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime())

  const toolIds = [...new Set(allTracks
    .map((track) => track.toolId)
    .filter(Boolean))]
    .sort()

  return { tracks, toolIds }
}

async function getMyPrayersClubTrack(folderName: string) {
  await ensureMyPrayersClubDownloadsDir()

  const safeFolderName = sanitizePathSegment(folderName)
  const folderPath = path.join(myPrayersClubDownloadsDirPath, safeFolderName)
  const folderItems = await fs.readdir(folderPath, { withFileTypes: true })
  const audioEntry = folderItems.find((item) => item.isFile() && /\.(mp3|wav|m4a|ogg)$/i.test(item.name))

  if (!audioEntry) {
    throw new Error('Saved track audio file not found')
  }

  const [parameters, compositionPlan, elevenLabsPlan, generatedMusic] = await Promise.all([
    readJsonFile(path.join(folderPath, 'step1_music_parameters.json')),
    readJsonFile(path.join(folderPath, 'step2_composition_planner.json')),
    readJsonFile(path.join(folderPath, 'step3_elevenlabs_composition_plan.json')),
    readJsonFile(path.join(folderPath, 'step4_generated_music.json')),
  ])

  return {
    folderName: safeFolderName,
    audioPath: `data/myprayersclub_downloads/${safeFolderName}/${audioEntry.name}`,
    parameters: parameters ?? {},
    compositionPlan: compositionPlan ?? {},
    elevenLabsPlan: elevenLabsPlan ?? {},
    generatedMusic: generatedMusic ?? {},
  }
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

      server.middlewares.use('/api/myprayersclub-export', async (req: any, res: any) => {
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
            const payload = body
              ? (JSON.parse(body) as {
                  folderName?: string
                  audioBase64?: string
                  audioFileName?: string
                  parameters?: unknown
                  compositionPlan?: unknown
                  elevenLabsPlan?: unknown
                  generatedMusic?: unknown
                })
              : {}

            const folderName = sanitizePathSegment(payload.folderName || `bundle_${Date.now()}`)
            const targetDir = path.join(myPrayersClubDownloadsDirPath, folderName)
            const audioFileName = sanitizePathSegment(payload.audioFileName || 'generated_music.mp3')
            const audioBase64 = payload.audioBase64 || ''

            await ensureMyPrayersClubDownloadsDir()
            await fs.mkdir(targetDir, { recursive: true })

            const files: string[] = []

            await fs.writeFile(
              path.join(targetDir, 'step1_music_parameters.json'),
              JSON.stringify(payload.parameters ?? {}, null, 2),
              'utf-8',
            )
            files.push(`data/myprayersclub_downloads/${folderName}/step1_music_parameters.json`)

            await fs.writeFile(
              path.join(targetDir, 'step2_composition_planner.json'),
              JSON.stringify(payload.compositionPlan ?? {}, null, 2),
              'utf-8',
            )
            files.push(`data/myprayersclub_downloads/${folderName}/step2_composition_planner.json`)

            await fs.writeFile(
              path.join(targetDir, 'step3_elevenlabs_composition_plan.json'),
              JSON.stringify(payload.elevenLabsPlan ?? {}, null, 2),
              'utf-8',
            )
            files.push(`data/myprayersclub_downloads/${folderName}/step3_elevenlabs_composition_plan.json`)

            await fs.writeFile(
              path.join(targetDir, 'step4_generated_music.json'),
              JSON.stringify(payload.generatedMusic ?? {}, null, 2),
              'utf-8',
            )
            files.push(`data/myprayersclub_downloads/${folderName}/step4_generated_music.json`)

            const audioBuffer = Buffer.from(audioBase64, 'base64')
            await fs.writeFile(path.join(targetDir, audioFileName), audioBuffer)
            files.push(`data/myprayersclub_downloads/${folderName}/${audioFileName}`)

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(
              JSON.stringify({
                ok: true,
                folderPath: `data/myprayersclub_downloads/${folderName}`,
                audioPath: `data/myprayersclub_downloads/${folderName}/${audioFileName}`,
                files,
              }),
            )
          } catch (error) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 500
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to export MyPrayersClub bundle',
              }),
            )
          }
        })
      })

      server.middlewares.use('/api/myprayersclub-tracks', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end()
          return
        }

        try {
          const requestUrl = new URL(req.url || '', 'http://localhost')
          const toolId = requestUrl.searchParams.get('toolId') || undefined
          const data = await listMyPrayersClubTracks(toolId)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ ok: true, ...data }))
        } catch (error) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : 'Failed to list MyPrayersClub tracks',
            }),
          )
        }
      })

      server.middlewares.use('/api/myprayersclub-track', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end()
          return
        }

        try {
          const requestUrl = new URL(req.url || '', 'http://localhost')
          const folderName = requestUrl.searchParams.get('folderName')
          if (!folderName) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: 'folderName is required' }))
            return
          }

          const track = await getMyPrayersClubTrack(folderName)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ ok: true, track }))
        } catch (error) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : 'Failed to load MyPrayersClub track',
            }),
          )
        }
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
