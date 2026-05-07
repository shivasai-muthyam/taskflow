import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  API_PORT: z.string().default('4000'),
  PORT: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
})

const env = envSchema.parse(process.env)
const app = express()

const allowedOriginPatterns = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/, /^https:\/\/.*\.railway\.app$/]
const allowedOrigins = (env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      const ok = allowedOrigins.includes(origin) || allowedOriginPatterns.some((pattern) => pattern.test(origin))
      return callback(ok ? null : new Error(`CORS blocked origin: ${origin}`), ok)
    },
    credentials: true,
  }),
)
app.use(express.json())

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['planned', 'active', 'on_hold', 'completed']),
})

const taskSchema = z.object({
  title: z.string().min(2),
  project_id: z.string().uuid(),
  assignee_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'completed', 'overdue']),
})

const memberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'member']).default('member'),
})

type AuthedRequest = express.Request & { userId?: string }

const withAuth = async (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' })

  const token = auth.replace('Bearer ', '')
  const userClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ error: 'Invalid auth token' })

  req.userId = data.user.id
  ;(req as AuthedRequest & { userClient: typeof userClient }).userClient = userClient
  next()
}

type UserClient = ReturnType<typeof createClient>
const getRole = async (userClient: UserClient, userId: string) => {
  const { data } = await userClient.from('profiles').select('role').eq('id', userId).single()
  return data?.role as 'admin' | 'member' | undefined
}

app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/', (_, res) => res.send('REST API is running. Try GET /health or /api/health'))

app.get('/api/projects', withAuth, async (req: AuthedRequest, res) => {
  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const { data, error } = await userClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data ?? [])
})

app.post('/api/projects', withAuth, async (req: AuthedRequest, res) => {
  const parsed = projectSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const role = await getRole(userClient, req.userId!)
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const payload = { ...parsed.data, owner_id: req.userId, progress: 0 }
  const { data, error } = await userClient.from('projects').insert(payload).select().single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
})

app.get('/api/projects/:projectId/members', withAuth, async (req: AuthedRequest, res) => {
  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const { data, error } = await userClient
    .from('project_members')
    .select('user_id, role, profiles(full_name,email,avatar_url,role)')
    .eq('project_id', req.params.projectId)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data ?? [])
})

app.post('/api/projects/:projectId/members', withAuth, async (req: AuthedRequest, res) => {
  const parsed = memberSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const role = await getRole(userClient, req.userId!)
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const { error } = await userClient.from('project_members').upsert(
    { project_id: req.params.projectId, user_id: parsed.data.userId, role: parsed.data.role },
    { onConflict: 'project_id,user_id' },
  )
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ ok: true })
})

app.get('/api/tasks', withAuth, async (req: AuthedRequest, res) => {
  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const projectId = req.query.projectId as string | undefined
  let query = userClient
    .from('tasks')
    .select('id, project_id, title, description, assignee_id, creator_id, status, priority, due_date, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  return res.json(data ?? [])
})

app.post('/api/tasks', withAuth, async (req: AuthedRequest, res) => {
  const parsed = taskSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const role = await getRole(userClient, req.userId!)
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await userClient.from('tasks').insert(parsed.data).select().single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
})

app.patch('/api/tasks/:taskId/status', withAuth, async (req: AuthedRequest, res) => {
  const status = z.enum(['todo', 'in_progress', 'completed', 'overdue']).safeParse(req.body?.status)
  if (!status.success) return res.status(400).json({ error: status.error.flatten() })
  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const { data, error } = await userClient
    .from('tasks')
    .update({ status: status.data })
    .eq('id', req.params.taskId)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
})

app.get('/api/team', withAuth, async (req: AuthedRequest, res) => {
  const userClient = (req as AuthedRequest & { userClient: UserClient }).userClient
  const role = await getRole(userClient, req.userId!)

  if (role === 'admin') {
    const { data: profiles, error } = await userClient.from('profiles').select('*').order('full_name', { ascending: true })
    if (error) return res.status(400).json({ error: error.message })

    const { data: memberAssignments } = await userClient
      .from('project_members')
      .select('user_id, projects(id,name)')

    const { data: taskAssignments } = await userClient
      .from('tasks')
      .select('assignee_id, projects(id,name)')

    const mergedAssignments = [
      ...(memberAssignments ?? []),
      ...((taskAssignments ?? []).map((row) => ({
        user_id: row.assignee_id,
        projects: row.projects,
      })) as Array<{ user_id: string; projects: { id: string; name: string } | null }>),
    ]

    return res.json({ profiles: profiles ?? [], assignments: mergedAssignments })
  }

  const { data: profile, error } = await userClient.from('profiles').select('*').eq('id', req.userId).single()
  if (error) return res.status(400).json({ error: error.message })

  const { data: memberAssignments } = await userClient
    .from('project_members')
    .select('user_id, projects(id,name)')
    .eq('user_id', req.userId)

  const { data: taskAssignments } = await userClient
    .from('tasks')
    .select('assignee_id, projects(id,name)')
    .eq('assignee_id', req.userId)

  const mergedAssignments = [
    ...(memberAssignments ?? []),
    ...((taskAssignments ?? []).map((row) => ({
      user_id: row.assignee_id,
      projects: row.projects,
    })) as Array<{ user_id: string; projects: { id: string; name: string } | null }>),
  ]

  return res.json({ profiles: [profile], assignments: mergedAssignments })
})

const port = Number(env.PORT ?? env.API_PORT)
app.listen(port, () => {
  console.log(`REST API running on port ${port}`)
})
