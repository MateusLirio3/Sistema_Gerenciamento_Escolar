import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import HeaderComVoltar from '../components/HeaderComVoltar'

interface Aluno {
  id: string
  nome: string
  frequencia: number
  nota: number
}

type OrderBy = 'nome' | 'nota' | 'frequencia'
type OrderDir = 'asc' | 'desc'

export default function Turma() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [nomeTurma, setNomeTurma] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [alunosRaw, setAlunosRaw] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('nome')
  const [orderDir, setOrderDir] = useState<OrderDir>('asc')

  const [disciplina, setDisciplina] = useState<string>('todas')
  const [disciplinas, setDisciplinas] = useState<string[]>([])

  useEffect(() => {
    if (id) carregarDados()
  }, [id])

  async function carregarDados() {
    try {
      setLoading(true)
      setError('')

      const { data: turmaData } = await supabase
        .from('turmas')
        .select('nome')
        .eq('id', id)
        .single()

      setNomeTurma(turmaData?.nome || '')

      const { data: alunosData } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          notas (
            nota,
            frequencia,
            etapa,
            disciplinas (nome)
          )
        `)
        .eq('turma_id', id)

      const todasDisciplinas = new Set<string>()

      alunosData?.forEach(aluno => {
        aluno.notas?.forEach((n: any) => {
          if (n.disciplinas?.nome) {
            todasDisciplinas.add(n.disciplinas.nome)
          }
        })
      })

      setDisciplinas(Array.from(todasDisciplinas).sort((a, b) => a.localeCompare(b, 'pt-BR')))
      setAlunosRaw(alunosData || [])

    } catch (err) {
      console.error(err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const processados: Aluno[] = alunosRaw.map(aluno => {
      let notas = aluno.notas || []

      if (disciplina !== 'todas') {
        notas = notas.filter((n: any) =>
          n.disciplinas?.nome?.toLowerCase().trim() === disciplina.toLowerCase().trim()
        )
      }

      const mediaFreq = notas.length
        ? notas.reduce((a: number, n: any) => a + (n.frequencia || 0), 0) / notas.length
        : 0

      const mediaNota = notas.length
        ? notas.reduce((a: number, n: any) => a + (n.nota || 0), 0) / notas.length
        : 0

      return {
        id: aluno.id,
        nome: aluno.nome,
        frequencia: Math.round(mediaFreq),
        nota: parseFloat(mediaNota.toFixed(1))
      }
    })

    setAlunos(processados)
  }, [disciplina, alunosRaw])

  const mediaNota = alunos.length
    ? (alunos.reduce((a, b) => a + b.nota, 0) / alunos.length).toFixed(1)
    : '0'

  const mediaFrequencia = alunos.length
    ? Math.round(alunos.reduce((a, b) => a + b.frequencia, 0) / alunos.length)
    : 0

  const alunosOrdenados = [...alunos].sort((a, b) => {
    const dir = orderDir === 'asc' ? 1 : -1
    if (orderBy === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR') * dir
    if (orderBy === 'nota') return (a.nota - b.nota) * dir
    return (a.frequencia - b.frequencia) * dir
  })

  const handleSort = (campo: OrderBy) => {
    if (orderBy === campo) {
      setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')
    } else {
      setOrderBy(campo)
      setOrderDir('asc')
    }
  }

  const renderSortIcon = (campo: OrderBy) => {
    if (orderBy !== campo) return ' ↕'
    return orderDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="flex flex-col gap-6">
      <HeaderComVoltar 
        titulo={nomeTurma || 'Carregando...'}
        onVoltar={() => navigate(-1)}
      />

      {/* filtro */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {disciplina === 'todas' ? 'Todas disciplinas' : disciplina}
        </p>
        <select
          value={disciplina}
          onChange={(e) => setDisciplina(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-[#185FA5]"
        >
          <option value="todas">Todas disciplinas</option>
          {disciplinas.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
          Carregando...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-center">
          {error}
        </div>
      ) : (
        <>
          {/* métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-400">Média de nota</p>
              <p className="text-3xl font-bold">{mediaNota}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-400">Média de presença</p>
              <p className="text-3xl font-bold">{mediaFrequencia}%</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-400">Alunos</p>
              <p className="text-3xl font-bold">{alunos.length}</p>
            </div>
          </div>

          {/* tabela */}
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('nome')}>
                      Nome {renderSortIcon('nome')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => handleSort('frequencia')}>
                      Frequência {renderSortIcon('frequencia')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => handleSort('nota')}>
                      Média {renderSortIcon('nota')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alunosOrdenados.map((a, i) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/aluno/${a.id}`)}
                    className={`border-t cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{a.nome}</td>
                    <td className={`px-4 py-3 text-center font-medium ${
                      a.frequencia >= 75
                        ? 'text-green-600'
                        : a.frequencia >= 60
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {a.frequencia}%
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${
                      a.nota >= 7
                        ? 'text-green-600'
                        : a.nota >= 5
                        ? 'text-amber-600'
                        : a.nota > 0
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                      {a.nota > 0 ? a.nota.toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}