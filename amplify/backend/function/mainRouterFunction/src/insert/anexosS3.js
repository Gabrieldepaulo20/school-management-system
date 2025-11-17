const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Bucket e região vindos do Amplify
const S3_BUCKET =
  process.env.STORAGE_AVALIACOESSTORAGE_BUCKETNAME ||
  process.env.BUCKET_AVALIACOES ||
  "diario-avaliacoesb5035-dev";

console.log("🪣 [S3] Usando bucket:", S3_BUCKET);

const S3_REGION = process.env.AWS_REGION || "us-east-1";

const s3Client = new S3Client({ region: S3_REGION });

/**
 * Deixa o texto simples para usar na URL:
 * - tudo minúsculo
 * - espaços viram "-"
 * - remove acentos/caracteres estranhos
 */
function slugify(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\-_. ]/g, "") // mantém letras, números, -, _ , . e espaço
    .trim()
    .replace(/\s+/g, "-"); // espaços -> "-"
}

/**
 * Normaliza a data para "yyyy-mm-dd".
 * Aceita:
 * - "dd/mm/yyyy"
 * - "yyyy-mm-dd"
 */
function normalizarDataSimples(data) {
  if (!data) return null;

  // já está no formato yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  // formato dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return null;
}

/**
 * Upload genérico de anexo para o S3.
 *
 * Espera um objeto "data" com:
 * {
 *   prefixo: "avaliacoes/" | "plano_de_aula/" | "qualquer-outra-coisa/",
 *   turmaId: number | string,
 *   turmaNome: string,
 *   professorNome: string,
 *   dataReferencia: string,   // ex: "10/03/2025" ou "2025-03-10"
 *   nomeArquivo: string,      // ex: "prova-espanhol.pdf"
 *   tipo: string,             // mime type, ex: "application/pdf"
 *   conteudoBase64: string    // arquivo em base64
 * }
 *
 * A key no S3 ficará neste padrão:
 *   {prefixo}{turmaId-turmaSlug}/{professorSlug}/{data}-timestamp-nomeArquivo
 *
 * Exemplo de key:
 *   avaliacoes/5-turma-a/professor-joao/2025-03-10-1731723000000-prova-espanhol.pdf
 *
 * Retorna:
 *   { url, key }
 */
async function uploadAnexoGenerico(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Parâmetro 'data' inválido para upload de anexo.");
  }

  const {
    prefixo,
    turmaId,
    turmaNome,
    professorNome,
    dataReferencia,
    nomeArquivo,
    tipo,
    conteudoBase64,
  } = data;

  // Validações básicas
  if (!prefixo) throw new Error("prefixo é obrigatório (ex: 'avaliacoes/').");
  if (!turmaId) throw new Error("turmaId é obrigatório.");
  if (!turmaNome) throw new Error("turmaNome é obrigatório.");
  if (!professorNome) throw new Error("professorNome é obrigatório.");
  if (!dataReferencia) throw new Error("dataReferencia é obrigatória.");
  if (!nomeArquivo) throw new Error("nomeArquivo é obrigatório.");
  if (!conteudoBase64) throw new Error("conteudoBase64 é obrigatório.");

  const dataNormalizada = normalizarDataSimples(dataReferencia);
  if (!dataNormalizada) {
    throw new Error("dataReferencia inválida. Use dd/mm/yyyy ou yyyy-mm-dd.");
  }

  // Monta partes da URL de forma legível
  const turmaParte = `${turmaId}-${slugify(turmaNome)}`;
  const professorParte = slugify(professorNome);
  const safeNomeArquivo = slugify(nomeArquivo);

  const basePrefix =
    prefixo.endsWith("/") || prefixo.endsWith("\\")
      ? prefixo.replace("\\", "/")
      : `${prefixo}/`;

  const timestamp = Date.now();

  // Exemplo final:
  // avaliacoes/5-turma-a/professor-joao/2025-03-10-1731723000000-prova-espanhol.pdf
  const key = `${basePrefix}${turmaParte}-${professorParte}-${dataNormalizada}-${timestamp}-${safeNomeArquivo}`;

  let buffer;
  try {
    buffer = Buffer.from(conteudoBase64, "base64");
  } catch (e) {
    throw new Error("conteudoBase64 não está em base64 válido.");
  }

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: tipo || "application/octet-stream",
  };

  await s3Client.send(new PutObjectCommand(params));

  const url = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;

  return { url, key };
}

module.exports = {
  uploadAnexoGenerico,
};
