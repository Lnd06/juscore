import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api/auth";
const TEST_USER = {
  nome: "Test User",
  email: `test_${Date.now()}@example.com`,
  senha: "Password123!",
  apelido: "Tester",
  cargo: "Advogado",
  finalidade: "Teste",
};

async function run() {
  console.log("🚀 Starting Auth Flow Test...");

  // 1. Register
  console.log("\n1️⃣  Registering User...");
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_USER),
  });
  const regData = await regRes.json();
  console.log(`Status: ${regRes.status}`);
  if (!regRes.ok) {
    console.error("Registration failed:", regData);
    return;
  }
  console.log("User registered:", regData.user.email);

  // 2. Login
  console.log("\n2️⃣  Logging In...");
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_USER.email, senha: TEST_USER.senha }),
  });
  const loginData = await loginRes.json();
  console.log(`Status: ${loginRes.status}`);
  if (!loginRes.ok) {
    console.error("Login failed:", loginData);
    return;
  }
  const token = loginData.token;
  console.log("Login successful. Token received.");

  // 3. Get Me
  console.log("\n3️⃣  Fetching /auth/me...");
  const meRes = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const meData = await meRes.json();
  console.log(`Status: ${meRes.status}`);

  if (meRes.ok) {
    console.log("✅ /auth/me SUCCESS!");
    console.log("User Data:", meData.user.apelido);
  } else {
    console.error("❌ /auth/me FAILED");
    console.log("Error:", meData);
  }
}

run().catch(console.error);
