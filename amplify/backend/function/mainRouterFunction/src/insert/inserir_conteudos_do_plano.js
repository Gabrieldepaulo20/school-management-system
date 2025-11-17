const { supabase } = require('../bd/connectionBD');

async function inserirConteudosDoPlano(conteudoDoPlano) {
  console.log('📥 inserirConteudosDoPlano recebeu:', conteudoDoPlano);

  const {
    fkPlanosDeEnsino,
    fkConteudosProg,
    checkIn,
  } = conteudoDoPlano;

  // Validação dos parâmetros obrigatórios
  if (!fkPlanosDeEnsino || !fkConteudosProg) {
    throw new Error('Parâmetros obrigatórios ausentes para inserir conteúdos do plano (fkPlanosDeEnsino, fkConteudosProg).');
  }

  // Monta o payload exatamente com os nomes dos parâmetros da função no Supabase
  const payload = {
    p_fk_planosdeensino: Number(fkPlanosDeEnsino),
    p_fk_conteudosprog: Number(fkConteudosProg),
    p_checkin: checkIn === undefined ? false : Boolean(checkIn),
  };

  console.log('🔧 Chamando RPC inserir_conteudos_do_plano com params (objeto):', payload);
  console.log('🧾 JSON enviado para Supabase RPC inserir_conteudos_do_plano:', JSON.stringify(payload));

  const { data, error } = await supabase.rpc('inserir_conteudos_do_plano', payload);

  console.log('📤 Retorno do Supabase RPC inserir_conteudos_do_plano:', { data, error });

  if (error) {
    console.error('Erro ao inserir conteúdos do plano no banco:', error);
    throw error;
  }

  // data deve ser o json_build_object retornado pela função PL/pgSQL
  return data;
}

module.exports = { inserirConteudosDoPlano };
