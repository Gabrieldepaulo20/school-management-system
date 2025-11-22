// src/index.js

const { inserirAluno } = require('./insert/inserir_aluno');
const { inserirAvaliacao } = require('./insert/inserir_avaliacao');
const { inserirPlanoDeEnsino } = require('./insert/inserir_plano_de_ensino');
const { inserirConteudosProgramaticos } = require('./insert/inserir_conteudos_programaticos');
const { inserirConteudosDoPlano } = require('./insert/inserir_conteudos_do_plano');
const { inserirPresencas } = require('./insert/inserir_presencas');
const { inserirRegistrosAulas } = require('./insert/inserir_registros_aulas');

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log('EVENT:', JSON.stringify(event));

  try {
    // corpo vindo do API Gateway (ou do seu index.test.js)
    const body = event.body ? JSON.parse(event.body) : {};

    const { acao, params } = body;

    // opcional: garantir que seja POST
    if (event.httpMethod && event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      };
    }

    // mapa de ações para funções handler
    const actionsMap = {
      inserir_aluno: inserirAluno,
      inserir_avaliacao: inserirAvaliacao,
      inserir_plano_de_ensino: inserirPlanoDeEnsino,
      inserir_conteudos_programaticos: inserirConteudosProgramaticos,
      inserir_conteudos_do_plano: inserirConteudosDoPlano,
      inserir_presencas: inserirPresencas,
      inserir_registros_aulas: inserirRegistrosAulas,
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

    console.log(`🔧 Router: Chamando handler para ação "${acao}" com params:`, params);
    const resultado = await handlerFunc(params);
    console.log(`✅ Retorno da ação "${acao}":`, resultado);

    return {
      statusCode: 201,
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