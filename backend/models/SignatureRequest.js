import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import crypto from "crypto";

const SignatureRequest = sequelize.define("SignatureRequest", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Advogado que solicitou a assinatura",
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT("long"),
    allowNull: false,
    comment: "Texto completo do documento que o cliente vai ler e assinar",
  },
  status: {
    type: DataTypes.ENUM("PENDENTE", "ASSINADO", "RECUSADO", "EXPIRADO"),
    defaultValue: "PENDENTE",
  },
  signerName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Nome completo do cliente preenchido no aceite",
  },
  signerCpf: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "CPF/CNPJ inserido pelo cliente no momento que clicou em aceitar",
  },
  signerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Email do signatário informado no aceite",
  },
  signerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Telefone do signatário informado no aceite",
  },
  signerIp: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "IP registrado do dispositivo do cliente no aceite",
  },
  signerUserAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "User-Agent do navegador do signatário",
  },
  signedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Prazo para expiração do link, se necessário",
  },
  signatureImage: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    comment: "Imagem base64 da rubrica ou fonte do cliente",
  },
  lawyerSignatureImage: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    comment: "Imagem base64 da rubrica do advogado",
  },
  // Campos criptográficos para garantir integridade
  documentHash: {
    type: DataTypes.STRING(128),
    allowNull: true,
    comment: "SHA-512 hash do conteúdo do documento no momento da criação",
  },
  signatureHash: {
    type: DataTypes.STRING(128),
    allowNull: true,
    comment: "SHA-512 hash dos dados da assinatura (nome+cpf+ip+timestamp+documentHash)",
  },
  verificationCode: {
    type: DataTypes.STRING(16),
    allowNull: true,
    comment: "Código de verificação curto para validação rápida",
  },
});

// Hook: Gerar hash do documento ao criar
SignatureRequest.beforeCreate(async (instance) => {
  if (instance.content) {
    instance.documentHash = crypto
      .createHash("sha512")
      .update(instance.content)
      .digest("hex");
  }
  // Gerar código de verificação curto (8 caracteres alfanuméricos)
  instance.verificationCode = crypto.randomBytes(4).toString("hex").toUpperCase();
});

export default SignatureRequest;
