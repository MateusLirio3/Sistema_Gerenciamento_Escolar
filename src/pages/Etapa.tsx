// src/pages/Etapa.tsx — substitua o arquivo vazio
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CalendarDays, Check, AlertCircle } from 'lucide-react'
import { LoadingState, ErrorState } from '../components/States'

interface Etapa {
  id: string
  numero: number
  data_inicio: string | null
  data_fim: string | null
  turma_id: string
}

interface Turma {
  id: string
  nome: string
  ano: number
}

export default function Etapa() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('')
  const [etapas, setEtapas] = useState<Record<number, Etapa | null>>({
    1: null, 2: null, 3: null,
  })
  const [form, setForm] = useState({
    1: { inicio: '', fim: '' },
    2: { inicio: '', fim: '' },
    3: { inicio: '', fim: '' },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)

  useEffect(() => {
    async function carregarTurmas() {
      const { data, error } = await supabase
        .from('turmas').select('id,nome,ano')
        .order('ano', { ascending: false }).order('nome')
      if (error) { setPageError(error.message); }
      else { setTurmas(data ?? []) }
      setLoading(false)
    }
    carregarTurmas()
  }, [])

  useEffect(() => {
    if (!turmaSelecionada) return
    carregarEtapas()
  }, [turmaSelecionada])

  async function carregarEtapas() {
    const { data } = await supabase
      .from('etapas')
      .select('id,numero,data_inicio,data_fim,turma_id')
      .eq('turma_id', turmaSelecionada)

    const mapa: Record<number, Etapa | null> = { 1: null, 2: null, 3: null }
    const novoForm = {
      1: { inicio: '', fim: '' },
      2: { inicio: '', fim: '' },
      3: { inicio: '', fim: '' },
    }

    ;(data ?? []).forEach((e: Etapa) => {
      mapa[e.numero] = e
      novoForm[e.numero as 1|2|3] = {
        inicio: e.data_inicio ?? '',
        fim: e.data_fim ?? '',
      }
    })

    setEtapas(mapa)
    setForm(novoForm as typeof form)
  }

  async function salvar() {
    if (!turmaSelecionada) return
    setSaving(true)
    setFeedback(null)

    try {
      for (const numero of [1, 2, 3] as const) {
        const { inicio, fim } = form[numero]
        const existing = etapas[numero]

        const payload = {
          turma_id: turmaSelecionada,
          numero,
          data_inicio: inicio || null,
          data_fim: fim || null,
        }

        if (existing) {
          const { error } = await supabase
            .from('etapas').update(payload).eq('id', existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('etapas').insert(payload)
          if (error) throw error
        }
      }

      setFeedback({ tipo: 'ok', msg: 'Datas salvas com sucesso.' })
      carregarEtapas()
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: err.message ?? 'Erro ao salvar.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />
  if (pageError) return <ErrorState message={pageError} />

  const turmaSel = turmas.find((t) => t.id === turmaSelecionada)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-[#185FA5]" />
          <h2 className="text-lg font-semibold text-gray-900">Configuração de Etapas</h2>
        </div>

        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-xs font-medium text-gray-600">Turma</label>
          <select
            value={turmaSelecionada}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-[#185FA5] focus:outline-none"
          >
            <option value="">Selecione uma turma...</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome} — {t.ano}</option>
            ))}
          </select>
        </div>
      </div>

      {turmaSelecionada && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">
              Datas — {turmaSel?.nome} {turmaSel?.ano}
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Configure o início e fim de cada etapa letiva
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {([1, 2, 3] as const).map((num) => (
              <div key={num} className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-3 sm:items-center">
                <div>
                  <p className="font-medium text-gray-900">{num}ª Etapa</p>
                  <p className="text-xs text-gray-400">
                    {etapas[num] ? 'Configurada' : 'Não configurada'}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Início</label>
                  <input
                    type="date"
                    value={form[num].inicio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [num]: { ...f[num], inicio: e.target.value } }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Fim</label>
                  <input
                    type="date"
                    value={form[num].fim}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [num]: { ...f[num], fim: e.target.value } }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            {feedback ? (
              <div className={`flex items-center gap-2 text-sm ${
                feedback.tipo === 'ok' ? 'text-green-600' : 'text-red-600'
              }`}>
                {feedback.tipo === 'ok'
                  ? <Check className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />}
                {feedback.msg}
              </div>
            ) : <span />}
            <button
              onClick={salvar}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors disabled:opacity-60"
            >
              {saving
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Check className="h-4 w-4" />}
              Salvar datas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}