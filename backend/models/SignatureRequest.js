import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
    type: DataTypes.ENUM("PENDENTE", "ASSINADO"),
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
    comment: "CPF inserido pelo cliente no momento que clicou em aceitar",
  },
  signerIp: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "IP registrado do dispositivo do cliente no aceite",
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
});

export default SignatureRequest;
