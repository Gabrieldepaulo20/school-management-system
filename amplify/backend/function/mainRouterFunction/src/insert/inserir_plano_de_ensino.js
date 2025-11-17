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
  } = planoDeEnsino;

  if (!titulo || !objetivos || !metodologia || !avaliacao || !recursosNecessarios || !fkTurmas) {
    throw new Error('Parâmetros obrigatórios ausentes para inserir plano de ensino.');
  }

  const payload = {
    p_urlanexo: urlAnexo ?? null,
    p_titulo: titulo,
    p_objetivos: objetivos,
    p_metodologia: metodologia,
    p_avaliacao: avaliacao,
    p_recursosNecessarios: recursosNecessarios,
    p_fk_turmas: fkTurmas,
  };

  console.log('🔧 Chamando RPC inserir_planos_de_ensino com params (objeto):', payload);
  console.log('🧾 JSON enviado para Supabase RPC inserir_planos_de_ensino:', JSON.stringify(payload));

  const { data, error } = await supabase.rpc('inserir_planos_de_ensino', payload);

  console.log('📤 Retorno do Supabase RPC inserir_planos_de_ensino:', { data, error });

  if (error) {
    console.error('Erro ao inserir plano de ensino no banco:', error);
    throw error;
  }

  return data;
}

module.exports = { inserirPlanoDeEnsino };