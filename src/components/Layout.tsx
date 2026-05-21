import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Upload,
  UsersRound,
  Search,
  CalendarDays,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/Dashboard' },
  { label: 'Turmas', icon: BookOpen, to: '/turmas' },
  { label: 'Alunos', icon: UsersRound, to: '/alunos' },
  { label: 'Notas', icon: ClipboardList, to: '/lancamento-notas' },
  { label: 'Importação', icon: Upload, to: '/importar' },
  { label: 'Boletins', icon: FileDown, to: '/boletins' },
  { label: 'Disciplinas', icon: BookOpen, to: '/disciplinas' },
  { label: 'Áreas', icon: GraduationCap, to: '/areas' },
  { label: 'Vincular disciplina', icon: GraduationCap, to: '/vincular-disciplina' },
  { label: 'Etapas', icon: CalendarDays, to: '/etapas' },

]

export default function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex ">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-[#0f1623] text-white flex flex-col
           transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:z-auto lg:h-full
        `}
      >
        {/* Logo */}
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#185FA5]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/100">Sistema de Gerenciamento Acadêmico</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/Dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#185FA5] text-white font-medium'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date().toLocaleDateString('pt-BR')}
                </p>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  Painel de acompanhamento
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar aluno ou turma"
                  className="w-56 rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#185FA5] transition-colors"
                />
              </div>
              <button
                onClick={() => navigate('/importar')}
                className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Importar notas
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-6 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}