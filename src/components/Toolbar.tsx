interface ToolbarProps {
  totalCount: number
}

export default function Toolbar({ totalCount }: ToolbarProps) {
  const showing = Math.min(18, totalCount)
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input placeholder="Search fields…" readOnly />
      </div>
      <span className="count-label">1–{showing} of {totalCount}</span>
    </div>
  )
}
