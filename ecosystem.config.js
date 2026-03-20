module.exports = {
  apps: [
    {
      name: 'automation-merchandise',
      script: './index.js',
      instances: 1,
      cron_restart: "*/10 * * * *",
      autorestart: false,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production'
      },
      time: true
    }
  ]
};
