import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types.ts'

type Client = SupabaseClient<Database>
type TaskStatus = Database['public']['Enums']['task_status']
type UserRole = Database['public']['Enums']['user_role']

type SeedUser = { email: string; fullName: string; role: UserRole }
type Step = { by: UserKey; to: TaskStatus; comment?: string }
type SeedTask = {
  site: number
  title: string
  description: string
  author: UserKey
  assignee: UserKey
  steps: Step[]
}

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not set, see .env.example`)
  }

  return value
}

const url = requireEnv('VITE_SUPABASE_URL')
const publishableKey = requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
const secretKey = requireEnv('SUPABASE_SECRET_KEY')
const password = requireEnv('SEED_USER_PASSWORD')

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }

const users = {
  olga: { email: 'manager@example.com', fullName: 'Ольга Смирнова', role: 'manager' },
  dmitry: { email: 'manager2@example.com', fullName: 'Дмитрий Орлов', role: 'manager' },
  ivan: { email: 'executor1@example.com', fullName: 'Иван Петров', role: 'executor' },
  sergey: { email: 'executor2@example.com', fullName: 'Сергей Кузнецов', role: 'executor' },
} satisfies Record<string, SeedUser>

type UserKey = keyof typeof users

const sites = [
  { name: 'ЖК «Северный парк», корпус 2', address: 'г. Москва, ул. Лесная, 14' },
  { name: 'Склад «Логистик-Юг»', address: 'Московская обл., г. Подольск, Промышленная ул., 7' },
  { name: 'Коттедж в Истре', address: 'Московская обл., Истринский р-н, д. Лешково, 112' },
]

const tasks: SeedTask[] = [
  {
    site: 0,
    title: 'Залить фундамент секции Б',
    description: 'Бетон В25, плита 400 мм. Перед заливкой пригласить на приёмку армирования.',
    author: 'olga',
    assignee: 'ivan',
    steps: [
      { by: 'ivan', to: 'in_progress' },
      { by: 'ivan', to: 'in_review' },
      {
        by: 'olga',
        to: 'rework',
        comment: 'У оси 3 раковины на поверхности. Затереть и показать повторно.',
      },
      { by: 'ivan', to: 'in_progress' },
      { by: 'ivan', to: 'in_review', comment: 'Затёрли, фото в чате объекта.' },
      { by: 'olga', to: 'accepted' },
    ],
  },
  {
    site: 0,
    title: 'Смонтировать опалубку 3-го этажа',
    description: 'Щитовая опалубка, комплект на складе объекта.',
    author: 'olga',
    assignee: 'ivan',
    steps: [{ by: 'ivan', to: 'in_progress' }],
  },
  {
    site: 0,
    title: 'Проверить армирование перекрытия 2-го этажа',
    description: 'Шаг 200 мм, защитный слой 25 мм. Результат — фото и акт.',
    author: 'dmitry',
    assignee: 'sergey',
    steps: [
      { by: 'sergey', to: 'in_progress' },
      { by: 'sergey', to: 'in_review' },
    ],
  },
  {
    site: 0,
    title: 'Вывезти строительный мусор',
    description: '',
    author: 'olga',
    assignee: 'sergey',
    steps: [
      { by: 'sergey', to: 'in_progress' },
      { by: 'sergey', to: 'in_review' },
      { by: 'dmitry', to: 'accepted' },
    ],
  },
  {
    site: 1,
    title: 'Заменить кровельные панели над зоной хранения',
    description: 'Сэндвич-панели 150 мм, 12 штук. Старые панели сдать на склад.',
    author: 'dmitry',
    assignee: 'ivan',
    steps: [
      { by: 'ivan', to: 'in_progress' },
      { by: 'ivan', to: 'in_review' },
      { by: 'dmitry', to: 'rework', comment: 'Не хватает фото узлов примыкания к парапету.' },
    ],
  },
  {
    site: 1,
    title: 'Провести электрику в офисном блоке',
    description: 'По проекту ЭМ-2, лист 4. Щиток согласовать с заказчиком.',
    author: 'dmitry',
    assignee: 'ivan',
    steps: [
      { by: 'ivan', to: 'in_progress' },
      { by: 'ivan', to: 'in_review' },
    ],
  },
  {
    site: 1,
    title: 'Установить ворота погрузочной зоны',
    description: 'Секционные ворота 4×4 м, монтаж после приёмки проёма.',
    author: 'dmitry',
    assignee: 'sergey',
    steps: [],
  },
  {
    site: 2,
    title: 'Утеплить мансарду',
    description: 'Минвата 200 мм, пароизоляция с проклейкой швов.',
    author: 'olga',
    assignee: 'ivan',
    steps: [],
  },
  {
    site: 2,
    title: 'Устроить отмостку по периметру',
    description: 'Ширина 1 м, уклон от дома 2%.',
    author: 'olga',
    assignee: 'ivan',
    steps: [{ by: 'ivan', to: 'in_progress' }],
  },
]

async function ensureUser(admin: Client, user: SeedUser) {
  const { error } = await admin.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  })

  if (error && error.code !== 'email_exists') {
    throw error
  }
}

async function signInAs(user: SeedUser) {
  const client = createClient<Database>(url, publishableKey, clientOptions)
  const { data, error } = await client.auth.signInWithPassword({ email: user.email, password })

  if (error) {
    throw error
  }

  return { client, userId: data.user.id }
}

async function main() {
  const admin = createClient<Database>(url, secretKey, clientOptions)

  const { count } = await admin
    .from('sites')
    .select('id', { count: 'exact', head: true })
    .throwOnError()

  if (count) {
    console.log('Database already has data, nothing to seed')
    return
  }

  const keys = Object.keys(users) as UserKey[]

  for (const key of keys) {
    await ensureUser(admin, users[key])
  }

  const sessions = Object.fromEntries(
    await Promise.all(keys.map(async (key) => [key, await signInAs(users[key])] as const)),
  ) as Record<UserKey, Awaited<ReturnType<typeof signInAs>>>

  for (const key of keys) {
    await admin
      .from('profiles')
      .update({ role: users[key].role })
      .eq('id', sessions[key].userId)
      .throwOnError()
  }

  const { data: createdSites } = await sessions.olga.client
    .from('sites')
    .insert(sites)
    .select('id')
    .throwOnError()

  for (const task of tasks) {
    const { client } = sessions[task.author]
    const { data: created } = await client
      .from('tasks')
      .insert({
        site_id: createdSites[task.site].id,
        title: task.title,
        description: task.description,
        assignee_id: sessions[task.assignee].userId,
      })
      .select('id')
      .single()
      .throwOnError()

    for (const step of task.steps) {
      await sessions[step.by].client
        .rpc('change_task_status', {
          task_id: created.id,
          next_status: step.to,
          comment: step.comment,
        })
        .throwOnError()
    }
  }

  console.log(`Seeded ${sites.length} sites and ${tasks.length} tasks for:`)

  for (const key of keys) {
    console.log(`  ${users[key].role.padEnd(8)} ${users[key].email}`)
  }
}

await main()
