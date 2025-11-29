// src/index.js

const { inserirAluno } = require('./insert/inserir_aluno');
const { inserirAvaliacao } = require('./insert/inserir_avaliacao');
const { inserirPlanoDeEnsino } = require('./insert/inserir_plano_de_ensino');
const { inserirConteudosProgramaticos } = require('./insert/inserir_conteudos_programaticos');
const { inserirConteudosDoPlano } = require('./insert/inserir_conteudos_do_plano');
const { inserirPresencas } = require('./insert/inserir_presencas');
const { inserirRegistrosAulas } = require('./insert/inserir_registros_aulas');
const { getAlunosTurmaCompleto } = require('./get/get_alunos_turma_completo');
const { getAlunosTurma } = require('./get/get_alunos_turma');
const { getAulasProfessorDetalhadas } = require('./get/get_aulas_professor_detalhadas');
const { getAvaliacoes } = require('./get/get_avaliacoes');
const { getConteudosProg } = require('./get/get_conteudos_prog');
const { getDashboardProfessor } = require('./get/get_dashboard_professor');
const { getPlanosEnsino } = require('./get/get_planos_ensino');
const { getRegistrosAulas } = require('./get/get_registros_aulas');
const { getTurmas } = require('./get/get_turmas');

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log('EVENT:', JSON.stringify(event));

  try {
    const { httpMethod, path, queryStringParameters } = event;

    // ROTA GET ESPECÍFICA: /alunos-turma-completo?turmaId=...&media_aprovacao=...&nota_excelencia=...
    if (httpMethod === 'GET' && path && path.endsWith('/alunos-turma-completo')) {
      const qs = queryStringParameters || {};

      const params = {
        turmaId: qs.turmaId,
        media_aprovacao: qs.media_aprovacao,
        nota_excelencia: qs.nota_excelencia,
      };

      console.log('🔧 Router GET: Chamando getAlunosTurmaCompleto com params de query:', params);
      const resultado = await getAlunosTurmaCompleto(params);
      console.log('✅ Retorno GET get_alunos_turma_completo:', resultado);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultado),
      };
    }

    // --------------------
    // FLUXO ORIGINAL (POST)
    // --------------------
    const body = event.body ? JSON.parse(event.body) : {};
    const { acao, params } = body;

    // garantir que seja POST para o fluxo baseado em "acao"
    if (httpMethod && httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      };
    }

    // mapa de ações para funções handler
    const actionsMap = {
      // INSERTS
      inserir_aluno: inserirAluno,
      inserir_avaliacao: inserirAvaliacao,
      inserir_plano_de_ensino: inserirPlanoDeEnsino,
      inserir_conteudos_programaticos: inserirConteudosProgramaticos,
      inserir_conteudos_do_plano: inserirConteudosDoPlano,
      inserir_presencas: inserirPresencas,
      inserir_registros_aulas: inserirRegistrosAulas,

      // GETS via POST (mantidos para compatibilidade)
      get_alunos_turma_completo: getAlunosTurmaCompleto,
      get_alunos_turma: getAlunosTurma,
      get_aulas_professor_detalhadas: getAulasProfessorDetalhadas,
      get_avaliacoes: getAvaliacoes,
      get_conteudos_prog: getConteudosProg,
      get_dashboard_professor: getDashboardProfessor,
      get_planos_ensino: getPlanosEnsino,
      get_registros_aulas: getRegistrosAulas,
      get_turmas: getTurmas,
    };

    if (!acao || typeof acao !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campo "acao" é obrigatório e deve ser uma string.' }),
      };
    }

    const handlerFunc = actionsMap[acao];

    if (!handlerFunc) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Ação inválida ou não suportada: ${acao}` }),
      };
    }

    console.log(`🔧 Router POST: Chamando handler para ação "${acao}" com params:`, params);
    const resultado = await handlerFunc(params);
    console.log(`✅ Retorno da ação "${acao}":`, resultado);

    return {
      statusCode: 200,
      body: JSON.stringify(resultado),
    };

  } catch (error) {
    console.error('Erro na Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno na Lambda.', detalhe: error.message }),
    };
  }
};