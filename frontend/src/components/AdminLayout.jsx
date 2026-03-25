import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogOut, ChevronRight, Users, Layout } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import logoLetreiro from '../assets/logo-letreiro.png'

const NAV_SECTIONS = [
  {
    label: 'Visão Geral',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Clientes',  icon: Users,           path: '/admin/clientes' },
    ],
  },
  {
    label: 'Sites',
    items: [
      { label: 'Templates', icon: Layout, path: '/admin/templates' },
    ],
  },
]

export default function AdminLayout({ children, title, actions }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try { await logout() } catch {}
    navigate('/admin/login')
  }

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-white border-r border-gray-100 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center px-4 h-14 border-b border-gray-100">
          <img src={logoLetreiro} alt="AnalisCode" className="h-8 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        active
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-normal'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gray-700' : 'text-gray-400'}`} />
                      {item.label}
                      {active && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-400 rounded-l" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-8 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-800 font-semibold">{title}</span>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  )
}
