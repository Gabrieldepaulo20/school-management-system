// src/index.js

const { inserirAluno } = require('./insert/inserir_aluno');
const { inserirAvaliacao } = require('./insert/inserir_avaliacao');

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

    // por enquanto vamos testar só essa ação
    if (acao === 'inserir_aluno') {
      console.log('🔧 Router: Chamando inserirAluno com params:', params);
      const resultado = await inserirAluno(params); // params = { usuarioId, turmaId, responsavelId, matricula }
      console.log('✅ Supabase retorno inserirAluno:', resultado);

      return {
        statusCode: 201,
        body: JSON.stringify(resultado),
      };
    }

    if (acao === 'inserir_avaliacao') {
      console.log('🔧 Router: Chamando inserirAvaliacao com params:', params);
      const resultado = await inserirAvaliacao(params);
      console.log('✅ Supabase retorno inserirAvaliacao:', resultado);

      return {
        statusCode: 201,
        body: JSON.stringify(resultado),
      };
    }

    // se não cair em nenhuma ação conhecida:
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Ação inválida ou não suportada: ${acao}` }),
    };

  } catch (error) {
    console.error('Erro na Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno na Lambda.', detalhe: error.message }),
    };
  }
};