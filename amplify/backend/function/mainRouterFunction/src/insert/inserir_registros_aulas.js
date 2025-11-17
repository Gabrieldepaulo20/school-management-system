

const { supabase } = require('../bd/connectionBD');

async function inserirRegistrosAulas(registro) {
  console.log("📥 inserirRegistrosAulas recebeu:", registro);

  const {
    data,
    fkAulas,
    conteudo,
    observacoes
  } = registro;

  // Conversão de data caso venha no formato dd/MM/yyyy
  let dataFormatada = data;
  if (typeof data === "string" && data.includes("/")) {
    const partes = data.split("/");
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      dataFormatada = `${ano}-${mes}-${dia}`;
    }
  }

  // validação
  if (!data || !fkAulas || !conteudo) {
    throw new Error("Parâmetros obrigatórios ausentes (data, fkAulas, conteudo).");
  }

  const payload = {
    p_data: dataFormatada,
    p_fk_aulas: Number(fkAulas),
    p_conteudo: conteudo,
    p_observacoes: observacoes ?? null
  };

  console.log("🔧 Chamando RPC inserir_registro_aulas com params:", payload);
  console.log("🧾 JSON enviado ao Supabase:", JSON.stringify(payload));

  const { data: retorno, error } = await supabase.rpc("inserir_registro_aulas", payload);

  console.log("📤 Retorno do Supabase RPC inserir_registro_aulas:", { retorno, error });

  if (error) {
    console.error("❌ Erro do Supabase ao inserir registro de aula:", error);
    throw error;
  }

  return retorno;
}

module.exports = { inserirRegistrosAulas };