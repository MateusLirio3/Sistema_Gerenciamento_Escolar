import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/privateroute'
import Layout from './components/Layout'

// Páginas
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Turmas from './pages/Turmas'
import Turma from './pages/Turma'
import Alunos from './pages/Alunos'
import Aluno from './pages/Aluno'
import LancamentoNotas from './pages/LancamentoNotas'
import Importar from './pages/Importar'
import Boletins from './pages/Boletins'
import Disciplinas from './pages/Disciplinas'
import Areas from './pages/Areas'
import BoletimPage from './pages/Boletimpage'
import VincularDisciplina from './pages/VincularDisciplinas'
import Etapa from './pages/Etapa'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        <Route path='/' element={<Navigate to="/login" replace />} />

        {/* Rotas privadas — todas usam o lLayout com sidebar */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/turmas/:id" element={<Turma />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/aluno/:id" element={<Aluno />} />
          <Route path="/lancamento-notas" element={<LancamentoNotas />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/boletins" element={<Boletins />} />
          <Route path='/disciplinas' element={<Disciplinas />} />
          <Route path='/areas' element={<Areas />} />
          <Route path='/boletim/:alunoID' element={<BoletimPage />} />
          <Route path='/vincular-disciplina' element={<VincularDisciplina />} />
          <Route path="/etapas" element={<Etapa />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  )
}