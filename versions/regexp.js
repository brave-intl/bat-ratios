module.exports = {
  intOrDecimal: /\d*\.?\d+/i,
  numberWithUnit: /^[0-9A-Z]{2,}$/i,
  dashNumberWithUnit: /^[0-9A-Z]{2,}-[0-9A-Z]{2,}$/i,
  symbol: /^[A-Z]{3}$/i,
  dualSymbolNumbers: /^[0-9A-Z]{2,}[0-9A-Z]{2,}$/i
}
