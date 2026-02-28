import express from "express";
import jwt from "jsonwebtoken";
import { User, Conversation, Organization } from "../models/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha, apelido, cargo, finalidade } = req.body;

    if (!nome || !email || !senha || !apelido || !cargo || !finalidade) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios.",
      });
    }

    // Validação de Senha Forte
    const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(senha) || senha.length < 6) {
      return res.status(400).json({
        error:
          "A senha deve ter no mínimo 6 caracteres, incluindo letra maiúscula, minúscula e número.",
      });
    }

    const userExiste = await User.findOne({ where: { email } });
    if (userExiste) {
      return res
        .status(400)
        .json({ error: "Este email já está vinculado a uma conta." });
    }

    const user = await User.create({
      nome,
      email,
      senha,
      apelido,
      cargo,
      finalidade,
      termosAceitos: true,
      dataAceiteTermos: new Date(),
    });

    const token = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        apelido: user.apelido,
        tipo: user.tipo,
        cargo: user.cargo,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Conversation,
          as: "conversations", // Fixed alias
          limit: 15,
          order: [["updatedAt", "DESC"]],
        },
        {
          model: Organization,
          as: "organization",
        },
      ],
    });
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const senhaValida = await user.compararSenha(senha);
    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        apelido: user.apelido,
        tipo: user.tipo,
        cargo: user.cargo,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        foto: user.foto,
        ultimasConversas: user.conversations || [],
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// Verificar token
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token não fornecido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["senha"] },
      include: [
        {
          model: Conversation,
          as: "conversations", // Fixed alias
          limit: 15,
          order: [["updatedAt", "DESC"]],
        },
        {
          model: Organization,
          as: "organization",
        },
      ],
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    res.json({
      user: {
        ...user.toJSON(),
        ultimasConversas: user.conversations || [],
        organization: user.organization,
      },
    });
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
});

// Recuperação de senha - Solicitar código
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Email não encontrado" });
    }

    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar código e validade (15 minutos)
    user.resetPasswordToken = codigo;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Enviar email (simulado)
    const { enviarCodigoEmail } = await import("../validação/utils.js");
    await enviarCodigoEmail(email, codigo);

    res.json({ message: "Código de verificação enviado para o email" });
  } catch (error) {
    console.error("Erro forgot-password:", error);
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

// Recuperação de senha - Verificar código
router.post("/verify-code", async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const { Op } = await import("sequelize");

    const user = await User.findOne({
      where: {
        email,
        resetPasswordToken: codigo,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Código inválido ou expirado" });
    }

    res.json({ message: "Código válido" });
  } catch (error) {
    console.error("Erro verify-code:", error);
    res.status(500).json({ error: "Erro ao verificar código" });
  }
});

// Recuperação de senha - Redefinir senha
router.post("/reset-password", async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body;
    const { Op } = await import("sequelize");

    const user = await User.findOne({
      where: {
        email,
        resetPasswordToken: codigo,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Código inválido ou expirado" });
    }

    user.senha = novaSenha;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Validação de Senha Forte
    const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(novaSenha) || novaSenha.length < 6) {
      return res.status(400).json({
        error:
          "A senha deve ter no mínimo 6 caracteres, incluindo letra maiúscula, minúscula e número.",
      });
    }

    await user.save();

    res.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Erro reset-password:", error);
    res.status(500).json({ error: "Erro ao redefinir senha" });
  }
});

// Imports moved to top

// Atualizar Perfil
router.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token não fornecido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Conversation,
          as: "conversations",
          limit: 15,
          order: [["updatedAt", "DESC"]],
        },
        {
          model: Organization,
          as: "organization",
        },
      ],
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const {
      nome,
      apelido,
      cargo,
      image,
      currentPassword,
      newPassword,
      cpf,
      telefone,
    } = req.body;

    // Atualizar dados de texto
    if (nome) user.nome = nome;
    if (apelido) user.apelido = apelido;
    if (cargo) user.cargo = cargo;
    if (cpf) user.cpf = cpf;
    if (telefone) user.telefone = telefone;

    // Alterar senha (se fornecida)
    if (newPassword) {
      if (currentPassword) {
        const isMatch = await user.compararSenha(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ error: "Senha atual incorreta" });
        }
      }
      user.senha = newPassword; // Hook beforeUpdate fará o hash
    }

    // Processar Imagem (se fornecida)
    if (image) {
      // 1. Criar diretório se não existir
      const uploadDir = path.join(__dirname, "../uploads/profiles");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 2. Decodificar Base64
      // Formato esperado: "data:image/png;base64,iVBORw0KGgo..."
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches && matches.length === 3) {
        const extension = matches[1].split("/")[1]; // ex: png
        const buffer = Buffer.from(matches[2], "base64");
        const filename = `user_${user.id}_${Date.now()}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        // 3. Salvar arquivo
        fs.writeFileSync(filepath, buffer);

        // 4. Atualizar URL no banco
        user.foto = `/uploads/profiles/${filename}`;
      }
    }

    await user.save();

    res.json({
      message: "Perfil atualizado com sucesso",
      user: {
        ...user.toJSON(),
        senha: undefined,
        organization: user.organization,
        ultimasConversas: user.conversations || [], // Manter compatibilidade
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res
      .status(500)
      .json({ error: "Erro ao atualizar perfil: " + error.message });
  }
});

export default router;
