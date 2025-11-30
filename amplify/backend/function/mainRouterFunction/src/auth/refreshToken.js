// src/auth/refreshToken.js
// Handler para renovar tokens do Cognito usando o RefreshToken

const {
  InitiateAuthCommand,
  CognitoIdentityProviderClient,
} = require("@aws-sdk/client-cognito-identity-provider");

const REGION = process.env.AWS_REGION || "us-east-1";
const CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});


exports.handler = async (event) => {
  console.log("🔵 [refreshToken] CONFIG:", {
    REGION,
    CLIENT_ID_PRESENT: !!CLIENT_ID,
  });
  console.log("🔵 [refreshToken] EVENT RECEIVED:", JSON.stringify(event, null, 2));

  if (!CLIENT_ID) {
    console.error(
      "❌ [refreshToken] COGNITO_APP_CLIENT_ID não está definido nas variáveis de ambiente."
    );
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Erro de configuração: COGNITO_APP_CLIENT_ID não está definido na Lambda/ambiente.",
      }),
    };
  }

  // 1) Parse do body
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    console.error("❌ [refreshToken] Erro ao fazer parse do body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Body inválido. Envie um JSON válido.",
      }),
    };
  }

  const { refreshToken } = body;
  console.log("🔵 [refreshToken] BODY PARSED:", {
    refreshTokenPresent: !!refreshToken,
  });

  if (!refreshToken) {
    console.error("❌ [refreshToken] Refresh token ausente.");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Refresh token é obrigatório.",
      }),
    };
  }

  try {
    console.log("🔵 [refreshToken] Iniciando REFRESH_TOKEN_AUTH no Cognito...");

    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const authResponse = await cognitoClient.send(command);

    const { AccessToken, IdToken } = authResponse.AuthenticationResult || {};
    console.log("✅ [refreshToken] Auth Cognito OK:", {
      temResultado: !!authResponse.AuthenticationResult,
      temAccessToken: !!AccessToken,
      temIdToken: !!IdToken,
    });

    if (!AccessToken) {
      console.error("❌ [refreshToken] AccessToken não retornado no refresh.");
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro interno ao renovar token.",
        }),
      };
    }

    // Em geral o Cognito não retorna um novo refreshToken aqui,
    // então devolvemos o mesmo que foi enviado.
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Token renovado com sucesso",
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken, // continua usando o mesmo refreshToken
          expiresIn: 3600, // AccessToken dura 1h
        },
      }),
    };
  } catch (err) {
    console.error("❌ [refreshToken] ERRO GERAL:", err);

    const name = err.name || err.__type;
    let msg = "Erro ao renovar token";

    if (name === "NotAuthorizedException") {
      msg = "Refresh token inválido ou expirado.";
    }

    return {
      statusCode: name === "NotAuthorizedException" ? 401 : 500,
      body: JSON.stringify({
        message: msg,
        error: err.message,
        type: name,
      }),
    };
  }
};