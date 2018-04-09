const defaultConfig = {
  secret: process.env.SECRET ? process.env.SECRET : 'nosecret',
  seedDb: process.env.SEED_DB ? process.env.SEED_DB : false,
  database: process.env.DB_URI ? process.env.DB_URI : 'mongodb://localhost/the-schelling-game',
  ipsAllowed: process.env.IPS_ALLOWED ? process.env.IPS_ALLOWED.split(',') : [
    '::1',
    '127.0.0.1'
  ]
}

module.exports = defaultConfig
