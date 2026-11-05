# Объекты и задачи

Мини-CRM для строительной компании. Постановщики ведут объекты (стройки) и задачи, исполнители берут задачи в работу и отдают на проверку.

React 19, TypeScript, Vite, TanStack Router и Query, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, RLS).

## Как устроено

- Права доступа проверяет база: RLS-политики, права на колонки и функции описаны в `supabase/migrations`. Интерфейс только скрывает то, что пользователю всё равно недоступно.
- Статус задачи меняет одна функция `change_task_status`. Она сверяет переход с таблицей правил `task_status_transitions`, ролью пользователя и исполнителем задачи, а затем пишет историю.
- Кнопки в карточке задачи строятся по той же таблице правил (`get_task_transitions`), поэтому интерфейс и база не расходятся.

Для руководителя: [docs/overview.md](docs/overview.md). Решения и допущения: [docs/decisions.md](docs/decisions.md).

## Запуск

Нужны Node.js 22.18+, pnpm и [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

1. `pnpm install`
2. Скопировать `.env.example` в `.env`, указать URL проекта и publishable key.
3. Применить миграции: `supabase link --project-ref <ref>`, затем `supabase db push`.
4. Выключить регистрацию: Authentication → Sign In / Providers → Allow new users to sign up.
5. Заполнить базу демо-данными: добавить в `.env` `SUPABASE_SECRET_KEY` и `SEED_USER_PASSWORD`, выполнить `pnpm seed`.
6. `pnpm dev`

Без облака: `supabase start` поднимает Postgres и Auth в Docker с теми же миграциями. URL и ключи для `.env` команда выводит в консоль.

## Демо-данные

`pnpm seed` создаёт двух постановщиков (`manager@example.com`, `manager2@example.com`), двух исполнителей (`executor1@example.com`, `executor2@example.com`), три объекта и задачи во всех статусах. Пароль у всех — из `SEED_USER_PASSWORD`. Данные заводятся через API под этими пользователями, поэтому история статусов настоящая.

Пользователя можно завести и вручную: Authentication → Users → Add user. Он получит роль исполнителя; чтобы сделать его постановщиком, поменяйте `role` в таблице `profiles`.

## Команды

| Команда                     | Что делает                                                       |
| --------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                  | дев-сервер                                                       |
| `pnpm build`                | проверка типов и сборка                                          |
| `pnpm lint` / `pnpm format` | проверка и форматирование (Biome)                                |
| `pnpm db:test`              | pgTAP-тесты прав доступа и переходов, нужен локальный Supabase   |
| `pnpm db:types`             | обновить `src/lib/database.types.ts` по схеме связанного проекта |
| `pnpm seed`                 | демо-пользователи и данные                                       |
