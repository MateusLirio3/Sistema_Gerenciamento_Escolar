import React, { forwardRef } from "react";
import type { BoletimData, NotaDisciplina } from "../hooks/useBoletim";

interface Props {
  data: BoletimData;
}

const ORDEM_AREAS = [
  "Formação Técnica",
  "Ciências da Natureza",
  "Matemática e Suas Tecnologias",
  "Linguagens e Suas Tecnologias",
  "Ciências Humanas e Sociais Aplicada",
  "Projetos",
];

const AREAS_CONCEITO = new Set(["Projetos"]);

function fmt(n: number | null): string {
  if (n === null) return "-";
  return n.toFixed(1).replace(".", ",");
}

function fmtFreq(n: number | null): string {
  if (n === null) return "-";
  return `${Math.round(n)}%`;
}

function isAbaixo(n: number | null): boolean {
  return n !== null && n < 5.0;
}

// ── Célula de nota com destaque vermelho se abaixo da média ──────────────────
function CelNota({ valor }: { valor: number | null }) {
  return (
    <td
      className={`border border-black px-0.5 text-center text-[7.5px] ${
        isAbaixo(valor) ? "text-red-700 font-bold" : ""
      }`}
    >
      {fmt(valor)}
    </td>
  );
}

// ── Tabela de uma área ───────────────────────────────────────────────────────
function TabelaArea({
  titulo,
  disciplinas,
}: {
  titulo: string;
  disciplinas: NotaDisciplina[];
}) {
  if (disciplinas.length === 0) return null;
  const conceito = AREAS_CONCEITO.has(titulo);

  function AreaLabel({ titulo, linhas }: { titulo: string; linhas: number }) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const altura = linhas * 28;
    const largura = 16;

    const palavras = titulo.split(" ");
    const linhasTexto: string[] = [];
    for (let i = 0; i < palavras.length; i += 3) {
      linhasTexto.push(palavras.slice(i, i + 3).join(" "));
    }

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, largura, altura);
      ctx.font = "bold 6px sans-serif";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.save();
      ctx.translate(largura / 2, altura / 2);
      ctx.rotate(-Math.PI / 2);

      const lineHeight = 7;
      const totalTextHeight = (linhasTexto.length - 1) * lineHeight;

      linhasTexto.forEach((linha, idx) => {
        const offsetY = -totalTextHeight / 2 + idx * lineHeight;
        ctx.fillText(linha, 0, offsetY);
      });

      ctx.restore();
    }, [titulo, altura, linhasTexto.join("|")]);

    return (
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: largura, height: altura }}
      />
    );
  }

  return (
    <table className="w-full border-collapse text-[7.5px] mb-1">
      <thead>
        <tr>
          <th
            className="border border-black bg-gray-200 px-0.5 text-center font-bold"
            rowSpan={2}
            style={{ width: 18 }}
          >
            Área
          </th>
          <th className="border border-black bg-gray-200 px-0.5 text-left font-bold" rowSpan={2}>
            Disciplina
          </th>
          <th
            className="border border-black bg-gray-200 px-0.5 text-center font-bold"
            rowSpan={2}
            style={{ width: 38 }}
          >
            Freq.
          </th>
          <th
            className="border border-black bg-gray-200 px-0.5 text-center font-bold"
            colSpan={conceito ? 3 : 5}
          >
            {conceito ? "Conceito" : "Média"}
          </th>
        </tr>
        <tr>
          {["1ª Etapa", "2ª Etapa", "3ª Etapa"].map((e) => (
            <th
              key={e}
              className="border border-black bg-gray-200 px-0.5 text-center font-bold"
              style={{ width: 34 }}
            >
              {e}
            </th>
          ))}
          {!conceito && (
            <>
              <th
                className="border border-black bg-gray-200 px-0.5 text-center font-bold"
                style={{ width: 34 }}
              >
                Final
              </th>
              <th
                className="border border-black bg-gray-200 px-0.5 text-center font-bold"
                style={{ width: 34 }}
              >
                Anual
              </th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {disciplinas.map((disc, i) => (
          <tr key={disc.disciplina_id}>
            {i === 0 && (
              <td
                className="border border-black bg-gray-50 align-middle"
                rowSpan={disciplinas.length}
                style={{
                  width: 16,
                  minWidth: 16,
                  maxWidth: 16,
                  padding: 0,
                }}
              >
                <AreaLabel titulo={titulo} linhas={disciplinas.length} />
              </td>
            )}

            <td className="border border-black px-0.5 text-[7.5px]">{disc.disciplina_nome}</td>
            <td className="border border-black px-0.5 text-center text-[7.5px]">
              {fmtFreq(disc.frequencia)}
            </td>
            {conceito ? (
              <>
                <td className="border border-black px-0.5 text-center text-[7.5px]">
                  {disc.nota1 !== null ? "PT" : "-"}
                </td>
                <td className="border border-black px-0.5 text-center text-[7.5px]">
                  {disc.nota2 !== null ? "PT" : "-"}
                </td>
                <td className="border border-black px-0.5 text-center text-[7.5px]">
                  {disc.nota3 !== null ? "PT" : "-"}
                </td>
              </>
            ) : (
              <>
                <CelNota valor={disc.nota1} />
                <CelNota valor={disc.nota2} />
                <CelNota valor={disc.nota3} />
                <td className="border border-black px-0.5 text-center text-[7.5px]">-</td>
                <CelNota valor={disc.mediaFinal} />
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
const BoletimTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { aluno, turma, dataEmissao, disciplinas, resumo, etapa } = data;

  // Agrupa disciplinas por área
  const porArea = new Map<string, NotaDisciplina[]>();
  for (const disc of disciplinas) {
    if (!porArea.has(disc.area_nome)) porArea.set(disc.area_nome, []);
    porArea.get(disc.area_nome)!.push(disc);
  }

  const areasOrdenadas = ORDEM_AREAS.filter((a) => porArea.has(a));
  const metade = Math.ceil(areasOrdenadas.length / 2);
  const esquerda = areasOrdenadas.slice(0, metade);
  const direita = areasOrdenadas.slice(metade);

  const isTerceiraEtapa = etapa === 3;

  return (
    <div
      ref={ref}
      className="bg-white text-black overflow-hidden"
      style={{
        width: "1123px",
        height: "794px",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* ── Cabeçalho ── */}
      <header className="flex items-center justify-between mb-1">
        <img src="/assets/logo_isepam.avif" alt="ISEPAM" className="w-14 h-auto" />
        <div className="text-center leading-tight" style={{ fontSize: 8 }}>
          <p>ISEPAM - Instituto Superior de Educação Professor Aldo Muylaert</p>
          <p>Educação Profissional Técnica de Nível Médio</p>
          <p>Curso Técnico em Informática</p>
          <p>Coordenação de Curso</p>
        </div>
        <img src="/assets/logo_informatica.jpg" alt="Informática" className="w-14 h-auto" />
      </header>

      <h1 className="text-center font-bold text-sm tracking-wide mb-1.5">
        BOLETIM DE NOTAS E FREQUÊNCIAS
      </h1>

      {/* ── Dados do aluno ── */}
      <div className="flex gap-3 border border-black px-2 py-1 mb-1 items-end">
        <div className="flex flex-col flex-[3]">
          <span style={{ fontSize: 7 }} className="text-gray-600">Aluno(a)</span>
          <span className="text-sm font-bold leading-tight">{aluno.nome}</span>
        </div>
        <div className="flex flex-col flex-1">
          <span style={{ fontSize: 7 }} className="text-gray-600">Turma</span>
          <span className="text-sm font-bold">{turma.nome}</span>
        </div>
        <div className="flex flex-col flex-1">
          <span style={{ fontSize: 7 }} className="text-gray-600">Ano</span>
          <span className="text-sm font-bold">{turma.ano}</span>
        </div>
        <div className="flex flex-col flex-1">
          <span style={{ fontSize: 7 }} className="text-gray-600">Data</span>
          <span className="text-sm font-bold">{dataEmissao}</span>
        </div>
      </div>

      {/* ── Barra de resumo — duas colunas ── */}
      <div className="grid grid-cols-2 gap-1 mb-1.5">
        {/* Coluna da esquerda */}
        <div className="border border-black px-2 py-1" style={{ fontSize: 8 }}>
          <div className="flex gap-4 items-start">
            {/* Datas das etapas */}
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-600">Fim da Etapa</span>
              <span>1ª - 23/05/{turma.ano}</span>
              <span>2ª - 12/09/{turma.ano}</span>
              <span>3ª - 05/12/{turma.ano}</span>
            </div>

            {/* Frequência global */}
            <div className="flex flex-col items-center">
              <span className="text-gray-600">% Freq Global</span>
              <span className="text-xl font-bold">{resumo.freqGlobal}%</span>
            </div>

            {/* Qtd abaixo da média — agora um único valor (médias finais) */}
            <div className="flex flex-col items-center">
              <span className="text-gray-600 mb-0.5">Abaixo da média</span>
              <span className="text-xl font-bold">{resumo.qtdAbaixoMedia}</span>
              <span style={{ fontSize: 6.5 }} className="text-gray-500">disciplinas</span>
            </div>
          </div>
        </div>

        {/* Coluna da direita */}
        <div className="border border-black px-2 py-1" style={{ fontSize: 8 }}>
          <div className="flex gap-4 items-start justify-between">
            {/* C.R - agora único (crCurso) */}
            <div className="flex flex-col">
              <span className="text-gray-600 mb-0.5">C.R. (Coeficiente de Rendimento)</span>
              <div className="flex gap-2">
                <div className="flex flex-col items-center rounded px-1.5 py-0.5 border">
                  <span style={{ fontSize: 6 }} className="text-gray-600">Curso</span>
                  <span className="text-sm font-bold">{fmt(resumo.crCurso)}</span>
                </div>
              </div>
            </div>

            {/* Média das etapas */}
            <div className="flex flex-col">
              <span className="text-gray-600 mb-0.5">Média das etapas</span>
              <div className="flex gap-2">
                {[
                  { label: "1ª", val: resumo.mediaEtapa1 },
                  { label: "2ª", val: resumo.mediaEtapa2 },
                  { label: "3ª", val: resumo.mediaEtapa3 },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span style={{ fontSize: 7 }}>{label}</span>
                    <span className="text-base font-bold">{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabelas de disciplinas — duas colunas ── */}
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        <div className="flex flex-col gap-1">
          {esquerda.map((area) => (
            <TabelaArea key={area} titulo={area} disciplinas={porArea.get(area) ?? []} />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {direita.map((area) => (
            <TabelaArea key={area} titulo={area} disciplinas={porArea.get(area) ?? []} />
          ))}
        </div>
      </div>

      {/* ── Aviso ── */}
      <p className="italic mb-1" style={{ fontSize: 7.5 }}>
        Prezado(a) aluno(a), as notas e frequências registradas nesse boletim, após a
        revisão/conferência do professor, estão sujeitas a atualização.
      </p>

      {/* ── Situação Final - Só aparece na 3ª etapa ── */}
      {isTerceiraEtapa && (
        <div className="inline-flex flex-col border border-black px-4 py-2 min-w-[160px]">
          <span style={{ fontSize: 7.5 }} className="text-gray-600">
            Situação final
          </span>
          <span
            className={`text-base font-bold ${
              resumo.situacaoFinal === "APROVADO" ? "text-black" : "text-red-700"
            }`}
          >
            {resumo.situacaoFinal}
          </span>
        </div>
      )}

      {/* Rodapé */}
      <footer className="mt-4 text-center" style={{ fontSize: 7 }}>
        <p>Boletim gerado pelo Sistema de Gestão Acadêmica</p>
      </footer>
    </div>
  );
});

BoletimTemplate.displayName = "BoletimTemplate";
export default BoletimTemplate;