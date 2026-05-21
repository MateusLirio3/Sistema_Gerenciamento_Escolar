// src/pages/Boletimpage.tsx
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useBoletim } from "../hooks/useBoletim";
import BoletimTemplate from "../components/Boletimtemplate";

export default function BoletimPage() {
  // ── Roteamento ──────────────────────────────────────────────────────────────
  const { alunoID } = useParams<{ alunoID: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const onClose = () => navigate(-1);

  const etapaNum = Math.min(3, Math.max(1, Number(searchParams.get("etapa") ?? "3")));

  // ── Dados ───────────────────────────────────────────────────────────────────
  const { data, loading, error } = useBoletim(alunoID ?? "", etapaNum);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const boletimRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);

  async function handleExportPDF() {
    if (!boletimRef.current || !data) return;
    setExportando(true);

    const patchStyle = document.createElement("style");

    try {
      const element = boletimRef.current;

      // Força cores computadas para que html2canvas capture corretamente
      patchStyle.innerHTML = `
        .text-red-700   { color: rgb(185,28,28)   !important; }
        .text-gray-500  { color: rgb(107,114,128)  !important; }
        .text-gray-600  { color: rgb(75,85,99)     !important; }
        .bg-gray-50     { background-color: rgb(249,250,251) !important; }
        .bg-gray-100    { background-color: rgb(243,244,246) !important; }
        .bg-gray-200    { background-color: rgb(229,231,235) !important; }
        .bg-white       { background-color: rgb(255,255,255) !important; }
        .border-black   { border-color: rgb(0,0,0) !important; }
        .text-black     { color: rgb(0,0,0) !important; }
      `;
      document.head.appendChild(patchStyle);

      // Pequena pausa para o DOM aplicar os estilos
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const canvasRatio = canvas.width / canvas.height;
      let imgW = pdfW;
      let imgH = pdfW / canvasRatio;
      if (imgH > pdfH) {
        imgH = pdfH;
        imgW = pdfH * canvasRatio;
      }

      const offsetX = (pdfW - imgW) / 2;
      const offsetY = (pdfH - imgH) / 2;

      pdf.addImage(imgData, "JPEG", offsetX, offsetY, imgW, imgH);

      const filename = `Boletim_${data.aluno.nome.replace(/\s+/g, "_")}_${etapaNum}a_Etapa_${data.turma.ano}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExportando(false);
      if (document.head.contains(patchStyle)) {
        document.head.removeChild(patchStyle);
      }
    }
  }

  // ── Estados de carregamento ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Carregando boletim...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-600 text-sm">Erro ao carregar boletim: {error}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-200 py-4 px-4">

      {/* Toolbar */}
      <div className="flex gap-3 self-start mb-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
        >
          ← Voltar
        </button>

        {/* Indicador de etapa */}
        <span className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-600">
          {etapaNum}ª Etapa
        </span>

        <button
          onClick={handleExportPDF}
          disabled={exportando}
          className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exportando ? "Gerando PDF..." : "⬇ Baixar PDF"}
        </button>
      </div>

      {/* Preview do boletim */}
      <div className="shadow-2xl bg-white overflow-visible max-w-full">
        <BoletimTemplate ref={boletimRef} data={data} />
      </div>
    </div>
  );
}