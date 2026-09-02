// Cálculo de prazos em dias úteis (segunda a sexta).
// Feriados não são considerados — só fins de semana.

function isBusinessDay(date) {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6;
}

// Soma N dias úteis a uma data. addBusinessDays(sexta, 1) === segunda.
function addBusinessDays(startDate, days) {
  const date = new Date(startDate);
  let remaining = Math.max(0, parseInt(days) || 0);
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (isBusinessDay(date)) remaining--;
  }
  return date;
}

// 'YYYY-MM-DD' no fuso local — evita o deslocamento de toISOString().
function toDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = { isBusinessDay, addBusinessDays, toDateOnly };
