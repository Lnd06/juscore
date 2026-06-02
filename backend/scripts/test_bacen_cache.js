import sequelize from "../config/database.js";
import { fetchAllIndices } from "../routes/calculator.js";

async function test() {
  try {
    await sequelize.authenticate();
    console.log("✅ Banco de dados autenticado.");

    console.log("🚀 Iniciando fetchAllIndices (L1/L2)...");
    const startTime = Date.now();
    const indices = await fetchAllIndices();
    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Tempo de execução: ${duration}ms`);
    console.log("📊 Índices recuperados com sucesso:");
    console.log("- SELIC:", indices.selic?.ultimo, "% (Data:", indices.selic?.data, ")");
    console.log("- IPCA:", indices.ipca?.ultimo, "% (Data:", indices.ipca?.data, ")");
    console.log("- INPC:", indices.inpc?.ultimo, "% (Data:", indices.inpc?.data, ")");
    console.log("- IGP-M:", indices.igpm?.ultimo, "% (Data:", indices.igpm?.data, ")");
    console.log("- TR:", indices.tr?.ultimo, "% (Data:", indices.tr?.data, ")");
    console.log("- Salário Mínimo:", indices.salarioMinimo?.valor, "(Ano:", indices.salarioMinimo?.ano, ")");

  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  } finally {
    await sequelize.close();
  }
}

test();
