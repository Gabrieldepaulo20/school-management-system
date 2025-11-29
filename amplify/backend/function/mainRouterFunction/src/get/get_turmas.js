const {supabase} = require('../bd/connectionBD');
async function getTurmas(data){ 
    console.log("📥 getTurmas recebeu", data);
        const { idProfessor} = data; 
    if(!idProfessor)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idProfessor).");
    }
    
    const payload =
    {
        p_idprofessor: idProfessor
    }
    console.log("🔧 Chamando RPC get_turmas com params:", payload);
    const {data: retorno, error} = await supabase.rpc("get_turmas", payload);

    console.log("📤 Retorno do Supabase RPC get_turmas:", {retorno, error});

    if (error) {
        console.error("❌ Erro do Supabase ao obter turmas:", error);
        throw error;
    }

    return retorno;
}

module.exports = {getTurmas};