const { supabase } = require('../bd/connectionBD');
const { uploadAnexoGenerico } = require('./anexosS3');

// ==============================
// RPC: buscar aluno por UUID
// ==============================
async function buscarAlunoPorUUID(uuidAluno) {
  console.log("🔍 [buscarAlunoPorUUID] Recebido:", uuidAluno);

  if (typeof uuidAluno !== "string" || !uuidAluno.trim()) {
    throw new Error("UUID do aluno inválido.");
  }

  const { data, error } = await supabase.rpc("buscar_aluno_por_uuid", {
    p_uuid: uuidAluno.trim()
  });

  console.log("📥 [buscarAlunoPorUUID] Retorno Supabase:", { data, error });

  if (error) {
    throw new Error("Erro Supabase ao buscar aluno: " + error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Aluno não encontrado via buscar_aluno_por_uuid.");
  }

  const aluno = data[0];

  if (!aluno.idAlunos || !aluno.fk_turmas) {
    throw new Error("Aluno encontrado, mas dados incompletos (idAlunos/fk_turmas).");
  }

  return aluno; // { idAlunos, fk_turmas }
}

// ==============================
// Normaliza data dd/MM/yyyy → yyyy-MM-dd
// ==============================
function normalizarData(dataStr) {
  console.log("🗓 [normalizarData] Entrou:", dataStr);

  if (typeof dataStr !== "string") return null;

  const t = dataStr.trim();

  // Já estiver em formato ISO
  if (t.includes("-") && !t.includes("/")) return t;

  // Formato dd/MM/yyyy
  if (t.includes("/")) {
    const [dia, mes, ano] = t.split("/").map((p) => p.trim());
    if (!dia || !mes || !ano) return null;

    const iso = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : iso;
  }

  return null;
}

// ==============================
// Normaliza horário para HH:MM
// ==============================
function normalizarHorario(horarioStr) {
  console.log("⏰ [normalizarHorario] Entrou:", horarioStr);

  if (horarioStr === undefined || horarioStr === null || horarioStr === "") {
    return null;
  }

  if (typeof horarioStr !== "string") {
    horarioStr = String(horarioStr);
  }

  const parts = horarioStr.trim().split(":");

  let h = Number(parts[0]);
  let m = Number(parts[1] || "0");

  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  if (!Number.isInteger(m) || m < 0 || m > 59) return null;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// ==============================
// Normaliza nota
// ==============================
function normalizarNota(nota) {
  console.log("📝 [normalizarNota] Entrou:", nota);

  if (nota === undefined || nota === null || nota === "") return null;

  const n = Number(typeof nota === "string" ? nota.replace(",", ".") : nota);
  return Number.isFinite(n) ? n : null;
}

// ==============================
// Normaliza fase enum mapeando para o ENUM do banco
// ==============================
function normalizarFase(fase) {
  console.log("🏷 [normalizarFase] Entrou:", fase);

  if (typeof fase !== "string") return null;

  // normaliza para comparação (case-insensitive)
  const f = fase.trim().toLowerCase();

  // Valores atuais do ENUM "diarioDeClasseDB"."faseAvaliacao"
  const mapa = {
    semestral: "Semestral",
    inicial: "Inicial",
    final: "Final",
    bimestral: "Bimestral",
    trimestral: "Trimestral",
  };

  const resultado = mapa[f] || null;

  if (!resultado) {
    console.warn("⚠️ [normalizarFase] Fase inválida para ENUM faseAvaliacao:", fase);
  }

  return resultado;
}

// ==============================
// Inferir/validar tipo de arquivo (PDF/DOCX)
// ==============================
function inferirTipoArquivo(nomeArquivo, tipoArquivo) {
  console.log("📂 [inferirTipoArquivo] Entrou:", { nomeArquivo, tipoArquivo });

  const MIME_PDF = "application/pdf";
  const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  // 1) Se vier explicitamente o tipo, respeita
  if (typeof tipoArquivo === "string") {
    const t = tipoArquivo.trim().toLowerCase();
    if (t === "pdf" || t === MIME_PDF) return MIME_PDF;
    if (t === "docx" || t === MIME_DOCX) return MIME_DOCX;
  }

  // 2) Se vier nome com extensão, tenta inferir
  if (typeof nomeArquivo === "string") {
    const lower = nomeArquivo.trim().toLowerCase();
    if (lower.endsWith(".pdf")) return MIME_PDF;
    if (lower.endsWith(".docx")) return MIME_DOCX;
  }

  // 3) Fallback: assumir sempre PDF
  console.warn("⚠️ [inferirTipoArquivo] Tipo de arquivo não informado ou não reconhecido. Assumindo PDF por padrão.", {
    nomeArquivo,
    tipoArquivo,
  });
  return MIME_PDF;
}

// ==============================
// FUNÇÃO PRINCIPAL
// ==============================
async function inserirAvaliacao(body) {
  console.log("📥 [inserirAvaliacao] Body recebido:", body);

  try {
    const {
      nome,
      data,
      horario,
      observacoes,
      nomeTurma,
      nota,
      alunoId,          // UUID do aluno (obrigatório)
      nomeAluno,        // opcional, apenas para logs
      disciplinaId,     // ID numérico da disciplina vindo do front
      fase,
      urlAnexo,         // base64 do anexo vindo do front
      nomeProfessor,
      nomeArquivo,
      tipoArquivo,
    } = body;

    console.log("👦 [inserirAvaliacao] Dados do aluno recebidos no body:", {
      alunoId,
      nomeAluno,
    });

    // ==========================
    // Validações iniciais
    // ==========================
    if (
      !nome ||
      !data ||
      alunoId === undefined ||
      alunoId === null ||
      disciplinaId === undefined ||
      disciplinaId === null ||
      !fase ||
      nota === undefined ||
      nota === null
    ) {
      throw new Error(
        "Campos obrigatórios ausentes. Obrigatórios: nome, data, nota, alunoId, disciplinaId, fase. " +
        "observacoes, horario, nomeTurma, nomeProfessor, nomeArquivo, tipoArquivo, urlAnexo são opcionais (mas urlAnexo é recomendada)."
      );
    }

    const disciplinaIdFinal = Number(disciplinaId);
    if (!Number.isInteger(disciplinaIdFinal) || disciplinaIdFinal <= 0) {
      throw new Error("ID da disciplina inválido.");
    }
    console.log("📚 [inserirAvaliacao] ID da disciplina recebido:", disciplinaIdFinal);

    // Normalizações
    const dataNormalizada = normalizarData(data);
    if (!dataNormalizada) throw new Error("Data inválida.");

    let horarioNormalizado = null;
    if (horario != null && horario !== "") {
      horarioNormalizado = normalizarHorario(horario);
      if (!horarioNormalizado) throw new Error("Horário inválido.");
    }

    const notaNormalizada = normalizarNota(nota);
    if (notaNormalizada === null) throw new Error("Nota inválida.");

    const faseNormalizada = normalizarFase(fase);
    if (!faseNormalizada) throw new Error("Fase inválida.");

    // ==========================
    // BUSCAR ALUNO (UUID → id + turma)
    // ==========================
    console.log("🔎 [inserirAvaliacao] Buscando aluno por UUID:", alunoId);
    const aluno = await buscarAlunoPorUUID(alunoId);
    console.log("🎓 [inserirAvaliacao] Aluno encontrado:", aluno);

    const fkTurmasFinal = aluno.fk_turmas;

    // ==========================
    // UPLOAD S3 (se tiver anexo)
    // ==========================
    let urlAnexoFinal = null;

    if (urlAnexo) {
      console.log("📤 [inserirAvaliacao] Enviando anexo para S3...");

      const turmaNomeFinal = nomeTurma || `turma-${fkTurmasFinal}`;
      const professorNomeFinal = nomeProfessor || "professor-desconhecido";

      const tipoArquivoFinal = inferirTipoArquivo(nomeArquivo, tipoArquivo);

      let nomeArquivoFinal = nomeArquivo;
      if (!nomeArquivoFinal) {
        const base = nome || `avaliacao-${aluno.idAlunos || "sem-id"}`;
        nomeArquivoFinal = tipoArquivoFinal === "application/pdf"
          ? `${base}.pdf`
          : `${base}.docx`;
      }

      console.log("📎 [inserirAvaliacao] Detalhes do arquivo:", {
        nomeArquivoFinal,
        tipoArquivoFinal,
      });

      const uploadResult = await uploadAnexoGenerico({
        prefixo: "avaliacoes/",
        turmaId: fkTurmasFinal,
        turmaNome: turmaNomeFinal,
        professorNome: professorNomeFinal,
        dataReferencia: dataNormalizada,
        nomeArquivo: nomeArquivoFinal,
        tipo: tipoArquivoFinal,
        conteudoBase64: urlAnexo,
      });

      console.log("📦 [inserirAvaliacao] Retorno S3:", uploadResult);

      urlAnexoFinal = uploadResult?.url || null;
    } else {
      console.log("ℹ️ [inserirAvaliacao] Nenhum anexo enviado (urlAnexo vazio ou null).");
    }

    // ==========================
    // MONTAR PAYLOAD para inserir_avaliacao
    // ==========================
    const payload = {
      p_nome: nome,
      p_data: dataNormalizada,
      p_horario: horarioNormalizado,
      p_observacoes: observacoes ?? null,
      p_fk_turmas: fkTurmasFinal,
      p_nota: notaNormalizada,
      p_fk_alunos: aluno.idAlunos,
      p_fk_disciplinas: disciplinaIdFinal,
      p_fase: faseNormalizada,
      p_urlanexo: urlAnexoFinal,
    };

    console.log("📡 [inserirAvaliacao] Enviando payload para RPC inserir_avaliacao:", payload);

    const { data: supabaseData, error } = await supabase.rpc("inserir_avaliacao", payload);

    console.log("📥 [inserirAvaliacao] Retorno Supabase inserir_avaliacao:", {
      data: supabaseData,
      error,
    });

    if (error) {
      throw new Error(error.message || "Erro ao inserir avaliação (Supabase).");
    }

    return {
      ok: true,
      data: supabaseData,
    };
  } catch (error) {
    console.error("❌ [inserirAvaliacao] ERRO:", error);
    if (error && error.stack) {
      console.error("🧱 [inserirAvaliacao] Stack do erro:", error.stack);
    }
    return {
      ok: false,
      message: error.message || "Erro ao inserir avaliação.",
    };
  }
}

module.exports = { inserirAvaliacao };