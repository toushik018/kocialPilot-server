module.exports = {
  apps: [{
    name: 'kocial-server',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000, // Match this with your .env PORT
      NODE_OPTIONS: '--max_old_space_size=2048'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    time: true
  }]
};
