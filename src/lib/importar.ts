import { supabase } from './supabase'
import type { NotaImportada } from './parsers/parseBoletim'

export type ModoConflito = 'sobrescrever' | 'pular'

export interface ResultadoConflito {
  novas: number
  existentes: number
  conflitos: NotaImportada[]
}

// ─── Detecta quais registros já existem no banco ──────────────────────────────

export async function detectarConflitos(
  notas: NotaImportada[]
): Promise<ResultadoConflito> {
  const nomesAlunos      = [...new Set(notas.map((n) => n.nomeAluno))]
  const nomesDisciplinas = [...new Set(notas.map((n) => n.disciplina))]

  const { data: alunosData } = await supabase
    .from('alunos')
    .select('id, nome, turmas(nome)')
    .in('nome', nomesAlunos)

  const alunoMap = new Map<string, string>()
  for (const a of alunosData ?? []) {
    const turmaNome = (a.turmas as any)?.nome ?? ''
    alunoMap.set(`${a.nome}-${turmaNome}`, a.id)
  }

  const { data: disciplinasData } = await supabase
    .from('disciplinas')
    .select('id, nome')
    .in('nome', nomesDisciplinas)

  const disciplinaMap = new Map<string, string>()
  for (const d of disciplinasData ?? []) {
    disciplinaMap.set(d.nome, d.id)
  }

  const pares = notas
    .map((n) => ({
      nota:        n,
      alunoId:     alunoMap.get(`${n.nomeAluno}-${n.turma}`),
      disciplinaId: disciplinaMap.get(n.disciplina),
    }))
    .filter((p) => p.alunoId && p.disciplinaId)

  if (pares.length === 0) {
    return { novas: notas.length, existentes: 0, conflitos: [] }
  }

  const alunoIds = [...new Set(pares.map((p) => p.alunoId!))]
  const { data: notasExistentes } = await supabase
    .from('notas')
    .select('aluno_id, disciplina_id, etapa')
    .in('aluno_id', alunoIds)

  const existenteSet = new Set(
    (notasExistentes ?? []).map((n) => `${n.aluno_id}-${n.disciplina_id}-${n.etapa}`)
  )

  const conflitos: NotaImportada[] = []
  for (const { nota, alunoId, disciplinaId } of pares) {
    if (existenteSet.has(`${alunoId}-${disciplinaId}-${nota.etapa}`)) {
      conflitos.push(nota)
    }
  }

  return {
    novas:      notas.length - conflitos.length,
    existentes: conflitos.length,
    conflitos,
  }
}

// ─── Importação principal ─────────────────────────────────────────────────────

export async function importarNotas(
  notas: NotaImportada[],
  anoFallback: number,
  modoConflito: ModoConflito,
  onProgress?: (atual: number, total: number) => void
): Promise<string[]> {
  const erros: string[] = []
  let atual = 0
  const total = notas.length

  const cacheTurmas      = new Map<string, string>()
  const cacheAlunos      = new Map<string, string>()
  const cacheDisciplinas = new Map<string, string>()

  // Pré-carrega notas existentes quando modo = pular
  let existentesSet = new Set<string>()

  if (modoConflito === 'pular') {
    const nomesAlunos = [...new Set(notas.map((n) => n.nomeAluno))]
    const { data: alunosData } = await supabase
      .from('alunos')
      .select('id, nome')
      .in('nome', nomesAlunos)

    const alunoIds = (alunosData ?? []).map((a) => a.id)

    if (alunoIds.length > 0) {
      const { data: notasExistentes } = await supabase
        .from('notas')
        .select('aluno_id, disciplina_id, etapa')
        .in('aluno_id', alunoIds)

      existentesSet = new Set(
        (notasExistentes ?? []).map((n) => `${n.aluno_id}-${n.disciplina_id}-${n.etapa}`)
      )
    }
  }

  for (const n of notas) {
    try {
      const anoFinal = n.ano ?? anoFallback

      // ── Turma ──────────────────────────────────────────────────────────
      const turmaKey = `${n.turma}-${anoFinal}`
      let turmaId = cacheTurmas.get(turmaKey)

      if (!turmaId) {
        const { data: turmaExistente } = await supabase
          .from('turmas').select('id').eq('nome', n.turma).eq('ano', anoFinal).maybeSingle()

        if (turmaExistente) {
          turmaId = turmaExistente.id
        } else {
          const { data: novaTurma, error } = await supabase
            .from('turmas').insert({ nome: n.turma, ano: anoFinal }).select('id').single()
          if (error) throw new Error(`Turma "${n.turma}": ${error.message}`)
          turmaId = novaTurma.id
        }
        cacheTurmas.set(turmaKey, turmaId)
      }

      // ── Aluno ───────────────────────────────────────────────────────────
      const alunoKey = `${n.nomeAluno}-${turmaId}`
      let alunoId = cacheAlunos.get(alunoKey)

      if (!alunoId) {
        const { data: alunoExistente } = await supabase
          .from('alunos').select('id').eq('nome', n.nomeAluno).eq('turma_id', turmaId).maybeSingle()

        if (alunoExistente) {
          alunoId = alunoExistente.id
        } else {
          const { data: novoAluno, error: erroAluno } = await supabase
            .from('alunos').insert({ nome: n.nomeAluno, turma_id: turmaId }).select('id').single()
          if (erroAluno) throw new Error(`Aluno "${n.nomeAluno}": ${erroAluno.message}`)
          alunoId = novoAluno.id

          // Matricula — só insere se não existir
          const { data: matriculaExistente } = await supabase
            .from('matriculas').select('id')
            .eq('aluno_id', alunoId).eq('turma_id', turmaId).eq('ano', anoFinal).maybeSingle()

          if (!matriculaExistente) {
            await supabase.from('matriculas').insert({ aluno_id: alunoId, turma_id: turmaId, ano: anoFinal })
          }
        }
        cacheAlunos.set(alunoKey, alunoId)
      }

      // ── Disciplina ──────────────────────────────────────────────────────
      let disciplinaId = cacheDisciplinas.get(n.disciplina)

      if (!disciplinaId) {
        const { data: disciplinaExistente } = await supabase
          .from('disciplinas').select('id').eq('nome', n.disciplina).maybeSingle()

        if (disciplinaExistente) {
          disciplinaId = disciplinaExistente.id
        } else {
          const { data: novaDisciplina, error: erroDisc } = await supabase
            .from('disciplinas').insert({ nome: n.disciplina }).select('id').single()
          if (erroDisc) throw new Error(`Disciplina "${n.disciplina}": ${erroDisc.message}`)
          disciplinaId = novaDisciplina.id
        }
        cacheDisciplinas.set(n.disciplina, disciplinaId)
      }

      // ── Nota ────────────────────────────────────────────────────────────
      const chaveNota = `${alunoId}-${disciplinaId}-${n.etapa}`

      if (modoConflito === 'pular' && existentesSet.has(chaveNota)) {
        atual++
        onProgress?.(atual, total)
        continue
      }

      const { error: erroNota } = await supabase
        .from('notas')
        .upsert(
          { aluno_id: alunoId, disciplina_id: disciplinaId, etapa: n.etapa, nota: n.nota, frequencia: n.frequencia },
          { onConflict: 'aluno_id,disciplina_id,etapa' }
        )

      if (erroNota) throw new Error(`Nota de "${n.nomeAluno}": ${erroNota.message}`)

    } catch (err: any) {
      console.error(err)
      erros.push(err?.message ?? `Erro com ${n.nomeAluno} (${n.disciplina})`)
    }

    atual++
    onProgress?.(atual, total)
  }

  return erros
}