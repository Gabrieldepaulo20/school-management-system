const { handler } = require('./index');

async function testarRefresh() {
  const event = {
    httpMethod: 'POST',
    path: '/auth/refresh',
    headers: { 'Content-Type': 'application/json' },
    queryStringParameters: null,
    body: JSON.stringify({
      refreshToken: 'SEU_REFRESH_TOKEN_AQUI',
    }),
  };

  const resp = await handler(event);
  console.log('===== RESPOSTA REFRESH =====');
  console.log('StatusCode:', resp.statusCode);
  console.log('Body:', resp.body);
  console.log('============================');
}

testarRefresh();