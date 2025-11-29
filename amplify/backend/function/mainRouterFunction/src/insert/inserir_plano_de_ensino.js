const { supabase } = require('../bd/connectionBD');

async function inserirPlanoDeEnsino(planoDeEnsino) {
  console.log('📥 inserirPlanoDeEnsino recebeu:', planoDeEnsino);

  const {
    urlAnexo,
    titulo,
    objetivos,
    metodologia,
    avaliacao,
    recursosNecessarios,
    fkTurmas,
    conteudosIds,
  } = planoDeEnsino;

  if (!titulo || !objetivos || !metodologia || !avaliacao || !recursosNecessarios || !fkTurmas) {
    throw new Error('Parâmetros obrigatórios ausentes para inserir plano de ensino.');
  }

  if (conteudosIds !== undefined && conteudosIds !== null) {
    if (!Array.isArray(conteudosIds)) {
      throw new Error('conteudosIds deve ser um array de IDs de conteúdos (bigint[]).');
    }
    console.log('🧩 inserirPlanoDeEnsino conteudosIds recebido:', conteudosIds);
  } else {
    console.log('🧩 inserirPlanoDeEnsino sem conteudosIds (nenhum conteúdo vinculado ao plano).');
  }

  const payload = {
    p_urlanexo: urlAnexo ?? null,
    p_titulo: titulo,
    p_objetivos: objetivos,
    p_metodologia: metodologia,
    p_avaliacao: avaliacao,
    p_recursosnecessarios: recursosNecessarios,
    p_fk_turmas: fkTurmas,
    p_conteudos_ids: Array.isArray(conteudosIds) && conteudosIds.length > 0 ? conteudosIds : null
  };

  console.log('🔧 Chamando RPC inserir_plano_de_ensino com params (objeto):', payload);
  console.log('🧾 JSON enviado para Supabase RPC inserir_plano_de_ensino:', JSON.stringify(payload));

  const { data, error } = await supabase.rpc('inserir_plano_de_ensino', payload);

  console.log('📤 Retorno do Supabase RPC inserir_plano_de_ensino:', { data, error });

  if (error) {
    console.error('Erro ao inserir plano de ensino no banco:', error);
    throw error;
  }

  return data;
}

module.exports = { inserirPlanoDeEnsino };