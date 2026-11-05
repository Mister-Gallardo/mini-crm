const messages = new Map<string, string>([
  ['task_not_found', 'Задача не найдена или недоступна'],
  ['transition_not_allowed', 'Действие уже недоступно, обновите страницу'],
  ['comment_required', 'Нужен комментарий'],
  ['assignee_must_be_executor', 'Назначить задачу можно только исполнителю'],
  ['invalid_credentials', 'Неверный email или пароль'],
  ['23503', 'Нельзя удалить: есть связанные задачи'],
  ['42501', 'Недостаточно прав'],
])

const missingRowCodes = new Set(['PGRST116', '22P02'])

function errorField(error: unknown, field: 'message' | 'code') {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const value = (error as Partial<Record<typeof field, unknown>>)[field]
  return typeof value === 'string' && value !== '' ? value : undefined
}

function lookup(key: string | undefined) {
  return key === undefined ? undefined : messages.get(key)
}

export function getErrorMessage(error: unknown) {
  return (
    lookup(errorField(error, 'message')) ??
    lookup(errorField(error, 'code')) ??
    'Что-то пошло не так, попробуйте ещё раз'
  )
}

export function isMissingRowError(error: unknown) {
  const code = errorField(error, 'code')
  return code !== undefined && missingRowCodes.has(code)
}

export function isNetworkError(error: unknown) {
  return errorField(error, 'code') === undefined
}
