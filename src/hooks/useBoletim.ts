// src/hooks/useBoletim.ts

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { formatDataEtapa, type Etapa } from "./useEtapas";

export interface NotaDisciplina {
  disciplina_id: string;
  disciplina_nome: string;

  area_id: string;
  area_nome: string;

  frequencia: number | null;

  nota1: number | null;
  nota2: number | null;
  nota3: number | null;

  mediaFinal: number | null;
}

export interface BoletimData {
  aluno: {
    id: string;
    nome: string;
  };

  turma: {
    nome: string;
    ano: number;
  };

  dataEmissao: string;

  etapa: number;

  datasEtapas: {
    etapa1Fim: string;
    etapa2Fim: string;
    etapa3Fim: string;
  };

  disciplinas: NotaDisciplina[];

  resumo: {
    freqGlobal: number;

    mediaEtapa1: number | null;
    mediaEtapa2: number | null;
    mediaEtapa3: number | null;

    qtdAbaixoMedia: number;

    situacaoFinal:
      | "APROVADO"
      | "REPROVADO"
      | "CURSANDO";

    crCurso: number | null;
  };
}

const NOTA_MINIMA = 5.0;
const FREQ_MINIMA = 75;

function media(arr: number[]): number | null {
  if (arr.length === 0) return null;

  return (
    Math.round(
      (arr.reduce((a, b) => a + b, 0) / arr.length) * 10
    ) / 10
  );
}

