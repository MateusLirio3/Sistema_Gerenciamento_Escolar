import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type Etapa = {
  id: string
  turma_id: string
  numero: 1 | 2 | 3
  data_inicio: string | null  // ISO date "YYYY-MM-DD"
  data_fim: string | null
}

/**
 * Retorna as etapas de uma turma específica.
 * Se turmaId for vazio/null, retorna array vazio.
 */
export function useEtapas(turmaId: string | null) {
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!turmaId) { setEtapas([]); return }
    setIsLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('etapas')
      .select('id,turma_id,numero,data_inicio,data_fim')
      .eq('turma_id', turmaId)
      .order('numero')
    setIsLoading(false)
    if (err) { setError(err.message); return }
    setEtapas((data ?? []) as Etapa[])
  }, [turmaId])

  useEffect(() => { load() }, [load])

  return { etapas, isLoading, error, reload: load }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Retorna o número da etapa vigente (hoje está entre data_inicio e data_fim).
 * Se nenhuma estiver vigente, retorna null.
 */
export function getEtapaVigente(etapas: Etapa[]): Etapa | null {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return (
    etapas.find((e) => {
      if (!e.data_inicio || !e.data_fim) return false
      const inicio = new Date(e.data_inicio)
      const fim = new Date(e.data_fim)
      fim.setHours(23, 59, 59, 999)
      return hoje >= inicio && hoje <= fim
    }) ?? null
  )
}

/**
 * Retorna a etapa mais recente que já passou (último período encerrado).
 * Útil para saber "qual etapa já foi concluída" quando nenhuma está vigente.
 */
export function getUltimaEtapaEncerrada(etapas: Etapa[]): Etapa | null {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const encerradas = etapas.filter((e) => {
    if (!e.data_fim) return false
    return new Date(e.data_fim) < hoje
  })
  if (encerradas.length === 0) return null
  return encerradas.reduce((a, b) => (a.numero > b.numero ? a : b))
}

/**
 * Verifica se uma etapa específica está dentro do seu período.
 */
export function isEtapaAberta(etapas: Etapa[], numero: 1 | 2 | 3): boolean {
  const etapa = etapas.find((e) => e.numero === numero)
  if (!etapa?.data_inicio || !etapa?.data_fim) return true // sem datas = sem restrição
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(etapa.data_inicio)
  const fim = new Date(etapa.data_fim)
  fim.setHours(23, 59, 59, 999)
  return hoje >= inicio && hoje <= fim
}

/**
 * Formata data ISO "YYYY-MM-DD" para "DD/MM/YYYY".
 */
export function formatDataEtapa(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}