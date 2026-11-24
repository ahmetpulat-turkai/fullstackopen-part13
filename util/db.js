const Sequelize = require('sequelize')
const { Umzug, SequelizeStorage } = require('umzug')
const { DATABASE_URL } = require('./config')

const sequelize = new Sequelize(DATABASE_URL, {
  logging: false,
  dialectOptions: DATABASE_URL && DATABASE_URL.includes('sslmode=disable') ? {} : undefined,
})

const migrator = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  storage: new SequelizeStorage({ sequelize, tableName: 'migrations' }),
  context: sequelize.getQueryInterface(),
  logger: console,
})

const runMigrations = async () => {
  const migrations = await migrator.up()
  console.log('Migrations up to date', { files: migrations.map((m) => m.name) })
}

const rollbackMigration = async () => {
  await sequelize.authenticate()
  await migrator.down()
}

const connectToDatabase = async () => {
  try {
    await sequelize.authenticate()
    await runMigrations()
    console.log('connected to the database')
  } catch (err) {
    console.log('failed to connect to the database', err.message)
    return process.exit(1)
  }
  return null
}

module.exports = { connectToDatabase, sequelize, rollbackMigration }
