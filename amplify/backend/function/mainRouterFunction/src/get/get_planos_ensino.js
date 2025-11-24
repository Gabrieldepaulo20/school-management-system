const { supabase} = require('../bd/connectionBD');

async function getPlanosEnsino(data){
    console.log("📥 getPlanosEnsino recebeu", data)
    const { idTurma} = data;
    
    if(!idTurma)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idTurma).");
    }
    
    const payload =
    {
        p_idturma: Number(idTurma)
    }
    console.log("🔧 Chamando RPC get_planos_ensino com params:", payload);
    const {data: retorno, error} = await supabase.rpc("get_planos_ensino", payload);

    console.log("📤 Retorno do Supabase RPC get_planos_ensino:", {retorno, error});

    if (error) {
        console.error("❌ Erro do Supabase ao obter planos de ensino:", error);
        throw error;
    }

    return retorno;
}

module.exports = {getPlanosEnsino};