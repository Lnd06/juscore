import mongoose from "mongoose";

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️  MONGODB_URI não configurada — Biblioteca desativada.");
    return;
  }

  try {
    await mongoose.connect(uri, {
      bufferCommands: false, // Desativar buffering para evitar timeouts de 10s se cair
    });
    console.log("✅ MongoDB Atlas conectado (Biblioteca Jurídica)");
  } catch (err) {
    console.error("❌ Falha ao conectar ao MongoDB:", err.message);
  }
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) return;
  try {
    await mongoose.disconnect();
    console.log("🔌 MongoDB Atlas desconectado.");
  } catch (err) {
    console.error("❌ Erro ao desconectar MongoDB:", err.message);
  }
}

export function isLibraryConnected() {
  return mongoose.connection.readyState === 1;
}

export default mongoose;
