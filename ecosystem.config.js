module.exports = {
  apps: [
    {
      name: 'automation-merchandise',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production'
      },
      time: true
    }
  ]
};
