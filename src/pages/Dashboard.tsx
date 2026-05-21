// Trecho para substituir apenas o componente TurmasPanel em Dashboard.tsx
// O restante do arquivo permanece igual.
//
// Mudanças:
// 1. TurmasPanel recebe etapas como prop
// 2. Usa useTurmaProgress (com etapas) em vez de calcular inline
// 3. Dashboard passa etapas para TurmasPanel

import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  FileDown,
  UsersRound,
  Upload,
  CheckCircle2,
} from 'lucide-react'
import {
  useSchoolData,
  formatNumber,
  type Turma,
  type Aluno,
  type Nota,
  type TurmaDisciplina,
  type Etapa,
} from '../hooks/useSchoolData'
import { useTurmaProgress } from '../hooks/useTurmaProgress'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

function StatCard({
  label, value, detail, icon: Icon,
}: {
  label: string; value: string; detail: string; icon: typeof BookOpen
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-400">{detail}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-[#185FA5]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ─── TurmasPanel — now uses useTurmaProgress with real etapas ─────────────────

function TurmasPanel({
  turmas, alunos, notas, turmaDisciplinas, etapas,
}: {
  turmas: Turma[]
  alunos: Aluno[]
  notas: Nota[]
  turmaDisciplinas: TurmaDisciplina[]
  etapas: Etapa[]
}) {
  // Single call — progress per turma with real etapa counts
  const progresses = useTurmaProgress(turmas, alunos, notas, turmaDisciplinas, etapas)

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Turmas em andamento</h2>
        <Link
          to="/turmas"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Nova turma
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {turmas.length === 0 ? (
          <EmptyState text="Nenhuma turma cadastrada." />
        ) : (
          progresses.map(({ turma, alunosTurma, progress, pendencias }) => (
            <div
              key={turma.id}
              className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <div>
                <p className="font-semibold text-gray-900">{turma.nome}</p>
                <p className="text-sm text-gray-400">
                  Ano {turma.ano} · {alunosTurma.length} alunos
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                progress < 80 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
              }`}>
                {pendencias} pendências
              </span>
              <div className="min-w-[8rem]">
                <div className="h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-[#185FA5] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-gray-400">{progress}%</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AcoesPanel({ turmas, alunos, notas }: { turmas: number; alunos: number; notas: number }) {
  const items = [
    `${turmas} turma${turmas !== 1 ? 's' : ''} cadastrada${turmas !== 1 ? 's' : ''}`,
    `${alunos} aluno${alunos !== 1 ? 's' : ''} cadastrado${alunos !== 1 ? 's' : ''}`,
    `${notas} nota${notas !== 1 ? 's' : ''} lançada${notas !== 1 ? 's' : ''}`,
  ]
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Resumo do sistema</h2>
      </div>
      <div className="space-y-3 p-6">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg bg-gray-50 p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#185FA5]" />
            <p className="text-sm leading-6 text-gray-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    { label: 'Lançar notas por turma',   icon: ClipboardList, path: '/notas/lancamento-massa' },
    { label: 'Importar planilha XLSX',   icon: Upload,        path: '/importar'               },
    { label: 'Gerar boletim individual', icon: FileDown,      path: '/boletins'               },
  ]
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Lançamento rápido</h2>
      </div>
      <div className="space-y-2 p-6">
        {actions.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon className="h-4 w-4 text-gray-400" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function calcularMediaAluno(notasAluno: Nota[]): number | null {
  if (notasAluno.length === 0) return null
  const grupos = notasAluno.reduce<Record<string, number[]>>((acc, n) => {
    const key = n.disciplina_id ?? 'sem'
    if (!acc[key]) acc[key] = []
    acc[key].push(Number(n.nota))
    return acc
  }, {})
  const mediasPorDisciplina = Object.values(grupos).map(
    (ns) => ns.reduce((a, b) => a + b, 0) / ns.length
  )
  return mediasPorDisciplina.reduce((a, b) => a + b, 0) / mediasPorDisciplina.length
}

function calcularStatusAluno(
  aluno: Aluno,
  notasAluno: Nota[],
  turmaDisciplinas: TurmaDisciplina[]
): boolean {
  const disciplinasDaTurma = turmaDisciplinas
    .filter((td) => td.turma_id === aluno.turma_id)
    .map((td) => td.disciplina_id)
  if (disciplinasDaTurma.length === 0) return false
  const disciplinasComNota = new Set(notasAluno.map((n) => n.disciplina_id))
  return disciplinasDaTurma.every((id) => disciplinasComNota.has(id))
}

function AlunosRecentes({
  alunos, turmas, notas, turmaDisciplinas,
}: {
  alunos: Aluno[]
  turmas: Turma[]
  notas: Nota[]
  turmaDisciplinas: TurmaDisciplina[]
}) {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Alunos recentes</h2>
      </div>
      <div className="overflow-x-auto">
        {alunos.length === 0 ? (
          <EmptyState text="Nenhum aluno cadastrado." />
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-gray-100 text-left">
              <tr>
                {['Aluno', 'Turma', 'Média', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alunos.map((student) => {
                const turma = turmas.find((t) => t.id === student.turma_id)
                const notasAluno = notas.filter((n) => n.aluno_id === student.id && n.nota !== null)
                const media = calcularMediaAluno(notasAluno)
                const statusCompleto = calcularStatusAluno(student, notasAluno, turmaDisciplinas)
                return (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/aluno/${student.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">{student.nome}</td>
                    <td className="px-6 py-3.5 text-gray-500">{turma?.nome ?? 'Sem turma'}</td>
                    <td className="px-6 py-3.5">
                      {media === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={`font-semibold ${media >= 7 ? 'text-green-600' : media >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {formatNumber(media)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusCompleto ? 'bg-green-50 text-green-700'
                        : notasAluno.length ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-600'
                      }`}>
                        {statusCompleto ? 'Com notas' : notasAluno.length ? 'Incompleto' : 'Pendente'}
                      </span>
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { turmas, alunos, notas, turmaDisciplinas, etapas, isLoading, error } = useSchoolData()

  if (isLoading) return <LoadingState />
  if (error)     return <ErrorState message={error} />

  const boletinsProntos = alunos.filter((a) => {
    const notasAluno = notas.filter((n) => n.aluno_id === a.id && n.nota !== null)
    return calcularStatusAluno(a, notasAluno, turmaDisciplinas)
  }).length

  const stats = [
    { label: 'Turmas ativas',    value: String(turmas.length),   detail: 'cadastradas',    icon: BookOpen   },
    { label: 'Alunos',           value: String(alunos.length),   detail: 'matriculados',   icon: UsersRound },
    { label: 'Boletins prontos', value: String(boletinsProntos), detail: 'notas completas', icon: FileDown  },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Pass etapas so TurmasPanel uses real etapa counts */}
        <TurmasPanel
          turmas={turmas}
          alunos={alunos}
          notas={notas}
          turmaDisciplinas={turmaDisciplinas}
          etapas={etapas}
        />
        <AcoesPanel turmas={turmas.length} alunos={alunos.length} notas={notas.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <QuickActions />
        <AlunosRecentes alunos={alunos} turmas={turmas} notas={notas} turmaDisciplinas={turmaDisciplinas} />
      </div>
    </div>
  )
}