export function useBoletim(
  alunoId: string,
  etapa?: number
) {
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
        // ─────────────────────────────────────────────
        // 1. Aluno + turma
        // ─────────────────────────────────────────────

        const {
          data: alunoData,
          error: alunoError,
        } = await supabase
          .from("alunos")
          .select(`
            id,
            nome,
            turmas (
              id,
              nome,
              ano
            )
          `)
          .eq("id", alunoId)
          .single();

        if (alunoError) {
          throw alunoError;
        }

        const turma = alunoData.turmas as any;

        const turmaId: string | undefined = turma?.id;

        if (!turmaId) {
          throw new Error(
            "Turma não encontrada para o aluno."
          );
        }

        // ─────────────────────────────────────────────
        // 2. Disciplinas da turma
        // ─────────────────────────────────────────────

        const {
          data: turmaDisciplinasData,
          error: tdError,
        } = await supabase
          .from("turma_disciplinas")
          .select(`
            disciplina_id,

            disciplinas (
              id,
              nome,

              areas (
                id,
                nome
              )
            )
          `)
          .eq("turma_id", turmaId);

        if (tdError) {
          throw tdError;
        }

        // DEBUG opcional
        console.log(
          "turmaDisciplinasData:",
          turmaDisciplinasData
        );

        // ─────────────────────────────────────────────
        // 3. Etapas da turma
        // ─────────────────────────────────────────────

        const { data: etapasData } = await supabase
          .from("etapas")
          .select(`
            id,
            turma_id,
            numero,
            data_inicio,
            data_fim
          `)
          .eq("turma_id", turmaId)
          .order("numero");

        const etapasList = (etapasData ??
          []) as Etapa[];

        const findEtapa = (n: 1 | 2 | 3) =>
          etapasList.find(
            (e) => e.numero === n
          ) ?? null;

        const datasEtapas = {
          etapa1Fim: formatDataEtapa(
            findEtapa(1)?.data_fim ?? null
          ),

          etapa2Fim: formatDataEtapa(
            findEtapa(2)?.data_fim ?? null
          ),

          etapa3Fim: formatDataEtapa(
            findEtapa(3)?.data_fim ?? null
          ),
        };

        // ─────────────────────────────────────────────
        // 4. Mapa de disciplinas
        // ─────────────────────────────────────────────

        const map = new Map<
          string,
          NotaDisciplina
        >();

        for (const row of turmaDisciplinasData ?? []) {
          const disc = row.disciplinas as any;

          if (!disc) continue;

          const discId: string = disc.id;

          if (!discId) continue;

          // IMPORTANTE:
          // areas pode vir objeto OU array
          const areaRaw = disc.areas;

          const area = Array.isArray(areaRaw)
            ? areaRaw[0]
            : areaRaw;

          map.set(discId, {
            disciplina_id: discId,

            disciplina_nome:
              disc.nome ?? "Sem disciplina",

            area_id:
              area?.id ?? "sem-area",

            area_nome:
              area?.nome ?? "Sem área",

            frequencia: null,

            nota1: null,
            nota2: null,
            nota3: null,

            mediaFinal: null,
          });
        }

        // ─────────────────────────────────────────────
        // 5. Notas do aluno
        // ─────────────────────────────────────────────

        const {
          data: notasData,
          error: notasError,
        } = await supabase
          .from("notas")
          .select(`
            etapa,
            nota,
            frequencia,
            disciplina_id
          `)
          .eq("aluno_id", alunoId)
          .lte("etapa", etapaAtual)
          .order("etapa", {
            ascending: true,
          });

        if (notasError) {
          throw notasError;
        }

        const freqPorDisc = new Map<
          string,
          {
            etapa: number;
            valor: number;
          }
        >();

        for (const row of notasData ?? []) {
          const discId: string =
            row.disciplina_id;

          if (!map.has(discId)) {
            continue;
          }

          const entry = map.get(discId)!;

          if (row.etapa === 1) {
            entry.nota1 = row.nota;
          }

          if (row.etapa === 2) {
            entry.nota2 = row.nota;
          }

          if (row.etapa === 3) {
            entry.nota3 = row.nota;
          }

          if (row.frequencia !== null) {
            const atual =
              freqPorDisc.get(discId);

            if (
              !atual ||
              row.etapa > atual.etapa
            ) {
              freqPorDisc.set(discId, {
                etapa: row.etapa,
                valor: row.frequencia,
              });
            }
          }
        }

        // ─────────────────────────────────────────────
        // 6. Frequência final
        // ─────────────────────────────────────────────

        for (const [
          discId,
          { valor },
        ] of freqPorDisc.entries()) {
          const entry = map.get(discId);

          if (entry) {
            entry.frequencia = valor;
          }
        }

        // ─────────────────────────────────────────────
        // 7. Médias finais
        // ─────────────────────────────────────────────

        const disciplinas: NotaDisciplina[] = [];

        for (const disc of map.values()) {
          const notasParaMedia: number[] = [];

          if (
            etapaAtual >= 1 &&
            disc.nota1 !== null
          ) {
            notasParaMedia.push(disc.nota1);
          }

          if (
            etapaAtual >= 2 &&
            disc.nota2 !== null
          ) {
            notasParaMedia.push(disc.nota2);
          }

          if (
            etapaAtual >= 3 &&
            disc.nota3 !== null
          ) {
            notasParaMedia.push(disc.nota3);
          }

          disc.mediaFinal =
            media(notasParaMedia);

          disciplinas.push(disc);
        }

        console.log(
          "disciplinas finais:",
          disciplinas
        );

        // ─────────────────────────────────────────────
        // 8. Estatísticas
        // ─────────────────────────────────────────────

        const freqs = disciplinas
          .map((d) => d.frequencia)
          .filter(
            (f): f is number =>
              f !== null
          );

        const freqGlobal =
          freqs.length > 0
            ? media(freqs) ?? 0
            : 0;

        const temFrequencia =
          freqs.length > 0;

        const notas1 = disciplinas
          .map((d) => d.nota1)
          .filter(
            (n): n is number =>
              n !== null
          );

        const notas2 = disciplinas
          .map((d) => d.nota2)
          .filter(
            (n): n is number =>
              n !== null
          );

        const notas3 = disciplinas
          .map((d) => d.nota3)
          .filter(
            (n): n is number =>
              n !== null
          );

        const qtdAbaixoMedia =
          disciplinas.filter(
            (d) =>
              d.mediaFinal !== null &&
              d.mediaFinal < NOTA_MINIMA
          ).length;

        let situacaoFinal:
          | "APROVADO"
          | "REPROVADO"
          | "CURSANDO";

        if (etapaAtual === 3) {
          const freqOk =
            !temFrequencia ||
            freqGlobal >= FREQ_MINIMA;

          situacaoFinal =
            qtdAbaixoMedia === 0 &&
            freqOk
              ? "APROVADO"
              : "REPROVADO";
        } else {
          situacaoFinal = "CURSANDO";
        }

        const mediasFinais =
          disciplinas
            .map((d) => d.mediaFinal)
            .filter(
              (m): m is number =>
                m !== null
            );

        const crCurso =
          media(mediasFinais);

        // ─────────────────────────────────────────────
        // 9. Resultado final
        // ─────────────────────────────────────────────

        setData({
          aluno: {
            id: alunoData.id,
            nome: alunoData.nome,
          },

          turma: {
            nome: turma?.nome ?? "",
            ano: turma?.ano ?? 0,
          },

          dataEmissao:
            new Date().toLocaleDateString(
              "pt-BR"
            ),

          etapa: etapaAtual,

          datasEtapas,

          disciplinas,

          resumo: {
            freqGlobal:
              Math.round(freqGlobal),

            mediaEtapa1:
              media(notas1),

            mediaEtapa2:
              media(notas2),

            mediaEtapa3:
              media(notas3),

            qtdAbaixoMedia,

            situacaoFinal,

            crCurso,
          },
        });
      } catch (err: any) {
        console.error(
          "Erro ao buscar boletim:",
          err
        );

        setError(
          err.message ??
            "Erro ao buscar boletim"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBoletim();
  }, [alunoId, etapaAtual]);

  return {
    data,
    loading,
    error,
  };
}