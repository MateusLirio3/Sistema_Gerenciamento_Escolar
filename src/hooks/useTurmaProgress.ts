import { type Turma, type Aluno, type Nota, type TurmaDisciplina, type Etapa } from './useSchoolData'

export type TurmaProgress = {
  turma: Turma
  alunosTurma: Aluno[]
  totalPares: number
  paresComNota: number
  progress: number
  pendencias: number
  etapasDaTurma: number   // quantas etapas estão cadastradas para esta turma
}

export function useTurmaProgress(
  turmas: Turma[],
  alunos: Aluno[],
  notas: Nota[],
  turmaDisciplinas: TurmaDisciplina[],
  etapas: Etapa[]           // now required — comes from useSchoolData
): TurmaProgress[] {
  return turmas.map((turma) => {
    const alunosTurma = alunos.filter((a) => a.turma_id === turma.id)
    const disciplinasDaTurma = turmaDisciplinas
      .filter((td) => td.turma_id === turma.id)
      .map((td) => td.disciplina_id)

    // Use the real number of etapas registered for this turma.
    // Fall back to 3 only if no etapas have been configured yet.
    const etapasDaTurma = etapas.filter((e) => e.turma_id === turma.id).length || 3

    const totalPares = alunosTurma.length * disciplinasDaTurma.length * etapasDaTurma

    // Count unique (aluno, disciplina, etapa) triples that have a nota
    const paresComNota = new Set(
      notas
        .filter(
          (n) =>
            n.nota !== null &&
            alunosTurma.some((a) => a.id === n.aluno_id) &&
            disciplinasDaTurma.includes(n.disciplina_id ?? '') &&
            n.etapa !== null &&
            n.etapa <= etapasDaTurma
        )
        .map((n) => `${n.aluno_id}:${n.disciplina_id}:${n.etapa}`)
    ).size

    const progress    = totalPares ? Math.round((paresComNota / totalPares) * 100) : 0
    const pendencias  = Math.max(totalPares - paresComNota, 0)

    return { turma, alunosTurma, totalPares, paresComNota, progress, pendencias, etapasDaTurma }
  })
}