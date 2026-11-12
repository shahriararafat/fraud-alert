const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'
const BD_MOBILE = /^01[3-9]\d{8}$/

// One canonical form: 01XXXXXXXXX. 017…, +88017…, 88017…, and ০১৭… all match.
export function normalizeBdPhone(input: string): string | null {
  let digits = ''
  for (const char of input) {
    const bangla = BANGLA_DIGITS.indexOf(char)
    if (bangla !== -1) digits += String(bangla)
    else if (char >= '0' && char <= '9') digits += char
  }

  let local = digits
  if (local.startsWith('00880')) local = local.slice(5)
  else if (local.startsWith('880')) local = local.slice(3)

  if (local.startsWith('1')) local = `0${local}`

  if (!BD_MOBILE.test(local)) return null
  return local
}
