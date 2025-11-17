const { supabase } = require("../bd/connectionBD");

async function inserirConteudosProgramaticos(body) {
  console.log("📥 [inserirConteudosProgramaticos] Body recebido:", body);

  try {
    const { conteudo } = body;

    if (!conteudo || typeof conteudo !== "string") {
      throw new Error("O campo 'conteudo' é obrigatório e deve ser texto.");
    }

    console.log("📝 [inserirConteudosProgramaticos] Conteúdo recebido:", conteudo);

    const payload = {
      p_conteudo: conteudo,
    };

    console.log(
      "🔧 Chamando RPC inserir_conteudos_programaticos com payload:",
      payload
    );

    const { data, error } = await supabase.rpc(
      "inserir_conteudos_programaticos",
      payload
    );

    console.log(
      "📤 Retorno RPC inserir_conteudos_programaticos:",
      JSON.stringify({ data, error }, null, 2)
    );

    if (error) {
      console.error(
        "❌ Erro Supabase RPC inserir_conteudos_programaticos:",
        error
      );
      throw new Error(error.message || "Erro desconhecido ao inserir conteúdo");
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    console.error("❌ [inserirConteudosProgramaticos] Erro final:", error);

    return {
      ok: false,
      message: error.message || "Erro interno ao inserir conteúdo programático",
    };
  }
}

module.exports = {
  inserirConteudosProgramaticos,
};