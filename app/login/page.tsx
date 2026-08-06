import Link from "next/link"
import { cookies } from "next/headers"
import { WalletIcon } from "lucide-react"

import { AUTH_METHOD_COOKIE, isAuthMethod } from "@/lib/auth-method"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage() {
  const cookieStore = await cookies()
  const lastMethodCookie = cookieStore.get(AUTH_METHOD_COOKIE)?.value
  const lastMethod = isAuthMethod(lastMethodCookie) ? lastMethodCookie : undefined

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <WalletIcon className="size-4" />
            </div>
            Zent
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm lastMethod={lastMethod} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block" />
    </div>
  )
}
