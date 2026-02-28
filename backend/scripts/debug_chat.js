import dotenv from "dotenv";
import Groq from "groq-sdk";
import { Sequelize } from "sequelize";

dotenv.config();

// 1. Check Env Vars
console.log("🔍 Checking Environment Variables...");
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing!");
  process.exit(1);
} else {
  console.log(
    "✅ GROQ_API_KEY is found (Starts with: " +
      process.env.GROQ_API_KEY.substring(0, 5) +
      "...)",
  );
}

if (!process.env.DB_NAME) console.warn("⚠️ DB_NAME missing, using default");

// 2. Test Groq API
async function testGroq() {
  console.log("\n🧠 Testing Groq API Connection...");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: 'Say "Hello JusCore"' }],
      model: "llama-3.1-8b-instant",
    });
    console.log("✅ Groq Response:", completion.choices[0]?.message?.content);
  } catch (error) {
    console.error("❌ Groq API Failed:", error.message);
    if (error.response) console.error("Details:", error.response.data);
  }
}

// 3. Test Database Connection
async function testDB() {
  console.log("\n🗄️ Testing Database Connection...");
  const sequelize = new Sequelize(
    process.env.DB_NAME || "juscore_ai",
    process.env.DB_USER || "root",
    process.env.DB_PASS || "",
    {
      host: process.env.DB_HOST || "localhost",
      dialect: "mysql",
      logging: false,
    },
  );

  try {
    await sequelize.authenticate();
    console.log("✅ Database Connection Successful");

    // Basic query
    const [results] = await sequelize.query("SELECT 1+1 AS result");
    console.log("✅ Simple Query Result:", results[0].result);

    // Check tables
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log(
      "✅ Tables found:",
      tables.map((t) => Object.values(t)[0]),
    );
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
  } finally {
    await sequelize.close();
  }
}

async function run() {
  await testGroq();
  await testDB();
}

run();
