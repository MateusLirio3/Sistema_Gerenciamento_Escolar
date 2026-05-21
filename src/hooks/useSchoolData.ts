import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Etapa } from './useEtapas'

export type Turma = {
  id: string
  nome: string
  ano: number
  serie: 1 | 2 | 3
}
export type Aluno = {
  id: string
  nome: string
  matricula: bigint | null
  turma_id: string | null
}
export type Nota = {
  id: string
  aluno_id: string | null
  disciplina_id: string | null
  etapa: number | null
  nota: number | null
  frequencia: number | null
}
export type Disciplina = { id: string; nome: string; area_id: string | null }
export type TurmaDisciplina = { id: string; turma_id: string; disciplina_id: string }

// Re-export Etapa so consumers can import from one place
export type { Etapa }

export function useSchoolData() {
  const [turmas, setTurmas]                     = useState<Turma[]>([])
  const [alunos, setAlunos]                     = useState<Aluno[]>([])
  const [notas, setNotas]                       = useState<Nota[]>([])
  const [disciplinas, setDisciplinas]           = useState<Disciplina[]>([])
  const [turmaDisciplinas, setTurmaDisciplinas] = useState<TurmaDisciplina[]>([])
  const [etapas, setEtapas]                     = useState<Etapa[]>([])
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [turmasRes, alunosRes, notasRes, disciplinasRes, turmaDisciplinasRes, etapasRes] =
        await Promise.all([
          supabase
            .from('turmas')
            .select('id,nome,ano,serie')
            .order('ano', { ascending: false })
            .order('serie')
            .order('nome'),
          supabase.from('alunos').select('id,nome,matricula,turma_id').order('nome'),
          supabase.from('notas').select('id,aluno_id,disciplina_id,etapa,nota,frequencia'),
          supabase.from('disciplinas').select('id,nome,area_id').order('nome'),
          supabase.from('turma_disciplinas').select('id,turma_id,disciplina_id'),
          supabase.from('etapas').select('id,turma_id,numero,data_inicio,data_fim').order('numero'),
        ])

      const err =
        turmasRes.error          ||
        alunosRes.error          ||
        notasRes.error           ||
        disciplinasRes.error     ||
        turmaDisciplinasRes.error ||
        etapasRes.error
      if (err) throw err

      setTurmas(          (turmasRes.data           ?? []) as Turma[])
      setAlunos(          (alunosRes.data           ?? []) as Aluno[])
      setNotas(           (notasRes.data            ?? []) as Nota[])
      setDisciplinas(     (disciplinasRes.data      ?? []) as Disciplina[])
      setTurmaDisciplinas((turmaDisciplinasRes.data ?? []) as TurmaDisciplina[])
      setEtapas(          (etapasRes.data           ?? []) as Etapa[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Flat return — no more data?.alunos, just alunos directly.
  // isLoading/reload/refetch aliases kept for back-compat with existing pages.
  return {
    turmas,
    alunos,
    notas,
    disciplinas,
    turmaDisciplinas,
    etapas,
    loading,
    isLoading: loading,   // alias
    error,
    refresh: load,
    reload:  load,        // alias
    refetch: load,        // alias
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}