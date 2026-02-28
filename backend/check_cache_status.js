import sequelize from "./config/database.js";
import Cache from "./models/cache.js";

async function checkCache() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao banco de dados.");

    const count = await Cache.count();
    console.log(`📊 Total de entradas no Cache: ${count}`);

    if (count > 0) {
      const recent = await Cache.findAll({
        limit: 5,
        order: [["updatedAt", "DESC"]],
        attributes: ["key", "expireAt", "updatedAt"],
      });

      console.log("\n🕒 Últimas 5 entradas:");
      recent.forEach((c) => {
        const isExpired = new Date(c.expireAt) < new Date();
        console.log(
          `- Key: ${c.key.substring(0, 30)}... | Expira em: ${c.expireAt.toLocaleString()} ${isExpired ? "🔴 (Expirado)" : "🟢 (Válido)"}`,
        );
      });
    } else {
      console.log(
        "⚠️ O Cache está vazio. Se você já usou o chat, algo está errado na gravação.",
      );
    }
  } catch (error) {
    console.error("❌ Erro ao ler cache:", error);
  } finally {
    await sequelize.close();
  }
}

checkCache();
