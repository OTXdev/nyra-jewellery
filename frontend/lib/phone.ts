// Client-side Algerian phone validation mirroring the backend's authoritative
// rules. Accepts only valid Algerian mobile numbers:
//   - Local: 0[5-7]XXXXXXXX (10 digits total), e.g. 0550123456
//   - International: +213[5-7]XXXXXXXX (9 digits after the country code),
//     e.g. +213550123456
// Spaces are allowed for readability and removed before validation.
// Returns an error message (in French, matching the storefront UI) when the
// value is invalid, or null when it is valid.

// Spaces are allowed for readability but removed before structural validation.
const PHONE_SPACES = /\s+/g

export const PHONE_ERROR =
  "Veuillez saisir un numéro de téléphone algérien valide (ex. 0550123456 ou +213550123456)."

export function validatePhone(value: string): string | null {
  const stripped = value.trim()
  if (!stripped) return PHONE_ERROR

  // Remove allowed spaces so they don't affect structural validation.
  const normalized = stripped.replace(PHONE_SPACES, "")

  const localValid = /^0[5-7][0-9]{8}$/.test(normalized)
  const internationalValid = /^\+213[5-7][0-9]{8}$/.test(normalized)

  if (!localValid && !internationalValid) {
    return PHONE_ERROR
  }

  return null
}
