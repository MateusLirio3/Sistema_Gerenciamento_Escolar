import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

export type SchoolData = {
  turmas: Turma[]
  alunos: Aluno[]
  notas: Nota[]
  disciplinas: Disciplina[]
  turmaDisciplinas: TurmaDisciplina[]
}

export function useSchoolData() {
  const [data, setData] = useState<SchoolData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const [turmasRes, alunosRes, notasRes, disciplinasRes, turmaDisciplinasRes] =
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
        ])

      const err =
        turmasRes.error ||
        alunosRes.error ||
        notasRes.error ||
        disciplinasRes.error ||
        turmaDisciplinasRes.error
      if (err) throw err

      setData({
        turmas:           (turmasRes.data           ?? []) as Turma[],
        alunos:           (alunosRes.data           ?? []) as Aluno[],
        notas:            (notasRes.data            ?? []) as Nota[],
        disciplinas:      (disciplinasRes.data      ?? []) as Disciplina[],
        turmaDisciplinas: (turmaDisciplinasRes.data ?? []) as TurmaDisciplina[],
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { data, isLoading, error, reload: load, refetch: load }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}