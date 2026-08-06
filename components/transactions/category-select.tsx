"use client"

import * as React from "react"

import { CategoryGroup } from "@/lib/categories"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CategorySelect({
  groups,
  value,
  onValueChange,
  placeholder = "Uncategorized",
  leadingOptions,
  className,
  size,
}: {
  groups: CategoryGroup[]
  value: string | undefined
  onValueChange: (value: string) => void
  placeholder?: string
  leadingOptions?: { value: string; label: string }[]
  className?: string
  size?: "sm" | "default"
}) {
  const items: Record<string, React.ReactNode> = {}
  for (const option of leadingOptions ?? []) {
    items[option.value] = option.label
  }
  for (const group of groups) {
    for (const category of group.categories) {
      items[category.name] = `${category.icon} ${category.name}`
    }
  }

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next: string | null) => next && onValueChange(next)}
    >
      <SelectTrigger className={className} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {leadingOptions?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {groups.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel>{group.name}</SelectLabel>
            {group.categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                <span>{category.icon}</span>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
