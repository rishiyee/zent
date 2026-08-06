"use client"

import { PlusCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export type FacetOption = { label: string; value: string; count?: number }

export function FacetedFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: FacetOption[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const selectedSet = new Set(selected)

  function toggle(value: string) {
    const next = new Set(selectedSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(Array.from(next))
  }

  const selectedOptions = options.filter((option) => selectedSet.has(option.value))

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className="border-dashed" />}
      >
        <PlusCircle />
        {title}
        {selectedSet.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
              {selectedSet.size}
            </Badge>
            <div className="hidden gap-1 lg:flex">
              {selectedSet.size > 2 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selectedSet.size} selected
                </Badge>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {option.label}
                  </Badge>
                ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  data-checked={selectedSet.has(option.value)}
                  onSelect={() => toggle(option.value)}
                >
                  <span>{option.label}</span>
                  {option.count != null && (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {option.count}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
