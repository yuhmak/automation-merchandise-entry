module.exports = {
    apps: [{
        name: "yuhmak-hogar",
        script: "./src/index.js",
        instances: 1,
        exec_mode: "fork",
        cron_restart: "*/10 * * * *",
        autorestart: false,
        watch: false,
        env: {
            NODE_ENV: "production"
        }
    }]
};
