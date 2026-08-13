export function calculateExpression(input: string): number | null {
  const source = input
    .replace(/,/g, "")
    .replace(/[₹$€£¥₩₽]/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
  if (!source.trim() || /[^0-9+\-*/().\s]/.test(source)) return null
  let index = 0

  function skipSpaces() {
    while (/\s/.test(source[index] ?? "")) index++
  }

  function primary(): number {
    skipSpaces()
    if (source[index] === "(") {
      index++
      const value = expression()
      skipSpaces()
      if (source[index++] !== ")") throw new Error("Missing parenthesis")
      return value
    }
    const match = source.slice(index).match(/^\d*\.?\d+/)
    if (!match) throw new Error("Expected number")
    index += match[0].length
    return Number(match[0])
  }

  function unary(): number {
    skipSpaces()
    if (source[index] === "+") { index++; return unary() }
    if (source[index] === "-") { index++; return -unary() }
    return primary()
  }

  function term(): number {
    let value = unary()
    while (true) {
      skipSpaces()
      const operator = source[index]
      if (operator !== "*" && operator !== "/") return value
      index++
      const right = unary()
      value = operator === "*" ? value * right : value / right
    }
  }

  function expression(): number {
    let value = term()
    while (true) {
      skipSpaces()
      const operator = source[index]
      if (operator !== "+" && operator !== "-") return value
      index++
      const right = term()
      value = operator === "+" ? value + right : value - right
    }
  }

  try {
    const result = expression()
    skipSpaces()
    return index === source.length && Number.isFinite(result) ? result : null
  } catch {
    return null
  }
}
