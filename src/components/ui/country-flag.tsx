import { cn } from '@/lib/utils'
import * as Flags from 'country-flag-icons/react/3x2'

interface CountryFlagProps {
  code: string
  className?: string
}

export function CountryFlag({ code, className }: CountryFlagProps) {
  const Flag = Flags[code as keyof typeof Flags]

  if (!Flag) return null

  return <Flag className={cn('h-3 w-4 inline-block', className)} />
}
