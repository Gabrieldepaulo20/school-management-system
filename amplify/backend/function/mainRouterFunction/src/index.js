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
const { handler: signupUserHandler } = require('./auth/signupUser');
const { handler: loginUserHandler } = require('./auth/loginUser');
const { handler: refreshTokenHandler } = require('./auth/refreshToken');

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log('📥 EVENT RAW:', JSON.stringify(event));

  const { httpMethod, path, queryStringParameters } = event;
  console.log('🔎 REQUEST INFO:', { httpMethod, path, queryStringParameters });

  // CORS preflight support
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify({ ok: true }),
    };
  }

  try {
    // ROTA POST ESPECÍFICA: /auth/signup
    if (httpMethod === 'POST' && path && path.endsWith('/auth/signup')) {
      console.log('🔐 Router POST: Chamando signupUserHandler para /auth/signup');
      const resultado = await signupUserHandler(event);
      return {
        statusCode: resultado.statusCode || 200,
        headers: { ...defaultHeaders, ...(resultado.headers || {}) },
        body: resultado.body || JSON.stringify({ ok: true }),
      };
    }

    // ROTA POST ESPECÍFICA: /auth/login
    if (httpMethod === 'POST' && path && path.endsWith('/auth/login')) {
      console.log('🔐 Router POST: Chamando loginUserHandler para /auth/login');
      try {
        const resultado = await loginUserHandler(event);
        console.log('✅ Retorno loginUserHandler:', resultado);
        return {
          statusCode: resultado.statusCode || 200,
          headers: { ...defaultHeaders, ...(resultado.headers || {}) },
          body: resultado.body || JSON.stringify({ ok: true }),
        };
      } catch (err) {
        console.error('❌ Erro ao executar loginUserHandler:', err);
        return {
          statusCode: 500,
          headers: defaultHeaders,
          body: JSON.stringify({
            error: 'Erro interno ao realizar login.',
            detalhe: err.message,
          }),
        };
      }
    }

    // ROTA POST ESPECÍFICA: /auth/refresh
    if (httpMethod === 'POST' && path && path.endsWith('/auth/refresh')) {
      console.log('🔐 Router POST: Chamando refreshTokenHandler para /auth/refresh');
      try {
        const resultado = await refreshTokenHandler(event);
        console.log('✅ Retorno refreshTokenHandler:', resultado);
        return {
          statusCode: resultado.statusCode || 200,
          headers: { ...defaultHeaders, ...(resultado.headers || {}) },
          body: resultado.body || JSON.stringify({ ok: true }),
        };
      } catch (err) {
        console.error('❌ Erro ao executar refreshTokenHandler:', err);
        return {
          statusCode: 500,
          headers: defaultHeaders,
          body: JSON.stringify({
            error: 'Erro interno ao renovar token.',
            detalhe: err.message,
          }),
        };
      }
    }

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
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // ROTA GET ESPECÍFICA: /alunos-turma?...
    if (httpMethod === 'GET' && path && path.endsWith('/alunos-turma')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getAlunosTurma com params de query:', qs);
      const resultado = await getAlunosTurma(qs);
      console.log('✅ Retorno GET get_alunos_turma:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // ROTA GET ESPECÍFICA: /turmas?...
    if (httpMethod === 'GET' && path && path.endsWith('/turmas')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getTurmas com params de query:', qs);
      const resultado = await getTurmas(qs);
      console.log('✅ Retorno GET get_turmas:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // rota GET para aulas_professor_detalhadas
    if (httpMethod === 'GET' && path && path.endsWith('/aulas-professor-detalhadas')) {
      const qs = queryStringParameters || {};
      
      console.log('🔧 Router GET: Chamando getAulasProfessorDetalhadas com params de query:', qs);
      const resultado = await getAulasProfessorDetalhadas(qs);
      console.log('✅ Retorno GET get_aulas_professor_detalhadas:', resultado);
      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // rota GET para avaliacoes
    if (httpMethod === 'GET' && path && path.endsWith('/avaliacoes')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getAvaliacoes com params de query:', qs);
      const resultado = await getAvaliacoes(qs);
      console.log('✅ Retorno GET get_avaliacoes:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // rota GET para conteudos_prog
    if (httpMethod === 'GET' && path && path.endsWith('/conteudos-prog')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getConteudosProg com params de query:', qs);
      const resultado = await getConteudosProg(qs);
      console.log('✅ Retorno GET get_conteudos_prog:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // rota GET para dashboard_professor
    if (httpMethod === 'GET' && path && path.endsWith('/dashboard-professor')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getDashboardProfessor com params de query:', qs);
      const resultado = await getDashboardProfessor(qs);
      console.log('✅ Retorno GET get_dashboard_professor:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // rota GET para planos_ensino
    if (httpMethod === 'GET' && path && path.endsWith('/planos-ensino')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getPlanosEnsino com params de query:', qs);
      const resultado = await getPlanosEnsino(qs);
      console.log('✅ Retorno GET get_planos_ensino:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // rota GET para registros_aulas
    if (httpMethod === 'GET' && path && path.endsWith('/registros-aulas')) {
      const qs = queryStringParameters || {};

      console.log('🔧 Router GET: Chamando getRegistrosAulas com params de query:', qs);
      const resultado = await getRegistrosAulas(qs);
      console.log('✅ Retorno GET get_registros_aulas:', resultado);

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(resultado),
      };
    }

    // --------------------
    // FLUXO ORIGINAL (POST)
    // --------------------
    // Body bruto vindo do API Gateway
    const rawBody = event.body ? JSON.parse(event.body) : {};

    // Suporta dois formatos:
    // 1) { acao: '...', params: { ... } }
    // 2) { acao: '...', ...camposDiretos }
    const acao = rawBody.acao;
    const params = rawBody.params && typeof rawBody.params === 'object'
      ? rawBody.params
      : rawBody;

    console.log('📦 Body recebido no POST:', rawBody);
    console.log('🎯 Ação resolvida:', acao);
    console.log('📨 Params resolvidos para handler:', params);

    // garantir que seja POST para o fluxo baseado em "acao"
    if (httpMethod && httpMethod !== 'POST') {
      console.warn('⚠️ Método não permitido no fluxo baseado em "acao":', { httpMethod, path });
      return {
        statusCode: 405,
        headers: defaultHeaders,
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
    };

    if (!acao || typeof acao !== 'string') {
      console.error('❌ Campo "acao" ausente ou inválido no body:', rawBody);
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ error: 'Campo "acao" é obrigatório e deve ser uma string.' }),
      };
    }

    const handlerFunc = actionsMap[acao];

    if (!handlerFunc) {
      console.error('❌ Ação inválida ou não suportada:', acao);
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ error: `Ação inválida ou não suportada: ${acao}` }),
      };
    }

    console.log(`🔧 Router POST: Chamando handler para ação "${acao}" com params:`, params);
    const resultado = await handlerFunc(params);
    console.log(`✅ Retorno da ação "${acao}":`, resultado);

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(resultado),
    };

  } catch (error) {
    console.error('💥 Erro na Lambda (global catch):', {
      message: error.message,
      stack: error.stack,
      httpMethod,
      path,
    });
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({
        error: 'Erro interno na Lambda.',
        detalhe: error.message,
      }),
    };
  }
};