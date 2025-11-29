const { supabase } = require('../bd/connectionBD');
const { uploadAnexoGenerico } = require('../s3/uploadGenerico'); // ajuste o path conforme sua estrutura

async function inserirPlanoDeEnsino(planoDeEnsino) {
  console.log('📥 inserirPlanoDeEnsino recebeu:', planoDeEnsino);

  const {
    urlAnexo, // base64 ou null
    titulo,
    objetivos,
    metodologia,
    avaliacao,
    recursosNecessarios,
    fkTurmas,
    conteudosIds,
    turmaNome,
    professorNome
  } = planoDeEnsino;

  // 🔍 Validações
  if (!titulo || !objetivos || !metodologia || !avaliacao || !recursosNecessarios || !fkTurmas) {
    throw new Error('Parâmetros obrigatórios ausentes para inserir plano de ensino.');
  }

  // 🔍 Validação do array de conteúdos (opcional)
  if (conteudosIds !== undefined && conteudosIds !== null) {
    if (!Array.isArray(conteudosIds)) {
      throw new Error('conteudosIds deve ser um array de IDs de conteúdos (bigint[]).');
    }
  }

  let urlFinal = null;

  // -------------------------------------------------------------------------
  // 📌 1) UPLOAD OPCIONAL PARA O S3 — apenas se vier base64
  // -------------------------------------------------------------------------
  if (urlAnexo && typeof urlAnexo === "string") {
    console.log("📄 Recebido anexo BASE64. Iniciando upload para S3...");

    if (!turmaNome || !professorNome) {
      console.error("❌ turmaNome e professorNome são obrigatórios quando há anexo.");
      return {
        status: "erro",
        etapa: "upload_s3",
        mensagem: "turmaNome e professorNome são obrigatórios quando há anexo."
      };
    }

    try {
      const ext = urlAnexo.startsWith("data:application/pdf")
        ? ".pdf"
        : urlAnexo.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        ? ".docx"
        : ".bin";

      const nomeArquivo = `plano-de-ensino${ext}`;

      const base64Limpo = urlAnexo.includes(",")
        ? urlAnexo.split(",")[1]
        : urlAnexo;

      const upload = await uploadAnexoGenerico({
        prefixo: "planos-ensino/",
        turmaId: fkTurmas,
        turmaNome,
        professorNome,
        dataReferencia: new Date().toISOString().slice(0, 10),
        nomeArquivo,
        tipo: "application/octet-stream",
        conteudoBase64: base64Limpo
      });

      urlFinal = upload.url;
      console.log("📎 Upload concluído. URL gerada:", urlFinal);

    } catch (e) {
      console.error("❌ Erro no upload do anexo:", e);
      return {
        status: "erro",
        etapa: "upload_s3",
        mensagem: e.message
      };
    }
  } else {
    console.log("📁 Nenhum anexo enviado. Continuando sem upload...");
  }

  // -------------------------------------------------------------------------
  // 📌 2) Chamada RPC — apenas após sucesso ou ausência de upload
  // -------------------------------------------------------------------------
  const payload = {
    p_urlanexo: urlFinal,
    p_titulo: titulo,
    p_objetivos: objetivos,
    p_metodologia: metodologia,
    p_avaliacao: avaliacao,
    p_recursosnecessarios: recursosNecessarios,
    p_fk_turmas: fkTurmas,
    p_conteudos_ids: Array.isArray(conteudosIds) && conteudosIds.length > 0 ? conteudosIds : null
  };

  console.log("🔧 Chamando RPC inserir_plano_de_ensino com params:", payload);

  const { data, error } = await supabase.rpc("inserir_plano_de_ensino", payload);

  if (error) {
    console.error("❌ Erro Supabase:", error);
    return {
      status: "erro",
      etapa: "supabase",
      mensagem: error.message
    };
  }

  console.log("📤 Plano inserido com sucesso:", data);

  return {
    status: "sucesso",
    mensagem: "Plano de ensino inserido com sucesso.",
    resultado: data
  };
}

module.exports = { inserirPlanoDeEnsino };