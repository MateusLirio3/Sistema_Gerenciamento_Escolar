import { type Turma, type Aluno, type Nota, type TurmaDisciplina } from './useSchoolData'

export type TurmaProgress = {
  turma: Turma
  alunosTurma: Aluno[]
  totalPares: number
  paresComNota: number
  progress: number
  pendencias: number
}

export function useTurmaProgress(
  turmas: Turma[],
  alunos: Aluno[],
  notas: Nota[],
  turmaDisciplinas: TurmaDisciplina[]
): TurmaProgress[] {
  return turmas.map((turma) => {
    const alunosTurma = alunos.filter((a) => a.turma_id === turma.id)
    const disciplinasDaTurma = turmaDisciplinas
      .filter((td) => td.turma_id === turma.id)
      .map((td) => td.disciplina_id)

      const etapasDaTurma = 3

      const totalPares = alunosTurma.length * disciplinasDaTurma.length * etapasDaTurma

      const paresComNota = new Set(
        notas
          .filter(
            (n) =>
              n.nota !== null &&
              alunosTurma.some((a) => a.id === n.aluno_id) &&
              disciplinasDaTurma.includes(n.disciplina_id ?? '')
          )
          .map((n) => `${n.aluno_id}:${n.disciplina_id}:${n.etapa}`)
      ).size

    const progress = totalPares
      ? Math.round((paresComNota / totalPares) * 100)
      : 0
    const pendencias = Math.max(totalPares - paresComNota, 0)

    return { turma, alunosTurma, totalPares, paresComNota, progress, pendencias }
  })
}