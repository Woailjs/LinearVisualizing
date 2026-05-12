import { useState, type ReactNode } from 'react'
import './Panel.css'

interface PanelProps {
  title: string
  eyebrow?: string
  accentColor?: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Panel({ title, eyebrow, accentColor, children, defaultOpen = true }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={`panel ${open ? 'open' : 'collapsed'}`}
      style={accentColor ? { borderTop: `2px solid ${accentColor}` } : undefined}
    >
      <div className="panel-header" onClick={() => setOpen(!open)}>
        <div className="panel-header-text">
          {eyebrow && <span className="panel-eyebrow">{eyebrow}</span>}
          <span className="panel-title">{title}</span>
        </div>
        <span className="panel-toggle">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="panel-body">{children}</div>}
    </div>
  )
}
