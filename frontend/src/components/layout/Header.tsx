import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface HeaderProps {
  variant?: 'page' | 'overlay'
  centerContent?: ReactNode
}

const Header = ({ variant = 'page', centerContent = null }: HeaderProps) => {
  const isOverlay = variant === 'overlay'
  const wrapperClassName = isOverlay
    ? 'absolute inset-x-0 top-0 z-10'
    : 'border-b border-slate-200 bg-white'

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <header className={wrapperClassName}>
      <div
        className={`mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 ${
          isOverlay
            ? 'min-h-14 max-w-none bg-white/90 py-3 backdrop-blur-sm shadow-sm'
            : 'h-14'
        }`}
      >
        <NavLink to="/" className="shrink-0 text-lg font-semibold text-slate-900">
          WebGIS Bus Routing
        </NavLink>

        {centerContent ? (
          <div className="order-3 w-full md:order-none md:flex-1 md:px-4">
            <div className="mx-auto w-full max-w-2xl">
              {centerContent}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <nav className="ml-auto flex shrink-0 items-center gap-2">
          <NavLink to="/" end className={navLinkClassName}>
            Map
          </NavLink>
          <NavLink to="/manage" className={navLinkClassName}>
            Manage
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
