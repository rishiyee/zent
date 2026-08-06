export type AuthMethod = "email" | "github"

export const AUTH_METHOD_COOKIE = "last_auth_method"

export function isAuthMethod(value: string | null | undefined): value is AuthMethod {
  return value === "email" || value === "github"
}
