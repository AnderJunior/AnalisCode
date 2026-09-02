import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ClientDetail from './pages/admin/ClientDetail.jsx'
import Clients from './pages/admin/Clients.jsx'
import Financeiro from './pages/admin/Financeiro.jsx'
import Templates from './pages/admin/Templates.jsx'
import Workspace from './pages/admin/Workspace.jsx'
import Forms from './pages/admin/Forms.jsx'
import FormBuilder from './pages/admin/FormBuilder.jsx'
import FormWizard from './pages/form/FormWizard.jsx'
import ReviewPage from './pages/review/ReviewPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={<ProtectedRoute><Clients /></ProtectedRoute>}
          />
          <Route
            path="/admin/financeiro"
            element={<ProtectedRoute><Financeiro /></ProtectedRoute>}
          />
          <Route
            path="/admin/templates"
            element={<ProtectedRoute><Templates /></ProtectedRoute>}
          />
          <Route
            path="/admin/workspace"
            element={<ProtectedRoute><Workspace /></ProtectedRoute>}
          />
          <Route
            path="/admin/formularios"
            element={<ProtectedRoute><Forms /></ProtectedRoute>}
          />
          <Route
            path="/admin/formularios/:id"
            element={<ProtectedRoute><FormBuilder /></ProtectedRoute>}
          />
          <Route
            path="/admin/cliente/:id"
            element={
              <ProtectedRoute>
                <ClientDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/preencher/:token" element={<FormWizard />} />
          <Route path="/aprovar/:token" element={<ReviewPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
