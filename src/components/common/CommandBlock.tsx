import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

interface CommandBlockProps {
  command: string
  label?: string
  className?: string
}

export function CommandBlock({ command, label, className }: CommandBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('space-y-1', className)}>
      {label && <p className="text-xs text-slate-400">{label}</p>}
      <div className="relative group">
        <pre className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-emerald-300 font-mono overflow-x-auto">
          <code>{command}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy command"
          className="absolute right-2 top-2 p-1.5 rounded-md bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white/10"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </div>
    </div>
  )
}
