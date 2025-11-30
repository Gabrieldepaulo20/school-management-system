const {
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { cognitoClient, userPoolId, clientId } = require("./cognitoClient");
const { supabase } = require("../bd/connectionBD");

exports.handler = async (event) => {
  console.log("🔵 [signupUser] EVENT RECEIVED:", JSON.stringify(event, null, 2));
  let cognitoUsernameToRollback = null;
  try {
    const body = JSON.parse(event.body || "{}");
    console.log("🔵 [signupUser] BODY PARSED:", body);

    const {
      email,
      password,
      nome,
      dataNasc,
      cpf,
      categoria,
      fk_turmas,
      fk_responsavel,
      matricula,
    } = body;

    console.log("🔵 [signupUser] ALL FIELDS:", {
      email,
      passwordExists: !!password,
      nome,
      dataNasc,
      cpf,
      categoria,
      fk_turmas,
      fk_responsavel,
      matricula,
    });

    if (!email || !password || !nome || !categoria) {
      console.log("❌ [signupUser] Missing mandatory fields.");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "email, password, nome e categoria são obrigatórios",
        }),
      };
    }

    // Normalize category
    const categoriaLower = categoria.toLowerCase();
    console.log("🔵 [signupUser] Categoria Normalizada:", categoriaLower);

    // 1) Cadastrar no Cognito
    console.log("🔵 [signupUser] Enviando signup ao Cognito...");
    const signUpCommand = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: nome },
      ],
    });

    let signUpResult;
    try {
      signUpResult = await cognitoClient.send(signUpCommand);
    } catch (err) {
      console.error("❌ [signupUser] ERRO AO FAZER SIGNUP NO COGNITO:", err);
      throw err;
    }

    console.log("✅ [signupUser] Cognito SignUp OK:", signUpResult);

    const cognitoSub = signUpResult.UserSub;
    console.log("🔵 [signupUser] CognitoSub:", cognitoSub);
    // armazenar username para possivel rollback
    cognitoUsernameToRollback = email;

    // Confirmar email automaticamente
    console.log("🔵 [signupUser] Confirmando usuário no Cognito...");
    try {
      await cognitoClient.send(
        new AdminConfirmSignUpCommand({
          UserPoolId: userPoolId,
          Username: email,
        })
      );
    } catch (err) {
      console.error("❌ [signupUser] ERRO AO CONFIRMAR USER COGNITO:", err);
      throw err;
    }

    // 2) Criar registro em USUARIOS
    console.log("🔵 [signupUser] Inserindo em usuarios...");
    const { data: usuario, error: erroUsuario } = await supabase
      .from("usuarios")
      .insert({
        idUsuarios: cognitoSub,
        nome,
        dataNasc,
        cpf,
        categoria, 
      })
      .select()
      .single();

    if (erroUsuario) {
      console.error("❌ [signupUser] ERRO AO INSERIR EM usuarios:", erroUsuario);
      if (cognitoUsernameToRollback) {
        console.log("🔁 [signupUser] Rollback: deletando usuário Cognito por erro em usuarios...");
        try {
          await cognitoClient.send(
            new AdminDeleteUserCommand({
              UserPoolId: userPoolId,
              Username: cognitoUsernameToRollback,
            })
          );
          console.log("✅ [signupUser] Rollback Cognito concluído (usuarios).");
        } catch (rbErr) {
          console.error("❌ [signupUser] ERRO NO ROLLBACK COGNITO (usuarios):", rbErr);
        }
      }
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao criar usuário no banco",
          error: erroUsuario.message,
        }),
      };
    }

    console.log("✅ [signupUser] Usuário inserido:", usuario);

    // 3) Se for Professor → cria registro
    if (categoriaLower === "professor") {
      console.log("🔵 [signupUser] Criando PROFESSOR...");
      const { error: erroProfessor } = await supabase
        .from("professores")
        .insert({
          fk_usuarios: usuario.idUsuarios,
          idProfessores: usuario.idUsuarios, // mesmo id de usuarios
        });

      if (erroProfessor) {
        console.error("❌ [signupUser] ERRO AO INSERIR EM professores:", erroProfessor);
        if (cognitoUsernameToRollback) {
          console.log("🔁 [signupUser] Rollback: deletando usuário Cognito por erro em professores...");
          try {
            await cognitoClient.send(
              new AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: cognitoUsernameToRollback,
              })
            );
            console.log("✅ [signupUser] Rollback Cognito concluído (professores).");
          } catch (rbErr) {
            console.error("❌ [signupUser] ERRO NO ROLLBACK COGNITO (professores):", rbErr);
          }
        }
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Usuário criado, mas falhou ao criar professor",
            error: erroProfessor.message,
          }),
        };
      }
      console.log("✅ [signupUser] Professor criado com sucesso!");
    }

    // 4) Se for aluno → cria registro
    if (categoriaLower === "aluno") {
      console.log("🔵 [signupUser] Criando ALUNO...");
      const { error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          fk_usuarios: usuario.idUsuarios,
          fk_turmas,
          fk_responsavel,
          matricula,
        });

      if (erroAluno) {
        console.error("❌ [signupUser] ERRO AO INSERIR EM alunos:", erroAluno);
        if (cognitoUsernameToRollback) {
          console.log("🔁 [signupUser] Rollback: deletando usuário Cognito por erro em alunos...");
          try {
            await cognitoClient.send(
              new AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: cognitoUsernameToRollback,
              })
            );
            console.log("✅ [signupUser] Rollback Cognito concluído (alunos).");
          } catch (rbErr) {
            console.error("❌ [signupUser] ERRO NO ROLLBACK COGNITO (alunos):", rbErr);
          }
        }
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Usuário criado, mas falhou ao criar aluno",
            error: erroAluno.message,
          }),
        };
      }
      console.log("✅ [signupUser] Aluno criado com sucesso!");
    }

    // Final
    console.log("🎉 [signupUser] Finalizado com sucesso!");
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Usuário criado com sucesso",
        cognitoSub,
        idUsuarios: usuario.idUsuarios,
        categoria,
      }),
    };
  } catch (err) {
    console.error("❌ [signupUser] ERRO GERAL:", err);
    if (err.name === "UsernameExistsException") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Usuário já existe",
          error: err.message,
        }),
      };
    }
    if (cognitoUsernameToRollback) {
      console.log("🔁 [signupUser] Rollback geral: deletando usuário Cognito por erro inesperado...");
      try {
        await cognitoClient.send(
          new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: cognitoUsernameToRollback,
          })
        );
        console.log("✅ [signupUser] Rollback Cognito concluído (erro geral).");
      } catch (rbErr) {
        console.error("❌ [signupUser] ERRO NO ROLLBACK COGNITO (erro geral):", rbErr);
      }
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao cadastrar usuário",
        error: err.message,
      }),
    };
  }
};