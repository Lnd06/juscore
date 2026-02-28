module.exports = {
  apps: [
    {
      name: "juri-ai-backend",
      script: "./backend/server.js",
      instances: "max", // Uses all available CPU cores
      exec_mode: "cluster",
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
