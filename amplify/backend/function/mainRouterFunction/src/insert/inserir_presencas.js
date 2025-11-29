const { supabase } = require('../bd/connectionBD');

// Valida UUID v4 simples
function isUUID(str) {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

// Converte dd/MM/yyyy para timestamp ISO
function converterParaTimestamp(dataStr) {
  if (typeof dataStr !== "string") return null;

  // Se já for ISO, retorna direto
  if (dataStr.includes("T")) return dataStr;

  if (dataStr.includes("/")) {
    const partes = dataStr.split("/");
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes}-${dia}T00:00:00-03:00`;
    }
  }
  return null;
}

async function inserirPresencas(body) {
  console.log("📥 inserirPresencas recebeu body:", body);

  const { data, presente, fkAlunos, fkAulas } = body;

  if (!data || !fkAlunos || !fkAulas) {
    throw new Error("Parâmetros obrigatórios ausentes (data, fkAlunos, fkAulas).");
  }

  if (!isUUID(fkAlunos)) {
    throw new Error("fkAlunos deve ser um UUID válido.");
  }

  const dataFormatada = converterParaTimestamp(data);
  if (!dataFormatada) {
    throw new Error("Data em formato inválido. Use dd/MM/yyyy ou timestamp ISO.");
  }

  let presencaFinal;
  if (typeof presente === "boolean") {
    presencaFinal = presente;
  } else if (presente === 1 || presente === "1") {
    presencaFinal = true;
  } else if (presente === 0 || presente === "0") {
    presencaFinal = false;
  } else {
    throw new Error("Valor de 'presente' inválido. Use true, false, 1 ou 0.");
  }

  const payload = {
    p_data: dataFormatada,
    p_presente: presencaFinal,
    p_fk_alunos: fkAlunos,
    p_fk_aulas: Number(fkAulas)
  };

  console.log("🔧 Chamando RPC inserir_presencas com payload:", payload);

  const { data: retorno, error } = await supabase.rpc("inserir_presencas", payload);

  console.log("📤 Retorno do Supabase RPC inserir_presencas:", { retorno, error });

  if (error) throw error;

  return retorno;
}

module.exports = { inserirPresencas };
