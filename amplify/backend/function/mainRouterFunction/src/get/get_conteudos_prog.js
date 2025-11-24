const {supabase} = require('../bd/connectionBD');

async function getConteudosProg() {
    console.log("📥 getConteudosProg chamado");
    const {data: retorno, error} = await supabase.rpc("get_conteudos_prog");
    
    console.log("📤 Retorno do Supabase RPC get_conteudos_prog:", {retorno, error});
    if (error) {
        console.error("❌ Erro do Supabase ao obter conteúdos programáticos:", error);
        throw error;
    }

    return retorno;
}

module.exports = {getConteudosProg};