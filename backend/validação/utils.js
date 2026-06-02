import nodemailer from "nodemailer";

/**
 * Envia o código de verificação por email usando Nodemailer.
 *
 * @param {string} email - Email do destinatário
 * @param {string} codigo - Código de verificação
 */
export const enviarCodigoEmail = async (email, codigo) => {
  // Configuração do transporter (Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"JusCore AI" <' + process.env.EMAIL_USER + ">",
    to: email,
    subject: "Seu código de verificação - JusCore AI",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou a redefinição de sua senha no JusCore AI.</p>
        <p>Seu código de verificação é:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px; background: #f3f4f6; padding: 10px; text-align: center; border-radius: 8px;">${codigo}</h1>
        <p>Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado: " + info.response);
    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    // Fallback para log no console se falhar (útil para debug)
    console.log(`🔑 Código (Fallback): ${codigo}`);
    // Não relançamos o erro para permitir recuperação mesmo se o servidor de e-mail falhar temporariamente
    return false;
  }
};
