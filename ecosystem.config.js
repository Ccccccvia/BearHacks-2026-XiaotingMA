module.exports = {
  apps: [{
    name: 'petspeak',
    script: 'node_modules/.bin/next',
    args: 'start -p 80',
    cwd: '/opt/petspeak',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
  }]
};
