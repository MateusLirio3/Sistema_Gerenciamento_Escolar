import * as XLSX from 'xlsx'

export interface NotaImportada {
  nomeAluno: string
  turma: string
  disciplina: string
  etapa: 1 | 2 | 3
  nota: number
  frequencia: number
  ano: number | null // extraído da planilha se disponível
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tenta extrair um ano (4 dígitos, entre 2000–2099) de uma string.
 * Ex: "INF21 2025 - Linguagem" → 2025
 */
function extrairAno(texto: string): number | null {
  const match = texto.match(/\b(20\d{2})\b/)
  return match ? parseInt(match[1]) : null
}

/**
 * Calcula frequência com base nas colunas entre o nome do aluno e a nota.
 * Colunas com 'P' = presente, qualquer outro valor preenchido = ausente.
 */
function calcularFrequencia(
  row: unknown[],
  colNomeAluno: number,
  colNota: number
): number {
  const inicio = colNomeAluno + 1
  const fim = colNota - 5
  if (fim < inicio) return 100

  let presencas = 0
  let total = 0

  for (let c = inicio; c <= fim; c++) {
    const val = row[c]
    if (val !== undefined && val !== null && val !== '') {
      total++
      if (val === 'P') presencas++
    }
  }

  if (total === 0) return 100
  return Math.round((presencas / total) * 100 * 10) / 10
}

/**
 * Parseia um bloco de etapa dentro de uma aba.
 */
function parseEtapaFromRows(
  rows: unknown[][],
  inicioIdx: number,
  etapa: 1 | 2 | 3,
  sheetName: string
): NotaImportada[] {
  const linhaCabecalhoTurma = rows[inicioIdx + 1]
  const linhaCabecalhoCols  = rows[inicioIdx + 2]

  if (!linhaCabecalhoTurma || !linhaCabecalhoCols) return []

  // Linha de cabeçalho: ex. ["INF21", "Linguagem da Programação", "2025", ...]
  const headerTexto = linhaCabecalhoTurma
    .map((c) => String(c ?? '').trim())
    .filter(Boolean)

  const turma      = headerTexto[0] ?? ''
  const disciplina = headerTexto[1] ?? sheetName

  // Tenta extrair ano do cabeçalho da turma ou do nome da disciplina
  const anoExtraido =
    extrairAno(headerTexto.join(' ')) ??
    extrairAno(sheetName) ??
    null

  const colNota      = linhaCabecalhoCols.indexOf('etapa')
  const colNomeAluno = linhaCabecalhoCols.findIndex((c) =>
    String(c).toLowerCase().includes('nome')
  )

  if (colNota === -1 || colNomeAluno === -1) return []

  const notas: NotaImportada[] = []

  for (let i = inicioIdx + 3; i < rows.length; i++) {
    const row = rows[i]

    if (!row || row.length === 0) break
    if (typeof row[0] === 'string' && String(row[0]).startsWith('ETAPA')) break

    const nome = String(row[colNomeAluno] ?? '').trim()

    if (!nome || nome.toLowerCase().includes('etc')) break
    if (nome.toLowerCase().includes('nome')) continue

    const nota = Number(row[colNota] ?? 0)
    if (nota <= 0) continue

    const frequencia = calcularFrequencia(row, colNomeAluno, colNota)

    notas.push({
      nomeAluno:  nome,
      turma:      turma.trim(),
      disciplina: disciplina.trim(),
      etapa,
      nota,
      frequencia,
      ano: anoExtraido,
    })
  }

  return notas
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Parseia um arquivo .xlsx e retorna todas as notas encontradas.
 *
 * @param buffer        ArrayBuffer do arquivo
 * @param etapaForcada  Se informada, ignora outras etapas da planilha.
 *                      Se omitida, detecta automaticamente todas as etapas.
 * @param anoForcado    Se informado pelo usuário na UI, sobrescreve o ano extraído.
 */
export function parseArquivoBoletim(
  buffer: ArrayBuffer,
  etapaForcada?: 1 | 2 | 3,
  anoForcado?: number
): NotaImportada[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const notas: NotaImportada[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
    })

    // Detecta onde cada etapa começa
    const etapasEncontradas: { idx: number; num: 1 | 2 | 3 }[] = []

    rows.forEach((row, i) => {
      const linhaTexto = row
        .map((c) => String(c ?? '').toUpperCase().trim())
        .join(' ')
      if (linhaTexto.includes('ETAPA 1')) etapasEncontradas.push({ idx: i, num: 1 })
      if (linhaTexto.includes('ETAPA 2')) etapasEncontradas.push({ idx: i, num: 2 })
      if (linhaTexto.includes('ETAPA 3')) etapasEncontradas.push({ idx: i, num: 3 })
    })

    for (const { idx, num } of etapasEncontradas) {
      // Se o usuário forçou uma etapa, pula as outras
      if (etapaForcada && num !== etapaForcada) continue

      const notasEtapa = parseEtapaFromRows(rows, idx, num, sheetName)

      // Se ano foi forçado pelo usuário na UI, sobrescreve o extraído
      const notasComAno = notasEtapa.map((n) => ({
        ...n,
        ano: anoForcado ?? n.ano,
      }))

      notas.push(...notasComAno)
    }
  }

  return notas
}