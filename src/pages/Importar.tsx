import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseArquivoBoletim } from '../lib/parsers/parseBoletim'
import { importarNotas, detectarConflitos } from '../lib/importar'
import type { NotaImportada } from '../lib/parsers/parseBoletim'
import type { ModoConflito, ResultadoConflito } from '../lib/importar'
import HeaderComVoltar from '../components/HeaderComVoltar'

const ANO_ATUAL = new Date().getFullYear()
const ANOS = Array.from({ length: 6 }, (_, i) => ANO_ATUAL - i)

// ─── Modal de conflito ────────────────────────────────────────────────────────

function ModalConflito({
  resultado,
  onDecisao,
  onCancelar,
}: {
  resultado: ResultadoConflito
  onDecisao: (modo: ModoConflito) => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Conflitos detectados</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            Algumas notas já existem no banco de dados
          </p>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 gap-3 px-6 py-5">
          <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-700">{resultado.novas}</p>
            <p className="mt-0.5 text-xs text-green-600">novas</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{resultado.existentes}</p>
            <p className="mt-0.5 text-xs text-amber-600">já existem</p>
          </div>
        </div>

        {/* Lista de conflitos (até 5) */}
        {resultado.conflitos.length > 0 && (
          <div className="mx-6 mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700 max-h-32 overflow-y-auto">
            <p className="font-medium mb-1">Registros que seriam sobrescritos:</p>
            {resultado.conflitos.slice(0, 8).map((c, i) => (
              <p key={i} className="truncate">
                {c.nomeAluno} · {c.disciplina} · {c.etapa}ª etapa
              </p>
            ))}
            {resultado.conflitos.length > 8 && (
              <p className="mt-1 text-amber-500">
                +{resultado.conflitos.length - 8} outros...
              </p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-500 mb-1">O que fazer com os {resultado.existentes} registros existentes?</p>
          <button
            onClick={() => onDecisao('pular')}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Manter as notas existentes</span>
            <span className="block text-xs text-gray-400 mt-0.5">
              Apenas as {resultado.novas} notas novas serão inseridas
            </span>
          </button>
          <button
            onClick={() => onDecisao('sobrescrever')}
            className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm hover:bg-amber-100 transition-colors"
          >
            <span className="font-medium text-amber-800">Sobrescrever todas</span>
            <span className="block text-xs text-amber-600 mt-0.5">
              Todas as {resultado.existentes} notas existentes serão substituídas
            </span>
          </button>
          <button
            onClick={onCancelar}
            className="w-full rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancelar importação
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Importar() {
  const navigate = useNavigate()

  const [arquivos, setArquivos]             = useState<File[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<number>(ANO_ATUAL)
  const [etapaSelecionada, setEtapaSelecionada] = useState<'' | '1' | '2' | '3'>('')

  const [preview, setPreview]     = useState<NotaImportada[]>([])
  const [conflito, setConflito]   = useState<ResultadoConflito | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [total, setTotal]         = useState(0)
  const [erros, setErros]         = useState<string[]>([])
  const [pulados, setPulados]     = useState(0)

  const [status, setStatus] = useState<
    'idle' | 'preview' | 'checando' | 'aguardando_decisao' | 'importando' | 'concluido'
  >('idle')

  // ── Arquivo ────────────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.xlsx'))
    setArquivos(files)
    setStatus('idle')
    setPreview([])
  }, [])

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.name.endsWith('.xlsx'))
    setArquivos(files)
    setStatus('idle')
    setPreview([])
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  async function handlePreview() {
    const todasNotas: NotaImportada[] = []
    const etapaForcada = etapaSelecionada ? (parseInt(etapaSelecionada) as 1 | 2 | 3) : undefined

    for (const file of arquivos) {
      const buffer = await file.arrayBuffer()
      const notas = parseArquivoBoletim(buffer, etapaForcada, anoSelecionado)
      todasNotas.push(...notas)
    }

    setPreview(todasNotas)
    setStatus('preview')
  }

  // ── Confirmar → checa conflitos ────────────────────────────────────────────

  async function handleConfirmar() {
    setStatus('checando')

    const resultado = await detectarConflitos(preview)

    if (resultado.existentes === 0) {
      // Sem conflitos → importa direto
      await executarImportacao('sobrescrever')
    } else {
      // Tem conflitos → mostra modal
      setConflito(resultado)
      setStatus('aguardando_decisao')
    }
  }

  // ── Decisão do modal ───────────────────────────────────────────────────────

  async function handleDecisao(modo: ModoConflito) {
    setConflito(null)
    await executarImportacao(modo)
  }

  // ── Executa a importação ───────────────────────────────────────────────────

  async function executarImportacao(modo: ModoConflito) {
    setStatus('importando')
    setProgresso(0)
    setTotal(preview.length)

    const errosImport = await importarNotas(
      preview,
      anoSelecionado,
      modo,
      (atual, tot) => {
        setProgresso(atual)
        setTotal(tot)
      }
    )

    // Calcula pulados: conflitos.existentes quando modo = pular
    const qtdPulados = modo === 'pular' ? (conflito?.existentes ?? 0) : 0
    setPulados(qtdPulados)
    setErros(errosImport)
    setStatus('concluido')
  }

  function handleReset() {
    setArquivos([])
    setPreview([])
    setConflito(null)
    setErros([])
    setPulados(0)
    setProgresso(0)
    setTotal(0)
    setStatus('idle')
  }

  // ── Dados do preview ───────────────────────────────────────────────────────

  const turmasNoPreview      = [...new Set(preview.map((n) => n.turma))]
  const disciplinasNoPreview = [...new Set(preview.map((n) => n.disciplina))]
  const etapasNoPreview      = [...new Set(preview.map((n) => n.etapa))].sort()
  const anosNoPreview        = [...new Set(preview.map((n) => n.ano).filter(Boolean))]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">

      {/* Modal de conflito */}
      {status === 'aguardando_decisao' && conflito && (
        <ModalConflito
          resultado={conflito}
          onDecisao={handleDecisao}
          onCancelar={handleReset}
        />
      )}

      <HeaderComVoltar titulo="Importar planilhas" onVoltar={() => navigate(-1)} />
      <p className="text-sm text-gray-400 -mt-4">
        Selecione um ou mais arquivos .xlsx para importar as notas
      </p>

      {/* Configurações */}
      {status === 'idle' && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Configurações da importação</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Ano letivo
              </label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-[#185FA5] focus:outline-none"
              >
                {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Etapa
              </label>
              <select
                value={etapaSelecionada}
                onChange={(e) => setEtapaSelecionada(e.target.value as '' | '1' | '2' | '3')}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-[#185FA5] focus:outline-none"
              >
                <option value="">Detectar automaticamente</option>
                <option value="1">1ª Etapa</option>
                <option value="2">2ª Etapa</option>
                <option value="3">3ª Etapa</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {status === 'idle' && (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#185FA5] hover:bg-blue-50 transition-colors group"
        >
          <input type="file" accept=".xlsx" multiple className="hidden" onChange={handleFileInput} />
          <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          {arquivos.length === 0 ? (
            <>
              <p className="text-sm text-gray-500">Arraste os arquivos .xlsx aqui</p>
              <p className="text-xs text-gray-400 mt-1">ou clique para selecionar · múltiplos arquivos permitidos</p>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              {arquivos.map((f) => <p key={f.name} className="text-sm text-[#185FA5] font-medium">{f.name}</p>)}
              <p className="text-xs text-gray-400 mt-1">{arquivos.length} arquivo(s) selecionado(s)</p>
            </div>
          )}
        </label>
      )}

      {arquivos.length > 0 && status === 'idle' && (
        <button
          className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
          onClick={handlePreview}
        >
          Pré-visualizar dados
        </button>
      )}

      {/* Preview */}
      {status === 'preview' && (
        <>
          {/* Resumo */}
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Resumo da detecção</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-gray-400 mb-0.5">Registros</p>
                <p className="font-semibold text-gray-900">{preview.length}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-gray-400 mb-0.5">Turmas</p>
                <p className="font-semibold text-gray-900">{turmasNoPreview.join(', ') || '—'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-gray-400 mb-0.5">Etapas</p>
                <p className="font-semibold text-gray-900">
                  {etapasNoPreview.length ? etapasNoPreview.map((e) => `${e}ª`).join(', ') : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-gray-400 mb-0.5">Ano(s)</p>
                <p className="font-semibold text-gray-900">
                  {anosNoPreview.length ? anosNoPreview.join(', ') : <span className="text-amber-600">{anoSelecionado}*</span>}
                </p>
              </div>
            </div>
            {disciplinasNoPreview.length > 0 && (
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <p className="text-gray-400 mb-1">Disciplinas</p>
                <p className="text-gray-700">{disciplinasNoPreview.join(' · ')}</p>
              </div>
            )}
            {anosNoPreview.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                * Ano não encontrado na planilha — será usado {anoSelecionado}
              </p>
            )}
          </div>

          {/* Tabela */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{preview.length} registros</p>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {['Aluno', 'Turma', 'Disciplina', 'Etapa', 'Nota', 'Freq.', 'Ano'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((n, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900 max-w-[140px] truncate">{n.nomeAluno}</td>
                      <td className="px-4 py-2 text-gray-600">{n.turma}</td>
                      <td className="px-4 py-2 text-gray-600 max-w-[140px] truncate">{n.disciplina}</td>
                      <td className="px-4 py-2 text-gray-600">{n.etapa}ª</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{n.nota}</td>
                      <td className="px-4 py-2 text-gray-600">{n.frequencia}%</td>
                      <td className="px-4 py-2 text-gray-500">
                        {n.ano ?? <span className="text-amber-500">{anoSelecionado}*</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            className="bg-[#185FA5] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#0C447C] transition-colors"
            onClick={handleConfirmar}
          >
            Verificar e confirmar importação
          </button>
        </>
      )}

      {/* Checando conflitos */}
      {status === 'checando' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-3 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#185FA5]" />
          Verificando conflitos com o banco de dados...
        </div>
      )}

      {/* Progresso */}
      {status === 'importando' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Importando registros...</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-[#185FA5] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (progresso / total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{progresso} de {total} registros</p>
        </div>
      )}

      {/* Concluído */}
      {status === 'concluido' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Importação concluída</p>
              <p className="text-xs text-gray-400">
                {preview.length - erros.length - pulados} inseridos
                {pulados > 0 && ` · ${pulados} mantidos (existentes)`}
                {erros.length > 0 && ` · ${erros.length} erro(s)`}
                {' '}de {preview.length} registros
              </p>
            </div>
          </div>

          {erros.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600 max-h-48 overflow-y-auto">
              <p className="font-medium mb-1">{erros.length} erro(s):</p>
              {erros.map((e, i) => <p key={i} className="mb-0.5">{e}</p>)}
            </div>
          )}

          <button onClick={handleReset} className="text-sm text-[#185FA5] hover:underline self-start">
            Importar mais arquivos
          </button>
        </div>
      )}
    </div>
  )
}