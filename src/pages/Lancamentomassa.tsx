import { useEffect, useState, useRef, useCallback, forwardRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSchoolData } from '../hooks/useSchoolData'
import { LoadingState, ErrorState } from '../components/States'
import { Check, ChevronDown, Save } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AlunoNota {
  aluno_id: string
  aluno_nome: string
  nota_id: string | null
  nota: string
  frequencia: string
  saved: boolean
  error: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notaColor(v: number) {
  return v >= 7 ? 'text-green-600' : v >= 5 ? 'text-amber-600' : 'text-red-600'
}

// ─── Componente de linha ──────────────────────────────────────────────────────
// forwardRef expõe o input de Nota para que a linha anterior possa focar nele via Tab

const AlunoNotaRow = forwardRef<HTMLInputElement, {
  row: AlunoNota
  index: number
  onChangeNota: (i: number, v: string) => void
  onChangeFreq: (i: number, v: string) => void
  onSave: (i: number) => void
  saving: boolean
  isLast: boolean
  onNextRow: (i: number) => void
}>(function AlunoNotaRow(
  { row, index, onChangeNota, onChangeFreq, onSave, saving, isLast, onNextRow },
  notaRef   // <- ref do input Nota, exposto para a linha anterior usar via Tab
) {
  const freqRef = useRef<HTMLInputElement>(null)

  const notaNum = parseFloat(row.nota)
  const freqNum = parseInt(row.frequencia)
  const hasValues = !isNaN(notaNum) && !isNaN(freqNum)

  return (
    <tr className={`transition-colors ${row.saved ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
      {/* Nome */}
      <td className="px-6 py-2.5 font-medium text-gray-900 text-sm">{row.aluno_nome}</td>

      {/* Nota */}
      <td className="px-3 py-2.5">
        <input
          ref={notaRef}
          type="number" min={0} max={10} step={0.1}
          placeholder="0,0 – 10,0"
          value={row.nota}
          onChange={(e) => onChangeNota(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); freqRef.current?.focus() }
            if (e.key === 'Enter')              { e.preventDefault(); freqRef.current?.focus() }
            if (e.key === 'Escape')             { onChangeNota(index, ''); onChangeFreq(index, '') }
          }}
          className={`w-24 rounded-lg border px-2.5 py-1.5 text-center text-sm outline-none transition-all
            ${row.error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            focus:border-[#185FA5] focus:ring-2 focus:ring-blue-100`}
        />
      </td>

      {/* Frequência */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          <input
            ref={freqRef}
            type="number" min={0} max={100}
            placeholder="0 – 100"
            value={row.frequencia}
            onChange={(e) => onChangeFreq(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault()
                // Salva silenciosamente e pula para o input de Nota da próxima linha
                onSave(index)
                if (!isLast) onNextRow(index)
              }
              if (e.key === 'Tab' && e.shiftKey) {
                // Shift+Tab volta para o input de Nota da mesma linha (comportamento natural)
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                onSave(index)
                if (!isLast) onNextRow(index)
              }
              if (e.key === 'Escape') { onChangeNota(index, ''); onChangeFreq(index, '') }
            }}
            className={`w-24 rounded-lg border px-2.5 py-1.5 text-center text-sm outline-none transition-all
              ${row.error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              focus:border-[#185FA5] focus:ring-2 focus:ring-blue-100`}
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 text-center">
        {row.saved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <Check className="h-3 w-3" /> Salvo
          </span>
        ) : row.error ? (
          <span className="text-xs text-red-500">{row.error}</span>
        ) : hasValues ? (
          <button
            onClick={() => onSave(index)}
            disabled={saving}
            className="rounded-lg bg-[#185FA5] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0C447C] disabled:opacity-50 transition-colors"
          >
            Salvar
          </button>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Preview nota */}
      <td className="px-3 py-2.5 text-center">
        {hasValues ? (
          <span className={`text-sm font-bold ${notaColor(notaNum)}`}>
            {notaNum.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
    </tr>
  )
})

// ─── Select estilizado ────────────────────────────────────────────────────────

function Select({
  label, value, onChange, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-blue-100 transition-all"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LancamentoMassa() {
  const { data, isLoading, error } = useSchoolData()

  const [turmaId, setTurmaId]           = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [etapa, setEtapa]               = useState('')

  const [alunosNota, setAlunosNota]     = useState<AlunoNota[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [savedAll, setSavedAll]         = useState(false)

  // Array de refs para o input de Nota de cada linha
  const notaRefs = useRef<(HTMLInputElement | null)[]>([])

  const turmas           = data?.turmas           ?? []
  const disciplinas      = data?.disciplinas      ?? []
  const turmaDisciplinas = data?.turmaDisciplinas ?? []

  const disciplinasDaTurma = turmaDisciplinas
    .filter((td) => td.turma_id === turmaId)
    .map((td) => td.disciplina_id)

  const disciplinasFiltradas = disciplinas
    .filter((d) => disciplinasDaTurma.includes(d.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  useEffect(() => { setDisciplinaId('') }, [turmaId])

  useEffect(() => {
    if (!turmaId || !disciplinaId || !etapa) { setAlunosNota([]); return }
    carregarAlunos()
  }, [turmaId, disciplinaId, etapa])

  async function carregarAlunos() {
    setLoadingAlunos(true)
    setSavedAll(false)

    const { data: alunosData } = await supabase
      .from('alunos').select('id, nome').eq('turma_id', turmaId).order('nome')

    const { data: notasData } = await supabase
      .from('notas')
      .select('id, aluno_id, nota, frequencia')
      .eq('disciplina_id', disciplinaId)
      .eq('etapa', parseInt(etapa))
      .in('aluno_id', (alunosData ?? []).map((a) => a.id))

    const notaMap = new Map((notasData ?? []).map((n) => [n.aluno_id, n]))

    setAlunosNota(
      (alunosData ?? []).map((a) => {
        const existing = notaMap.get(a.id)
        return {
          aluno_id:   a.id,
          aluno_nome: a.nome,
          nota_id:    existing?.id ?? null,
          nota:       existing?.nota != null ? String(existing.nota) : '',
          frequencia: existing?.frequencia != null ? String(existing.frequencia) : '',
          saved:      false,
          error:      '',
        }
      })
    )

    // Foca automaticamente no primeiro input de nota ao carregar
    setTimeout(() => notaRefs.current[0]?.focus(), 50)

    setLoadingAlunos(false)
  }

  // Foca o input de Nota da linha seguinte
  function focarProximaLinha(index: number) {
    notaRefs.current[index + 1]?.focus()
  }

  function changeNota(i: number, v: string) {
    setAlunosNota((prev) => prev.map((r, idx) =>
      idx === i ? { ...r, nota: v, saved: false, error: '' } : r
    ))
  }

  function changeFreq(i: number, v: string) {
    setAlunosNota((prev) => prev.map((r, idx) =>
      idx === i ? { ...r, frequencia: v, saved: false, error: '' } : r
    ))
  }

  const salvarAluno = useCallback(async (i: number) => {
    const row = alunosNota[i]
    const notaNum = parseFloat(row.nota)
    const freqNum = parseInt(row.frequencia)

    if (isNaN(notaNum) || isNaN(freqNum)) {
      setAlunosNota((prev) => prev.map((r, idx) =>
        idx === i ? { ...r, error: 'Preencha nota e frequência' } : r))
      return
    }
    if (notaNum < 0 || notaNum > 10) {
      setAlunosNota((prev) => prev.map((r, idx) =>
        idx === i ? { ...r, error: 'Nota deve ser 0–10' } : r))
      return
    }
    if (freqNum < 0 || freqNum > 100) {
      setAlunosNota((prev) => prev.map((r, idx) =>
        idx === i ? { ...r, error: 'Freq deve ser 0–100' } : r))
      return
    }

    setSaving(true)

    const { error: err } = row.nota_id
      ? await supabase.from('notas')
          .update({ nota: notaNum, frequencia: freqNum })
          .eq('id', row.nota_id)
      : await supabase.from('notas').insert({
          aluno_id:      row.aluno_id,
          disciplina_id: disciplinaId,
          etapa:         parseInt(etapa),
          nota:          notaNum,
          frequencia:    freqNum,
        })

    setSaving(false)

    setAlunosNota((prev) => prev.map((r, idx) =>
      idx === i ? { ...r, error: err?.message ?? '', saved: !err } : r
    ))
  }, [alunosNota, disciplinaId, etapa])

  async function salvarTodos() {
    setSaving(true)
    for (let i = 0; i < alunosNota.length; i++) {
      await salvarAluno(i)
    }
    setSaving(false)
    setSavedAll(true)
  }

  const prontoParaSalvar = alunosNota.some((r) => r.nota !== '' && r.frequencia !== '')
  const totalSalvos      = alunosNota.filter((r) => r.saved).length

  if (isLoading) return <LoadingState />
  if (error)     return <ErrorState message={error} />

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Lançamento em massa</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Turma" value={turmaId} onChange={setTurmaId}
            placeholder="Selecione a turma..."
            options={[...turmas]
              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
              .map((t) => ({ value: t.id, label: `${t.nome} — ${t.ano}` }))}
          />
          <Select
            label="Disciplina" value={disciplinaId} onChange={setDisciplinaId}
            placeholder={turmaId ? 'Selecione a disciplina...' : 'Selecione a turma primeiro'}
            options={disciplinasFiltradas.map((d) => ({ value: d.id, label: d.nome }))}
          />
          <Select
            label="Etapa" value={etapa} onChange={setEtapa}
            placeholder="Selecione a etapa..."
            options={[
              { value: '1', label: '1ª Etapa' },
              { value: '2', label: '2ª Etapa' },
              { value: '3', label: '3ª Etapa' },
            ]}
          />
        </div>
      </div>

      {/* Tabela */}
      {turmaId && disciplinaId && etapa && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {alunosNota.length} alunos
                {totalSalvos > 0 && (
                  <span className="ml-2 text-sm font-normal text-green-600">· {totalSalvos} salvos</span>
                )}
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">
                <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Tab</kbd>
                {' '}avança campo e linha ·{' '}
                <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
                {' '}salva e avança ·{' '}
                <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
                {' '}limpa linha
              </p>
            </div>
            {prontoParaSalvar && (
              <button
                onClick={salvarTodos} disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C447C] disabled:opacity-60 transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar todos'}
              </button>
            )}
          </div>

          {loadingAlunos ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Carregando alunos...</div>
          ) : alunosNota.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Nenhum aluno nesta turma.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Aluno', 'Nota', 'Frequência', 'Status', 'Preview'].map((h, i) => (
                      <th key={i} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 first:px-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {alunosNota.map((row, i) => (
                    <AlunoNotaRow
                      key={row.aluno_id}
                      ref={(el) => { notaRefs.current[i] = el }}
                      row={row}
                      index={i}
                      onChangeNota={changeNota}
                      onChangeFreq={changeFreq}
                      onSave={salvarAluno}
                      saving={saving}
                      isLast={i === alunosNota.length - 1}
                      onNextRow={focarProximaLinha}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {savedAll && (
            <div className="border-t border-gray-100 px-6 py-3 text-center text-sm font-medium text-green-600">
              ✓ Todas as notas foram salvas com sucesso.
            </div>
          )}
        </div>
      )}
    </div>
  )
}