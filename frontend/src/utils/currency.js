// Valores monetários em BRL. O mysql2 devolve DECIMAL como string,
// então tudo passa por Number() antes de formatar.

export function formatBRL(value) {
  const n = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Lê o que o usuário digitou ("1.500,50" ou "1500.50") como número.
export function parseBRL(input) {
  if (input === null || input === undefined) return null
  const raw = String(input).trim()
  if (!raw) return null
  const normalized = raw
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? n : null
}
