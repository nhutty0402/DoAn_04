"use client"

import { useRouter } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
      <div className="w-full max-w-md">
        <RegisterForm onClose={() => router.push("/")} />
      </div>
    </div>
  )
}



