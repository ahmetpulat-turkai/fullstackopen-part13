const jwt = require('jsonwebtoken')
const { SECRET } = require('./config')
const { User, Session } = require('../models')

// requires a valid token that has an active session and a non-disabled user
const tokenExtractor = async (req, res, next) => {
  const authorization = req.get('authorization')
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'token missing' })
  }
  const token = authorization.substring(7)
  try {
    req.decodedToken = jwt.verify(token, SECRET)
  } catch {
    return res.status(401).json({ error: 'token invalid' })
  }
  const session = await Session.findOne({ where: { token } })
  if (!session) {
    return res.status(401).json({ error: 'session expired' })
  }
  const user = await User.findByPk(session.userId)
  if (!user || user.disabled) {
    return res.status(401).json({ error: 'account disabled' })
  }
  req.token = token
  req.user = user
  return next()
}

const unknownEndpoint = (req, res) => res.status(404).json({ error: 'unknown endpoint' })

const errorHandler = (error, req, res, next) => {
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: error.errors.map((e) => e.message) })
  }
  if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: [error.message] })
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: ['malformatted JSON'] })
  }
  console.error(error)
  return next(error)
}

module.exports = { tokenExtractor, unknownEndpoint, errorHandler }
