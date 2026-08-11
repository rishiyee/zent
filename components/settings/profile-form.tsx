"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"

import { updateAvatarUrl, updateProfile } from "@/app/(dashboard)/settings/actions"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/toast"

const TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC"]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]]
  return letters.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?"
}

function TimezoneCombobox({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value ?? "Select…"}
        </span>
        <ChevronsUpDown className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone…" />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {TIMEZONES.map((tz) => (
                <CommandItem
                  key={tz}
                  onSelect={() => {
                    onChange(tz)
                    setOpen(false)
                  }}
                >
                  {tz}
                  {value === tz && <Check className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export function ProfileForm({
  userId,
  fullName,
  birthday,
  timezone,
  avatarUrl,
}: {
  userId: string
  fullName: string
  birthday: string | null
  timezone: string | null
  avatarUrl: string | null
}) {
  const [name, setName] = React.useState(fullName)
  const [date, setDate] = React.useState<Date | undefined>(
    birthday ? new Date(`${birthday}T00:00:00`) : undefined
  )
  const [tz, setTz] = React.useState<string | null>(timezone)
  const [pending, setPending] = React.useState(false)
  const [avatar, setAvatar] = React.useState(avatarUrl)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.add({ title: "Please choose an image file", type: "error" })
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.add({ title: "Image must be under 5MB", type: "error" })
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`

      await updateAvatarUrl(url)
      setAvatar(url)
      toast.add({ title: "Profile photo updated", type: "success" })
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Upload failed",
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await updateProfile({
        fullName: name.trim(),
        birthday: date ? format(date, "yyyy-MM-dd") : null,
        timezone: tz,
      })
      toast.add({ title: "Profile updated", type: "success" })
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Something went wrong",
        type: "error",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 flex-1 rounded-xl border p-6">
      <h2 className="mb-6 text-lg font-semibold">Profile</h2>
      <FieldGroup>
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="text-base">{initials(name || "?")}</AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Choose picture"}
          </Button>
        </div>
        <Field>
          <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
          <Input
            id="full-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel>Birthday</FieldLabel>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal",
                    !date && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon />
              {date ? format(date, "PPP") : "Date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} autoFocus />
            </PopoverContent>
          </Popover>
        </Field>
        <Field>
          <FieldLabel>Timezone</FieldLabel>
          <TimezoneCombobox value={tz} onChange={setTz} />
        </Field>
        <Field>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? "Updating…" : "Update Profile"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
