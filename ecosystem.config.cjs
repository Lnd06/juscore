module.exports = {
  apps: [
    {
      name: "juri-ai-backend",
      script: "./backend/server.js",
      instances: 1, // Optimized for 1 CPU VPS to prevent context switching and save RAM
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
