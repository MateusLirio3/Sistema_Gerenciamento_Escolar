import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  useSchoolData,
  formatNumber,
  type Aluno,
  type Turma,
  type Nota,
  type TurmaDisciplina,
} from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'


// ── Status helpers ────────────────────────────────────────────────────────────

function getStatusNotas(
  aluno: Aluno,
  notas: Nota[],
  turmaDisciplinas: TurmaDisciplina[]
): 'completo' | 'parcial' | 'pendente' {
  if (!aluno.turma_id) return 'pendente'

  const disciplinasDaTurma = turmaDisciplinas
    .filter((td) => td.turma_id === aluno.turma_id)
    .map((td) => td.disciplina_id)
  if (disciplinasDaTurma.length === 0) return 'pendente'

  const disciplinasComNota = new Set(
    notas.filter((n) => n.aluno_id === aluno.id && n.nota !== null).map((n) => n.disciplina_id)
  )

  const totalComNota = disciplinasDaTurma.filter((id) => disciplinasComNota.has(id)).length
  if (totalComNota === 0) return 'pendente'
  if (totalComNota === disciplinasDaTurma.length) return 'completo'
  return 'parcial'
}

// FIX 1: Removed duplicate keys from STATUS_CONFIG
const STATUS_CONFIG = {
  completo: { label: 'Com notas',     className: 'bg-green-50 text-green-700' },
  parcial:  { label: 'Incompleto',    className: 'bg-amber-50 text-amber-700' },
  pendente: { label: 'Nota pendente', className: 'bg-red-50 text-red-600'    },
}


// ── Modal de criação / edição ─────────────────────────────────────────────────

interface AlunoFormData {
  nome: string
  matricula: string
  turma_id: string
}

interface ModalProps {
  turmas: Turma[]
  aluno?: Aluno | null
  onClose: () => void
  onSaved: () => void
}

function AlunoModal({ turmas, aluno, onClose, onSaved }: ModalProps) {
  const isEdit = !!aluno
  const [form, setForm] = useState<AlunoFormData>({
    nome:      aluno?.nome      ?? '',
    matricula: aluno?.matricula != null ? String(aluno.matricula) : '',
    turma_id:  aluno?.turma_id  ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  function set(field: keyof AlunoFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.nome.trim()) { setErr('Nome é obrigatório.'); return }
    if (!form.turma_id)    { setErr('Selecione uma turma.'); return }

    if (form.matricula.trim() !== '' && !/^\d{1,13}$/.test(form.matricula.trim())) {
      setErr('Matrícula deve conter apenas números (até 13 dígitos).')
      return
    }

    setSaving(true)
    setErr(null)

    const payload: Record<string, unknown> = {
      nome:      form.nome.trim(),
      turma_id:  form.turma_id,
      matricula: form.matricula.trim() !== '' ? BigInt(form.matricula.trim()) : null,
    }

    const { error } = isEdit
      ? await supabase.from('alunos').update(payload).eq('id', aluno!.id)
      : await supabase.from('alunos').insert(payload)

    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved()
  }

  async function handleDelete() {
    if (!aluno) return
    if (!confirm(`Excluir "${aluno.nome}"? Esta ação não pode ser desfeita.`)) return
    setSaving(true)
    const { error } = await supabase.from('alunos').delete().eq('id', aluno.id)
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar aluno' : 'Novo aluno'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {err && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>
          )}

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: João da Silva"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Matrícula */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              Matrícula <span className="text-gray-400">(até 13 dígitos)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={13}
              value={form.matricula}
              onChange={(e) => set('matricula', e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 2024000100001"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Turma */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              Turma <span className="text-red-500">*</span>
            </label>
            <select
              value={form.turma_id}
              onChange={(e) => set('turma_id', e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            >
              <option value="">Selecione uma turma...</option>
              {[...turmas]
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} — {t.ano}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          {isEdit ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Excluir aluno
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar aluno'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ── Row ───────────────────────────────────────────────────────────────────────

function AlunoRow({
  aluno,
  turmas,
  notas,
  turmaDisciplinas,
  onEdit,
}: {
  aluno: Aluno
  turmas: Turma[]
  notas: Nota[]
  turmaDisciplinas: TurmaDisciplina[]
  onEdit: (aluno: Aluno) => void
}) {
  const navigate = useNavigate()
  const turma = turmas.find((t) => t.id === aluno.turma_id)

  const notasAluno = notas.filter((n) => n.aluno_id === aluno.id && n.nota !== null)

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

  const status = getStatusNotas(aluno, notas, turmaDisciplinas)
  const { label, className } = STATUS_CONFIG[status]

  return (
    <tr
      onClick={() => navigate(`/alunos/${aluno.id}`)}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <td className="px-6 py-3 font-medium text-gray-900">{aluno.nome}</td>
      <td className="px-6 py-3 text-gray-600">{turma?.nome ?? '—'}</td>
      <td className="px-6 py-3 text-gray-600">
        {aluno.matricula != null ? String(aluno.matricula) : '—'}
      </td>
      <td className="px-6 py-3 text-gray-600">
        {media != null ? media.toFixed(1) : '—'}
      </td>
      <td className="px-6 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
          {label}
        </span>
      </td>
      <td className="px-6 py-3 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(aluno) }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          Editar
        </button>
      </td>
    </tr>
  )
}


// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlunosPage() {
  const { alunos, turmas, notas, turmaDisciplinas, loading, error, refresh } = useSchoolData()

  const [modal, setModal] = useState<{ open: boolean; aluno: Aluno | null }>({
    open: false,
    aluno: null,
  })

  function openCreate() { setModal({ open: true, aluno: null }) }
  function openEdit(aluno: Aluno) { setModal({ open: true, aluno }) }
  function closeModal() { setModal({ open: false, aluno: null }) }
  function onSaved() { closeModal(); refresh() }

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  return (
    <>
      {modal.open && (
        <AlunoModal
          turmas={turmas}
          aluno={modal.aluno}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cadastro e acompanhamento de alunos
            </h2>
            <p className="mt-0.5 text-sm text-gray-400">{alunos.length} alunos matriculados</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo aluno
          </button>
        </div>

        <div className="overflow-x-auto">
          {alunos.length === 0 ? (
            <EmptyState text="Nenhum aluno cadastrado." />
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-gray-100 text-left">
                <tr>
                  {['Aluno', 'Turma', 'Matrícula', 'Média', 'Status', ''].map((h) => (
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
                {[...alunos]
                  .sort((a, b) =>
                    a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' })
                  )
                  .map((aluno) => (
                    <AlunoRow
                      key={aluno.id}
                      aluno={aluno}
                      turmas={turmas}
                      notas={notas}
                      turmaDisciplinas={turmaDisciplinas}
                      onEdit={openEdit}
                    />
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}