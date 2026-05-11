import { useState, type ReactNode } from 'react'
import './Panel.css'

interface PanelProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Panel({ title, children, defaultOpen = true }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`panel ${open ? 'open' : 'collapsed'}`}>
      <div className="panel-header" onClick={() => setOpen(!open)}>
        <span className="panel-title">{title}</span>
        <span className="panel-toggle">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="panel-body">{children}</div>}
    </div>
  )
}
