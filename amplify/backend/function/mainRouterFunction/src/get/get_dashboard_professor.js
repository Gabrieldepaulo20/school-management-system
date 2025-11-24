const {supabase} = require('../bd/connectionBD');

async function getDashboardProfessor(data){
    console.log("📥 getDashboardProfessor recebeu", data);
    const { idProfessor} = data;
    
    if(!idProfessor)
    {
        throw new Error("Parâmetros obrigatórios ausentes (idProfessor).");
    }

    const payload = {
        p_idprofessor: Number(idProfessor)
    };
    console.log("🔧 Chamando RPC get_dashboard_professor com params:", payload);

    const {data: retorno, error} = await supabase.rpc("get_dashboard_professor", payload);

    console.log("📤 Retorno do Supabase RPC get_dashboard_professor:", {retorno, error});

    if (error) {
        console.error("❌ Erro do Supabase ao obter dashboard do professor:", error);
        throw error;
    }

    return retorno;
}

module.exports = {getDashboardProfessor};