import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

const links = [
  { to: '/Dashboard', label: 'Home' },
  { to: '/disciplinas', label: 'Disciplinas' },
  { to: '/Etapa', label: 'Etapa' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 md:px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#185FA5] flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-900 leading-none">ISEPAM</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Sistema de Boletins</p>
          </div>
        </div>

        {/* Links - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Direita - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-[#185FA5] font-medium">
            2025
          </span>
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-medium text-[#0C447C]">
            CO
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={menuAberto ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuAberto && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-3 py-2 flex flex-col gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuAberto(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm transition-colors block ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-[#185FA5] font-medium">
                `${new Date().getFullYear()}`
              </span>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-[#0C447C]">
                CO
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  )
}