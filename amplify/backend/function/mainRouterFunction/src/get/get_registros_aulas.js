const {supabase} = require('../bd/connectionBD');

async function getRegistrosAulas(data){
    console.log("📥 getRegistrosAulas recebeu", data);
    const { idTurma,
        idProfessor
    } = data;
    if(!idTurma || !idProfessor)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idTurma, idProfessor).");
    }
    
    const payload =
    {
        p_idturmas: Number(idTurma),
        p_idprofessor: Number(idProfessor)
    }
    console.log("🔧 Chamando RPC get_registros_aulas com params:", payload);
    const {data: retorno, error} = await supabase.rpc("get_registros_aulas", payload);

    console.log("📤 Retorno do Supabase RPC get_registros_aulas:", {retorno, error});

    if (error) {
        console.error("❌ Erro do Supabase ao obter registros de aulas:", error);
        throw error;
    }

    return retorno;
}

module.exports = {getRegistrosAulas};