const {supabase} = require('../bd/connectionBD');

async function getAlunosTurma(data){
    console.log("📥 getAlunosTurma recebeu", data.idTurma);
    const {idTurma} = data;

    if(!idTurma)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idTurma).");
    }
    
    const payload =
    {
        p_idturma: Number(idTurma)
    }
    console.log("🔧 Chamando RPC get_alunos_turma com params:", payload);
    
    const {data: retorno, error} = await supabase.rpc("get_alunos_turma", payload);
    
    console.log("📤 Retorno do Supabase RPC get_alunos_turma:", {retorno, error});
    
    if (error) {
        console.error("❌ Erro do Supabase ao obter alunos da turma:", error);
        throw error;
    }
    
    return retorno;
}