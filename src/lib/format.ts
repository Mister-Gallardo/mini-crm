const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })
const pluralRules = new Intl.PluralRules('ru-RU')

export function formatDate(value: string) {
  return dateFormat.format(new Date(value))
}

export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value))
}

type PluralForms = { one: string; few: string; many: string }

export function pluralize(count: number, forms: PluralForms) {
  const rule = pluralRules.select(count)
  const form = rule === 'one' || rule === 'few' ? forms[rule] : forms.many

  return `${count} ${form}`
}
