// Prazos em dias úteis (segunda a sexta). Feriados não são considerados.

export const DEADLINE_PRESETS = [10, 15, 20]

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function isBusinessDay(date) {
  const dow = date.getDay()
  return dow !== 0 && dow !== 6
}

// Soma N dias úteis. Espelha server/lib/businessDays.js — as duas
// implementações precisam concordar, senão a prévia do modal mente.
export function addBusinessDays(startDate, days) {
  const date = startOfDay(startDate)
  let remaining = Math.max(0, parseInt(days) || 0)
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    if (isBusinessDay(date)) remaining--
  }
  return date
}

// Aceita 'YYYY-MM-DD' e ISO completo. Monta a data no fuso local para que
// um prazo de dia 16 não vire dia 15 por causa de UTC.
export function parseDeadline(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// Dias úteis restantes até a data. Negativo = atrasado, 0 = vence hoje.
export function businessDaysUntil(deadline, from = new Date()) {
  const target = startOfDay(deadline)
  const cursor = startOfDay(from)
  const forward = target > cursor
  let count = 0
  while (cursor.getTime() !== target.getTime()) {
    cursor.setDate(cursor.getDate() + (forward ? 1 : -1))
    if (isBusinessDay(cursor)) count++
  }
  return (forward ? count : -count) || 0 // normaliza o -0
}

export function formatDeadlineDate(value) {
  const date = value instanceof Date ? value : parseDeadline(value)
  if (!date) return null
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// 'YYYY-MM-DD' no fuso local — formato que <input type="date"> espera.
export function toISODate(value) {
  const date = value instanceof Date ? value : parseDeadline(value)
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function diasUteis(n) {
  return n === 1 ? '1 dia útil' : `${n} dias úteis`
}

export const DEADLINE_TONES = {
  late:  { text: 'text-red-600',   bg: 'bg-red-50',   dot: 'bg-red-500' },
  today: { text: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  soon:  { text: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  ok:    { text: 'text-gray-500',  bg: 'bg-gray-50',  dot: 'bg-gray-300' },
}

// Resumo pronto para a tela: data formatada + quanto falta + cor.
export function getDeadlineInfo(value) {
  const date = parseDeadline(value)
  if (!date) return null

  const remaining = businessDaysUntil(date)
  let label
  let tone

  if (remaining < 0) {
    label = `Atrasado ${diasUteis(Math.abs(remaining))}`
    tone = 'late'
  } else if (remaining === 0) {
    label = 'Vence hoje'
    tone = 'today'
  } else {
    label = `Faltam ${diasUteis(remaining)}`
    tone = remaining <= 3 ? 'soon' : 'ok'
  }

  return {
    date,
    dateLabel: formatDeadlineDate(date),
    remaining,
    label,
    tone,
    tones: DEADLINE_TONES[tone],
  }
}
