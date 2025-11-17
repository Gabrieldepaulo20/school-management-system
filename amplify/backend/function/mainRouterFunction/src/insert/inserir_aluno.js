const { supabase } = require('../bd/connectionBD');

async function inserirAluno(aluno) {
  console.log('📥 inserirAluno recebeu:', aluno);
  const { usuarioId, turmaId, responsavelId, matricula } = aluno;

  //validacao
  if (!usuarioId || !turmaId || !responsavelId || !matricula) {
    throw new Error('Parâmetros obrigatórios ausentes para inserir aluno.');
  }

  const payload = {
    p_fk_usuario: usuarioId,
    p_fk_turmas: String(turmaId),
    p_fk_responsavel: responsavelId,
    p_matricula: matricula,
  };

  console.log('🔧 Chamando RPC inserir_aluno com params (objeto):', payload);
  console.log('🧾 JSON enviado para Supabase RPC inserir_aluno:', JSON.stringify(payload));

  const { data, error } = await supabase.rpc('inserir_aluno', payload); // chama a função RPC no Supabase (função criada no schema public)

  console.log('📤 Retorno do Supabase RPC inserir_aluno:', { data, error }); // retorno do Supabase RPC inserir_aluno

  if (error) {
    console.error('Erro ao inserir aluno no banco:', error);
    throw error;
  }

  return data;
}

module.exports = { inserirAluno };