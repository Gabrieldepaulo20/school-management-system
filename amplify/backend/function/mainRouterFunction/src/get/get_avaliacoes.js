const { supabase} = require('../bd/connectionBD');

async function getAvaliacoes(data){
    console.log("📥 getAvaliacoes recebeu", data.idAluno);
    const {
        idTurma,
        idProfessor
    } = data;
    if(!idTurma || !idProfessor)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idTurma, idProfessor).");
    }
    
    const payload =
    {
        p_idturma: Number(idTurma),
        p_idprofessor: Number(idProfessor)
    }
    console.log("🔧 Chamando RPC get_avaliacoes com params:", payload);

    const {data: retorno, error} = await supabase.rpc("get_avaliacoes", payload);
    
    console.log("📤 Retorno do Supabase RPC get_avaliacoes:", {retorno, error});
    
    if (error) {
        console.error("❌ Erro do Supabase ao obter avaliações:", error);
        throw error;
    }
    
    return retorno;
}