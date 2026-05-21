// src/pages/Boletins.tsx — substitua o arquivo completo
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import { useSchoolData, formatNumber } from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export default function Boletins() {
  const { data, isLoading, error } = useSchoolData()
  const navigate = useNavigate()
  const [etapaSelecionada, setEtapaSelecionada] = useState<number>(3)
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('todas')
  const [busca, setBusca] = useState('')

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const alunos = data?.alunos ?? []
  const turmas = data?.turmas ?? []
  const notas = data?.notas ?? []

  const alunosFiltrados = alunos
    .filter((a) => turmaSelecionada === 'todas' || a.turma_id === turmaSelecionada)
    .filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileDown className="h-5 w-5 text-[#185FA5]" />
              Boletins por aluno
            </h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Clique em um aluno para visualizar e baixar o boletim
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Busca */}
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#185FA5] focus:outline-none w-44"
            />
            {/* Filtro turma */}
            <select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#185FA5] focus:outline-none bg-white"
            >
              <option value="todas">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome} — {t.ano}</option>
              ))}
            </select>
            {/* Seletor de etapa */}
            <select
              value={etapaSelecionada}
              onChange={(e) => setEtapaSelecionada(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#185FA5] focus:outline-none bg-white"
            >
              <option value={1}>1ª Etapa</option>
              <option value={2}>2ª Etapa</option>
              <option value={3}>3ª Etapa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {alunosFiltrados.length === 0 ? (
          <EmptyState text="Nenhum aluno encontrado." />
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-gray-100 text-left">
              <tr>
                {['Aluno', 'Turma', 'Média', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alunosFiltrados.map((aluno) => {
                const turma = turmas.find((t) => t.id === aluno.turma_id)
                const notasAluno = notas.filter(
                  (n) => n.aluno_id === aluno.id && n.nota !== null
                )
                const mediasPorDisciplina = Object.values(
                  notasAluno.reduce<Record<string, number[]>>((acc, n) => {
                    const key = n.disciplina_id ?? 'sem'
                    if (!acc[key]) acc[key] = []
                    acc[key].push(Number(n.nota))
                    return acc
                  }, {})
                ).map((ns) => ns.reduce((a, b) => a + b, 0) / ns.length)

                const media = mediasPorDisciplina.length
                  ? mediasPorDisciplina.reduce((a, b) => a + b, 0) / mediasPorDisciplina.length
                  : null

                return (
                  <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{aluno.nome}</td>
                    <td className="px-6 py-3.5 text-gray-500">{turma?.nome ?? 'Sem turma'}</td>
                    <td className="px-6 py-3.5">
                      {media === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={`font-semibold ${
                          media >= 7 ? 'text-green-600' : media >= 5 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {formatNumber(media)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        notasAluno.length ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {notasAluno.length ? 'Com notas' : 'Nota pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/boletim/${aluno.id}?etapa=${etapaSelecionada}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Ver boletim
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}