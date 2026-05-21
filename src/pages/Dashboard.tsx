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
} from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof BookOpen
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

// ─── TurmasPanel ──────────────────────────────────────────────────────────────

function TurmasPanel({
  turmas,
  alunos,
  notas,
  turmaDisciplinas,
}: {
  turmas: Turma[]
  alunos: Aluno[]
  notas: Nota[]
  turmaDisciplinas: TurmaDisciplina[]
}) {
  
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
          turmas.map((turma) => {
            const alunosTurma = alunos.filter((a) => a.turma_id === turma.id)
            const disciplinasDaTurma = turmaDisciplinas
              .filter((td) => td.turma_id === turma.id)
              .map((td) => td.disciplina_id)

            // Progresso: pares (aluno × disciplina) que têm pelo menos 1 nota lançada
            const totalPares = alunosTurma.length * disciplinasDaTurma.length
            const paresComNota = notas.filter(
              (n) =>
                n.nota !== null &&
                alunosTurma.some((a) => a.id === n.aluno_id) &&
                disciplinasDaTurma.includes(n.disciplina_id ?? '')
            ).length

            const progress = totalPares ? Math.round((paresComNota / totalPares) * 100) : 0
            const pendencias = Math.max(totalPares - paresComNota, 0)

            return (
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
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    progress < 80 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}
                >
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
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── AcoesPanel ───────────────────────────────────────────────────────────────

function AcoesPanel({
  turmas,
  alunos,
  notas,
}: {
  turmas: number
  alunos: number
  notas: number
}) {
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

// ─── QuickActions ─────────────────────────────────────────────────────────────

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    { label: 'Lançar notas por turma', icon: ClipboardList, path: '/notas/lancamento-massa' },
    { label: 'Importar planilha XLSX', icon: Upload, path: '/importar' },
    { label: 'Gerar boletim individual', icon: FileDown, path: '/boletins' },
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

// ─── Helpers de média ─────────────────────────────────────────────────────────

/**
 * Calcula a média correta: agrupa notas por disciplina → média de cada disciplina
 * → média das médias. Evita distorção por quantidade de etapas lançadas por disciplina.
 */
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

/**
 * Retorna true se o aluno tem pelo menos 1 nota em cada disciplina vinculada à turma.
 */
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

// ─── AlunosRecentes ───────────────────────────────────────────────────────────

function AlunosRecentes({
  alunos,
  turmas,
  notas,
  turmaDisciplinas,
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
              {alunos.map((student) => {
                const turma = turmas.find((t) => t.id === student.turma_id)
                const notasAluno = notas.filter(
                  (n) => n.aluno_id === student.id && n.nota !== null
                )

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
                        <span
                          className={`font-semibold ${
                            media >= 7
                              ? 'text-green-600'
                              : media >= 5
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatNumber(media)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusCompleto
                            ? 'bg-green-50 text-green-700'
                            : notasAluno.length
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {statusCompleto
                          ? 'Com notas'
                          : notasAluno.length
                          ? 'Incompleto'
                          : 'Pendente'}
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

// ─── Dashboard (página principal) ─────────────────────────────────────────────

export default function Dashboard() {
  const { data, isLoading, error } = useSchoolData()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const turmas           = data?.turmas           ?? []
  const alunos           = data?.alunos           ?? []
  const notas            = data?.notas            ?? []
  const turmaDisciplinas = data?.turmaDisciplinas ?? []

  // Boletins prontos = alunos que têm notas em todas as disciplinas da turma
  const boletinsProntos = alunos.filter((a) => {
    const notasAluno = notas.filter((n) => n.aluno_id === a.id && n.nota !== null)
    return calcularStatusAluno(a, notasAluno, turmaDisciplinas)
  }).length

  const stats = [
    { label: 'Turmas ativas',    value: String(turmas.length),    detail: 'cadastradas',   icon: BookOpen    },
    { label: 'Alunos',           value: String(alunos.length),    detail: 'matriculados',  icon: UsersRound  },
    { label: 'Boletins prontos', value: String(boletinsProntos),  detail: 'notas completas', icon: FileDown  },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Turmas + Ações */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TurmasPanel
          turmas={turmas}
          alunos={alunos}
          notas={notas}
          turmaDisciplinas={turmaDisciplinas}
        />
        <AcoesPanel turmas={turmas.length} alunos={alunos.length} notas={notas.length} />
      </div>

      {/* Quick Actions + Alunos */}
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <QuickActions />
        <AlunosRecentes
          alunos={alunos}
          turmas={turmas}
          notas={notas}
          turmaDisciplinas={turmaDisciplinas}
        />
      </div>
    </div>
  )
}