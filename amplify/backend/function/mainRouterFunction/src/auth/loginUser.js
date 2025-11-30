// src/auth/loginUser.js
// Handler de login ajustado, profissional e com logs detalhados

const {
  InitiateAuthCommand,
  GetUserCommand,
  CognitoIdentityProviderClient,
} = require("@aws-sdk/client-cognito-identity-provider");

const REGION = process.env.AWS_REGION || "us-east-1";
const CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});

const { supabase } = require("../bd/connectionBD");

/**
 * Handler principal de login.
 * Recebe o `event` completo do API Gateway.
 */
exports.handler = async (event) => {
  console.log("🔵 [loginUser] CONFIG:", { REGION, CLIENT_ID_PRESENT: !!CLIENT_ID });
  console.log("🔵 [loginUser] EVENT RECEIVED:", JSON.stringify(event, null, 2));

  // Se o ClientId não estiver configurado, não tenta nem chamar o Cognito
  if (!CLIENT_ID) {
    console.error("❌ [loginUser] COGNITO_APP_CLIENT_ID não está definido nas variáveis de ambiente.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Erro de configuração: COGNITO_APP_CLIENT_ID não está definido na Lambda/ambiente.",
      }),
    };
  }

  // ========================
  // 1) Parse do body
  // ========================
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    console.error("❌ [loginUser] Erro ao fazer parse do body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Body inválido. Envie um JSON válido.",
      }),
    };
  }

  const { email, password } = body;
  console.log("🔵 [loginUser] BODY PARSED:", {
    email,
    passwordExists: !!password,
  });

  if (!email || !password) {
    console.error("❌ [loginUser] Email ou senha ausentes.");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Email e senha são obrigatórios.",
      }),
    };
  }

  try {
    // ========================
    // 2) Autenticar no Cognito
    // ========================
    console.log("🔵 [loginUser] Iniciando autenticação no Cognito...");

    const authCommand = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const authResponse = await cognitoClient.send(authCommand);

    console.log("✅ [loginUser] Auth Cognito OK:", {
      temResultado: !!authResponse.AuthenticationResult,
    });

    const { AccessToken, IdToken, RefreshToken } =
      authResponse.AuthenticationResult || {};

    if (!AccessToken) {
      console.error("❌ [loginUser] AccessToken não retornado.");
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro interno ao autenticar usuário.",
        }),
      };
    }

    // ========================
    // 3) Buscar SUB do usuário
    // ========================
    console.log("🔵 [loginUser] Obtendo SUB do usuário via GetUser...");

    const userInfo = await cognitoClient.send(
      new GetUserCommand({ AccessToken })
    );

    const subAttr = userInfo.UserAttributes.find((a) => a.Name === "sub");
    const cognitoSub = subAttr?.Value;

    console.log("🔵 [loginUser] Cognito SUB:", cognitoSub);

    if (!cognitoSub) {
      console.error("❌ [loginUser] SUB não encontrado nos atributos.");
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao recuperar ID do usuário.",
        }),
      };
    }

    // ========================
    // 4) Buscar usuário no Supabase
    // ========================
    console.log("🔵 [loginUser] Buscando usuário no Supabase...");

    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("idUsuarios", cognitoSub)
      .maybeSingle();

    if (userError) {
      console.error(
        "❌ [loginUser] Erro Supabase ao buscar usuário:",
        userError
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao buscar usuário no banco.",
          error: userError.message,
        }),
      };
    }

    if (!usuario) {
      console.error(
        "❌ [loginUser] Usuário não encontrado no banco para SUB:",
        cognitoSub
      );
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Usuário não encontrado no banco.",
        }),
      };
    }

    console.log("✅ [loginUser] Usuário encontrado:", usuario);

    // ========================
    // 5) Sucesso
    // ========================
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login realizado com sucesso",
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
        usuario,
      }),
    };
  } catch (err) {
    console.error("❌ [loginUser] ERRO GERAL:", err);

    const name = err.name || err.__type;
    let msg = "Erro ao realizar login";

    if (name === "NotAuthorizedException") msg = "Email ou senha incorretos.";
    if (name === "UserNotFoundException") msg = "Usuário não encontrado.";
    if (name === "UserNotConfirmedException")
      msg = "Usuário ainda não confirmou o cadastro.";

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