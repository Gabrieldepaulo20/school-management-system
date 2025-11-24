const { supabase} = require('../bd/connectionBD');

async function getAulasProfessorDetalhadas(data){
    console.log("📥 getAulasProfessorDetalhadas recebeu", data);
    const { idProfessor} = data;

    if(!idProfessor)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idProfessor).");
    }
    
    const payload =
    {
        p_idprofessor: Number(idProfessor)
    }
    console.log("🔧 Chamando RPC get_aulas_professor_detalhadas com params:", payload);
    
    const {data: retorno, error} = await supabase.rpc("get_aulas_professor_detalhadas", payload);
    
    console.log("📤 Retorno do Supabase RPC get_aulas_professor_detalhadas:", {retorno, error});
    
    if (error) {
        console.error("❌ Erro do Supabase ao obter aulas do professor:", error);
        throw error;
    }
    
    return retorno;
}