import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSchoolData, type Turma, type Aluno, type Nota, type TurmaDisciplina  } from '../hooks/useSchoolData'
import { useTurmaProgress } from '../hooks/useTurmaProgress'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import { Pencil, Trash2, Plus, X, Check, AlertCircle } from 'lucide-react'

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Form de turma (criar / editar) ──────────────────────────────────────────

interface TurmaFormProps {
  initial?: { nome: string; ano: number }
  loading: boolean
  error: string
  onSubmit: (nome: string, ano: number) => void
  onCancel: () => void
  submitLabel: string
}

function TurmaForm({ initial, loading, error, onSubmit, onCancel, submitLabel }: TurmaFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [ano, setAno] = useState<string>(initial?.ano?.toString() ?? new Date().getFullYear().toString())

  function handleSubmit() {
    const anoNum = parseInt(ano)
    if (!nome.trim() || isNaN(anoNum)) return
    onSubmit(nome.trim(), anoNum)
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Nome da turma</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: INF21, ADM31..."
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none transition-colors"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Ano</label>
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ex: 2025"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none transition-colors"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !nome.trim() || !ano}
          className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

interface TurmaRowProps {
  turma: Turma
  alunos: Aluno[]
  notas: Nota[]
  turmaDisciplinas: TurmaDisciplina[]
  onEdit: (turma: Turma) => void
  onDelete: (turma: Turma) => void
}

function TurmaRow({ turma, alunos, notas, turmaDisciplinas, onEdit, onDelete }: TurmaRowProps) {
  const navigate = useNavigate()
  const [{ alunosTurma, progress, pendencias }] = useTurmaProgress([turma], alunos, notas, turmaDisciplinas)
  const temAlunos = alunosTurma.length > 0

  return (
    <div className="grid gap-3 px-6 py-4 hover:bg-gray-50 transition-colors md:grid-cols-[1fr_auto_auto_auto] md:items-center">
      {/* info — clicável */}
      <div
        className="cursor-pointer"
        onClick={() => navigate(`/turmas/${turma.id}`)}
      >
        <p className="font-semibold text-gray-900">{turma.nome}</p>
        <p className="text-sm text-gray-400">
          Ano {turma.ano} · {alunosTurma.length} aluno{alunosTurma.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* badge pendências */}
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          progress < 80 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
        }`}
      >
        {pendencias} pendência{pendencias !== 1 ? 's' : ''}
      </span>

      {/* barra de progresso */}
      <div className="min-w-[8rem]">
        <div className="h-1.5 rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-[#185FA5] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{progress}%</p>
      </div>

      {/* ações */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(turma)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Editar turma"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(turma)}
          disabled={temAlunos}
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          title={temAlunos ? 'Turma possui alunos — não pode ser excluída' : 'Excluir turma'}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'criar' }
  | { type: 'editar'; turma: Turma }
  | { type: 'excluir'; turma: Turma }

export default function Turmas() {
  const navigate = useNavigate()
  const { data, isLoading, error, reload } = useSchoolData()
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const turmas = data?.turmas ?? []
  const alunos = data?.alunos ?? []
  const notas = data?.notas ?? []

  // ── Criar ──────────────────────────────────────────────────────────────────
  async function handleCriar(nome: string, ano: number) {
    setSaving(true)
    setFormError('')
    const { data: nova, error: err } = await supabase
      .from('turmas')
      .insert({ nome, ano })
      .select('id')
      .single()

    setSaving(false)
    if (err) { setFormError(err.message); return }
    setModal({ type: 'none' })
    await reload()
    if (nova?.id) navigate(`/turmas/${nova.id}`)
  }

  // ── Editar ─────────────────────────────────────────────────────────────────
  async function handleEditar(nome: string, ano: number) {
    if (modal.type !== 'editar') return
    setSaving(true)
    setFormError('')
    const { error: err } = await supabase
      .from('turmas')
      .update({ nome, ano })
      .eq('id', modal.turma.id)

    setSaving(false)
    if (err) { setFormError(err.message); return }
    setModal({ type: 'none' })
    reload()
  }

  // ── Excluir ────────────────────────────────────────────────────────────────

  const turmaDisciplinas = data?.turmaDisciplinas ?? []
  
  async function handleExcluir() {
    if (modal.type !== 'excluir') return
    setSaving(true)
    setFormError('')
    const { error: err } = await supabase
      .from('turmas')
      .delete()
      .eq('id', modal.turma.id)

    setSaving(false)
    if (err) { setFormError(err.message); return }
    setModal({ type: 'none' })
    reload()
  }

  function abrirModal(m: ModalState) {
    setFormError('')
    setModal(m)
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestão de turmas</h2>
            <p className="mt-0.5 text-sm text-gray-400">{turmas.length} turma{turmas.length !== 1 ? 's' : ''} cadastrada{turmas.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => abrirModal({ type: 'criar' })}
            className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova turma
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {turmas.length === 0 ? (
            <EmptyState text="Nenhuma turma cadastrada." />
          ) : (
            turmas.map((turma) => (
              <TurmaRow
                key={turma.id}
                turma={turma}
                alunos={alunos}
                notas={notas}
                turmaDisciplinas={turmaDisciplinas}
                onEdit={(t) => abrirModal({ type: 'editar', turma: t })}
                onDelete={(t) => abrirModal({ type: 'excluir', turma: t })}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal Criar */}
      {modal.type === 'criar' && (
        <Modal title="Nova turma" onClose={() => setModal({ type: 'none' })}>
          <TurmaForm
            loading={saving}
            error={formError}
            onSubmit={handleCriar}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Criar turma"
          />
        </Modal>
      )}

      {/* Modal Editar */}
      {modal.type === 'editar' && (
        <Modal title="Editar turma" onClose={() => setModal({ type: 'none' })}>
          <TurmaForm
            initial={{ nome: modal.turma.nome, ano: modal.turma.ano }}
            loading={saving}
            error={formError}
            onSubmit={handleEditar}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Salvar alterações"
          />
        </Modal>
      )}

      {/* Modal Excluir */}
      {modal.type === 'excluir' && (
        <Modal title="Excluir turma" onClose={() => setModal({ type: 'none' })}>
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir a turma{' '}
              <span className="font-semibold text-gray-900">{modal.turma.nome}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal({ type: 'none' })}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}