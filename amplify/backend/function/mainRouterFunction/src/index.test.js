require("dotenv").config();
const { inserirPresencas } = require("./insert/inserir_presencas");
const { supabase } = require("./bd/connectionBD");

async function testar() {
  const payload = {
    data: "29/11/2025",
    presente: true,
    fkAlunos: "0222945a-81a6-4c1e-9647-d57b9f336c41",
    fkAulas: 3
  };

  try {
    console.log("=== Chamando inserir_presencas diretamente ===");
    console.log(payload);

    const res = await inserirPresencas(payload);

    console.log("\n=== RESPOSTA DA FUNÇÃO ===");
    console.log(res);
  } catch (err) {
    console.error("\n🔥 ERRO AO EXECUTAR inserir_presencas ===");
    console.error(err);
  }
}

testar();