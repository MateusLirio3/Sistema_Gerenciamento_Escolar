import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface NotaDisciplina {
  disciplina_id: string;
  disciplina_nome: string;
  area_id: string;
  area_nome: string;
  frequencia: number | null; // da etapa mais recente com frequência lançada
  nota1: number | null;
  nota2: number | null;
  nota3: number | null;
  mediaFinal: number | null;
}

export interface BoletimData {
  aluno: { id: string; nome: string };
  turma: { nome: string; ano: number };
  dataEmissao: string;
  etapa: number;
  disciplinas: NotaDisciplina[];
  resumo: {
    freqGlobal: number;
    mediaEtapa1: number | null;
    mediaEtapa2: number | null;
    mediaEtapa3: number | null;
    qtdAbaixoMedia: number; 
    situacaoFinal: "APROVADO" | "REPROVADO" | "CURSANDO";
    crCurso: number | null; 
  };
}

const NOTA_MINIMA = 5.0;
const FREQ_MINIMA = 75;

function media(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

export function useBoletim(alunoId: string, etapa?: number) {
  const [data, setData] = useState<BoletimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const etapaAtual = etapa ?? 3;

  useEffect(() => {
    if (!alunoId) return;

    async function fetchBoletim() {
      setLoading(true);
      setError(null);

      try {
        // 1. Busca aluno + turma via turma_id direto em alunos
        const { data: alunoData, error: alunoError } = await supabase
          .from("alunos")
          .select(`id, nome, turmas (id, nome, ano)`)
          .eq("id", alunoId)
          .single();

        if (alunoError) throw alunoError;

        const turma = alunoData.turmas as any;
        const turmaId: string = turma?.id;

        if (!turmaId) throw new Error("Turma não encontrada para o aluno.");

        // 2. Busca todas as disciplinas vinculadas à turma (com área)
        const { data: turmaDisciplinasData, error: tdError } = await supabase
          .from("turma_disciplinas")
          .select(`
            disciplina_id,
            disciplinas (
              id,
              nome,
              areas ( id, nome )
            )
          `)
          .eq("turma_id", turmaId);

        if (tdError) throw tdError;

        // 3. Monta o mapa de disciplinas
        const map = new Map<string, NotaDisciplina>();

        for (const row of turmaDisciplinasData ?? []) {
          const disc = row.disciplinas as any;
          const area = disc?.areas as any;
          const discId: string = disc?.id;
          if (!discId) continue;

          map.set(discId, {
            disciplina_id: discId,
            disciplina_nome: disc?.nome ?? "",
            area_id: area?.id ?? "",
            area_nome: area?.nome ?? "",
            frequencia: null,
            nota1: null,
            nota2: null,
            nota3: null,
            mediaFinal: null,
          });
        }

        // 4. Busca todas as notas do aluno (todas as etapas de uma vez)
        const { data: notasData, error: notasError } = await supabase
          .from("notas")
          .select(`etapa, nota, frequencia, disciplina_id`)
          .eq("aluno_id", alunoId)
          .lte("etapa", etapaAtual) // só etapas até a atual
          .order("etapa", { ascending: true });

        if (notasError) throw notasError;

        // 5. Preenche notas e frequências
        // FIX: frequência usa a etapa mais recente disponível (não só a etapaAtual)
        const freqPorDisc = new Map<string, { etapa: number; valor: number }>();

        for (const row of notasData ?? []) {
          const discId: string = row.disciplina_id;
          if (!map.has(discId)) continue;

          const entry = map.get(discId)!;

          // Preenche as notas por etapa
          if (row.etapa === 1) entry.nota1 = row.nota;
          if (row.etapa === 2) entry.nota2 = row.nota;
          if (row.etapa === 3) entry.nota3 = row.nota;

          // FIX: guarda a frequência da etapa mais recente disponível
          if (row.frequencia !== null) {
            const atual = freqPorDisc.get(discId);
            if (!atual || row.etapa > atual.etapa) {
              freqPorDisc.set(discId, { etapa: row.etapa, valor: row.frequencia });
            }
          }
        }

        // Aplica frequências ao mapa
        for (const [discId, { valor }] of freqPorDisc.entries()) {
          const entry = map.get(discId);
          if (entry) entry.frequencia = valor;
        }

        // 6. Calcula a média final de cada disciplina até a etapaAtual
        const disciplinas: NotaDisciplina[] = [];
        for (const disc of map.values()) {
          let notasParaMedia: number[] = [];

          if (etapaAtual >= 1 && disc.nota1 !== null) notasParaMedia.push(disc.nota1);
          if (etapaAtual >= 2 && disc.nota2 !== null) notasParaMedia.push(disc.nota2);
          if (etapaAtual >= 3 && disc.nota3 !== null) notasParaMedia.push(disc.nota3);

          disc.mediaFinal = media(notasParaMedia);
          disciplinas.push(disc);
        }

        // 7. Estatísticas

        // FIX: freqGlobal — só considera disciplinas com frequência lançada
        const freqs = disciplinas
          .map((d) => d.frequencia)
          .filter((f): f is number => f !== null);
        const freqGlobal = freqs.length > 0 ? (media(freqs) ?? 0) : 0;
        const temFrequencia = freqs.length > 0;

        // Médias por etapa (média de todas as notas daquela etapa)
        const notas1 = disciplinas.map((d) => d.nota1).filter((n): n is number => n !== null);
        const notas2 = disciplinas.map((d) => d.nota2).filter((n): n is number => n !== null);
        const notas3 = disciplinas.map((d) => d.nota3).filter((n): n is number => n !== null);

        const mediaEtapa1 = media(notas1);
        const mediaEtapa2 = media(notas2);
        const mediaEtapa3 = media(notas3);

        // FIX: qtdAbaixoMedia conta médias finais abaixo do mínimo (não notas de etapa isoladas)
        const qtdAbaixoMedia = disciplinas.filter(
          (d) => d.mediaFinal !== null && d.mediaFinal < NOTA_MINIMA
        ).length;

        // FIX: situacaoFinal não reprova por frequência se não há frequência lançada ainda
        let situacaoFinal: BoletimData["resumo"]["situacaoFinal"];

        if (etapaAtual === 3) {
          const freqOk = !temFrequencia || freqGlobal >= FREQ_MINIMA;
          situacaoFinal = qtdAbaixoMedia === 0 && freqOk ? "APROVADO" : "REPROVADO";
        } else {
          situacaoFinal = "CURSANDO";
        }

        // 8. C.R. (Coeficiente de Rendimento) = média das médias finais das disciplinas
        const mediasFinais = disciplinas
          .map((d) => d.mediaFinal)
          .filter((m): m is number => m !== null);

        const crCurso = media(mediasFinais);

        setData({
          aluno: { id: alunoData.id, nome: alunoData.nome },
          turma: { nome: turma?.nome ?? "", ano: turma?.ano ?? 0 },
          dataEmissao: new Date().toLocaleDateString("pt-BR"),
          etapa: etapaAtual,
          disciplinas,
          resumo: {
            freqGlobal: Math.round(freqGlobal),
            mediaEtapa1,
            mediaEtapa2,
            mediaEtapa3,
            qtdAbaixoMedia,
            situacaoFinal,
            crCurso,
          },
        });
      } catch (err: any) {
        console.error("Erro ao buscar boletim:", err);
        setError(err.message ?? "Erro ao buscar boletim");
      } finally {
        setLoading(false);
      }
    }

    fetchBoletim();
  }, [alunoId, etapaAtual]);

  return { data, loading, error };
}