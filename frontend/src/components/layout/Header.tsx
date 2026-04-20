import { NavLink } from 'react-router-dom'

interface HeaderProps {
  variant?: 'page' | 'overlay'
}

const Header = ({ variant = 'page' }: HeaderProps) => {
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
        className={`mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 ${
          isOverlay ? 'bg-white/90 backdrop-blur-sm shadow-sm' : ''
        }`}
      >
        <NavLink to="/" className="text-lg font-semibold text-slate-900">
          WebGIS Bus Routing
        </NavLink>

        <nav className="ml-auto flex items-center gap-2">
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
