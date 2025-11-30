// src/auth/signupUser.js
const {
  SignUpCommand,
  AdminConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { cognitoClient, userPoolId, clientId } = require("./cognitoClient");
const { supabase } = require("../bd/connectionBD");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

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

    if (!email || !password || !nome || !categoria) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "email, password, nome e categoria são obrigatórios",
        }),
      };
    }

    // 1) Cadastrar no Cognito
    const signUpCommand = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: nome },
      ],
    });

    const signUpResult = await cognitoClient.send(signUpCommand);
    const cognitoSub = signUpResult.UserSub; // UUID do Cognito

    // Se quiser pular confirmação de email (usar com cuidado em produção)
    await cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: email,
      })
    );

    // 2) Criar registro em USUARIOS
    const { data: usuario, error: erroUsuario } = await supabase
      .from("usuarios")
      .insert({
        idUsuarios: cognitoSub,      // usar o sub como PK
        nome,
        dataNasc,
        cpf,
        categoria,                   // precisa bater com enum diarioDeClasseDB.categoriasUsuarios
      })
      .select()
      .single();

    if (erroUsuario) {
      console.error("Erro ao criar usuario no banco:", erroUsuario);

      // Opcional: rollback no Cognito
      // (poderia chamar AdminDeleteUser aqui se quiser garantir consistência)

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao criar usuário no banco",
          error: erroUsuario.message,
        }),
      };
    }

    // 3) Se for PROFESSOR → cria registro em PROFESSORES
    if (categoria === "PROFESSOR") {
      const { error: erroProfessor } = await supabase
        .from("professores")
        .insert({
          fk_usuarios: usuario.idUsuarios,
          // idProfessores pode ser default uuid do próprio banco
        });

      if (erroProfessor) {
        console.error("Erro ao criar professor:", erroProfessor);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Usuário criado, mas falhou ao criar professor",
            error: erroProfessor.message,
          }),
        };
      }
    }

    // 4) Se for ALUNO → cria registro em ALUNOS
    if (categoria === "ALUNO") {
      const { error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          fk_usuarios: usuario.idUsuarios,
          fk_turmas,
          fk_responsavel,
          matricula,
        });

      if (erroAluno) {
        console.error("Erro ao criar aluno:", erroAluno);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Usuário criado, mas falhou ao criar aluno",
            error: erroAluno.message,
          }),
        };
      }
    }

    // 5) Retorno final
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
    console.error("Erro geral no signup:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao cadastrar usuário",
        error: err.message,
      }),
    };
  }
};