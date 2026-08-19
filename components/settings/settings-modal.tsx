"use client"

import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] flex-col overflow-hidden p-4 sm:h-[90vh] sm:max-w-5xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account and household preferences.
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
