import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useSchoolData, formatNumber } from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import { Link } from 'react-router-dom'

export default function LancamentoNotas() {
  const { data, isLoading, error } = useSchoolData()
  const [groupByTurma, setGroupByTurma] = useState(false)

  const notas = data?.notas ?? []
  const alunos = data?.alunos ?? []
  const disciplinas = data?.disciplinas ?? []
  const turmas = data?.turmas ?? []

  const turmaMap = useMemo(
    () => new Map(turmas.map((turma) => [turma.id, turma])),
    [turmas]
  )

  const groupedNotas = useMemo(() => {
    if (!groupByTurma) return []

    const groups = new Map<string, typeof notas>()

    notas.forEach((nota) => {
      const aluno = alunos.find((a) => a.id === nota.aluno_id)
      const turmaId = aluno?.turma_id ?? '__sem_turma'
      const existing = groups.get(turmaId) ?? []
      existing.push(nota)
      groups.set(turmaId, existing)
    })

    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === '__sem_turma') return 1
      if (b === '__sem_turma') return -1
      const turmaA = turmaMap.get(a)
      const turmaB = turmaMap.get(b)
      if (!turmaA || !turmaB) return 0
      if (turmaA.ano !== turmaB.ano) return turmaB.ano - turmaA.ano
      return turmaA.nome.localeCompare(turmaB.nome, 'pt-BR')
    })
  }, [groupByTurma, notas, alunos, turmaMap])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  function renderRows(notasToRender: typeof notas) {
    return notasToRender.map((nota) => {
      const nomeAluno =
        alunos.find((a) => a.id === nota.aluno_id)?.nome ?? 'Aluno não encontrado'
      const nomeDisciplina =
        disciplinas.find((d) => d.id === nota.disciplina_id)?.nome ?? 'Sem disciplina'
      const notaVal = nota.nota === null || nota.nota === undefined ? null : Number(nota.nota)

      return (
        <tr key={nota.id} className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-3.5 font-medium text-gray-900">{nomeAluno}</td>
          <td className="px-6 py-3.5 text-gray-500">{nomeDisciplina}</td>
          <td className="px-6 py-3.5 text-gray-500">{nota.etapa ?? '—'}</td>
          <td className="px-6 py-3.5">
            {notaVal === null ? (
              <span className="text-gray-400">—</span>
            ) : (
              <span
                className={`font-semibold ${
                  notaVal >= 7
                    ? 'text-green-600'
                    : notaVal >= 5
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {formatNumber(notaVal)}
              </span>
            )}
          </td>
          <td className="px-6 py-3.5 text-gray-500">
            {nota.frequencia === null || nota.frequencia === undefined
              ? '—'
              : `${formatNumber(Number(nota.frequencia))}%`}
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ClipboardList className="h-5 w-5 text-[#185FA5]" />
              Consulta de notas
            </h2>
            <p className="mt-1 text-sm text-gray-400">{notas.length} notas registradas</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
              <label className="mr-2 text-xs uppercase tracking-wide text-gray-500">Agrupar por</label>
              <select
                value={groupByTurma ? 'turma' : 'none'}
                onChange={(event) => setGroupByTurma(event.target.value === 'turma')}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:border-[#185FA5]"
              >
                <option value="none">Nenhum</option>
                <option value="turma">Turma</option>
              </select>
            </div>

            <Link
              to="/notas/lancamento-massa"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lançamento de notas
            </Link>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {notas.length === 0 ? (
          <EmptyState text="Nenhuma nota lançada." />
        ) : groupByTurma ? (
          groupedNotas.map(([turmaId, notasDoGrupo]) => {
            const turma = turmaMap.get(turmaId)
            const grupoTitulo = turma ? `${turma.nome} • ${turma.ano}` : 'Sem turma'

            return (
              <div key={turmaId} className="border-b border-gray-100 px-6 py-4 last:border-none">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{grupoTitulo}</h3>
                    <p className="text-xs text-gray-500">{notasDoGrupo.length} nota(s)</p>
                  </div>
                </div>
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b border-gray-100 text-left">
                    <tr>
                      {['Aluno', 'Disciplina', 'Etapa', 'Nota', 'Frequência'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">{renderRows(notasDoGrupo)}</tbody>
                </table>
              </div>
            )
          })
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-gray-100 text-left">
              <tr>
                {['Aluno', 'Disciplina', 'Etapa', 'Nota', 'Frequência'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">{renderRows(notas)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}