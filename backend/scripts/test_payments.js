import axios from "axios";
import { User } from "../models/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:3000/api/payments";
let token = "";
let testUser = null;

async function runTests() {
  try {
    console.log("🚀 Starting Payments Area Tests...");

    // 1. Create a Test User
    const email = `test_payment_${Date.now()}@example.com`;
    testUser = await User.create({
      nome: "Test User Payments",
      email: email,
      senha: "password123",
      apelido: "Test",
      cpf: "12345678909",
      telefone: "11999999999",
      subscriptionStatus: "active",
      subscriptionPlan: "student_pro",
      subscriptionId: "test_sub_local_123", // Does not start with sub_ to avoid real Asaas call
      tipo: "especial",
    });

    console.log(`✅ Test User created: ${testUser.email}`);

    // 2. Generate JWT
    token = jwt.sign(
      { id: testUser.id, tipo: testUser.tipo },
      process.env.JWT_SECRET || "fallback_secret",
      {
        expiresIn: "1h",
      },
    );

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    // 3. Test GET /status
    console.log("🔄 Testing GET /status...");
    try {
      const statusRes = await axios.get(`${API_URL}/status`, config);
      console.log("✅ GET /status Response:", statusRes.data);
    } catch (err) {
      console.error("❌ GET /status Error:", err.response?.data || err.message);
    }

    // 4. Test POST /cancel_subscription (Local cancel)
    console.log("🔄 Testing POST /cancel_subscription...");
    try {
      const cancelRes = await axios.post(
        `${API_URL}/cancel_subscription`,
        {},
        config,
      );
      console.log("✅ POST /cancel_subscription Response:", cancelRes.data);

      // Verify DB update
      const updatedUser = await User.findByPk(testUser.id);
      console.log(
        `   User post-cancel status: ${updatedUser.subscriptionStatus}, plan: ${updatedUser.subscriptionPlan}`,
      );
      if (
        updatedUser.subscriptionStatus === "cancelled" &&
        updatedUser.subscriptionPlan === "free"
      ) {
        console.log("✅ Database correctly updated after cancellation.");
      } else {
        console.error("❌ Database NOT correctly updated after cancellation.");
      }
    } catch (err) {
      console.error(
        "❌ POST /cancel_subscription Error:",
        err.response?.data || err.message,
      );
    }

    // 5. Test POST /cancel_subscription (When already canceled)
    console.log("🔄 Testing POST /cancel_subscription (Already canceled)...");
    try {
      const cancelRes2 = await axios.post(
        `${API_URL}/cancel_subscription`,
        {},
        config,
      );
      console.log("❌ Should have failed, but got:", cancelRes2.data);
    } catch (err) {
      console.log(
        "✅ POST /cancel_subscription (Already canceled) correctly failed:",
        err.response?.data || err.message,
      );
    }

    console.log("🎉 All tests completed.");
  } catch (error) {
    console.error("❌ Fatal Test Error:", error);
  } finally {
    if (testUser) {
      // Cleanup test user
      await User.destroy({ where: { id: testUser.id } });
      console.log("🧹 Cleanup: Test User deleted.");
    }
    process.exit(0);
  }
}

runTests();
