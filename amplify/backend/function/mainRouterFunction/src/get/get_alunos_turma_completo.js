const {supabase} = require('../bd/connectionBD');

async function getAlunosTurmaCompleto(data) {
  console.log("📥 getAlunosTurmaCompleto recebeu turmaId:", data.turmaId);
  const {
    turmaId,
    media_aprovacao,
    nota_excelencia

  } = data

  if (!turmaId || !media_aprovacao || !nota_excelencia)
    {
        throw new Error("Parâmetros obrigatórios ausentes (turmaId, media_aprovacao, nota_excelencia).");
    }
    
    const payload =
    {
        p_idturma: Number(turmaId),
        p_media_aprovacao: Number(media_aprovacao),
        p_nota_excelencia: Number(nota_excelencia)
    }
    console.log("🔧 Chamando RPC get_alunos_turma_completo com params:", payload);
    
    const {data: retorno, error} = await supabase.rpc("get_alunos_turma_completo", payload);
    
    console.log("📤 Retorno do Supabase RPC get_alunos_turma_completo:", {retorno, error});
    
    if (error) {
        console.error("❌ Erro do Supabase ao obter alunos da turma:", error);
        throw error;
    }
    
    return retorno;
}

module.exports = { getAlunosTurmaCompleto };