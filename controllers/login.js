const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { SECRET } = require('../util/config')
const { User, Session } = require('../models')

router.post('/', async (req, res) => {
  const { username, password } = req.body
  const user = await User.scope('withPassword').findOne({ where: { username } })
  const passwordCorrect = user && user.passwordHash && password
    ? await bcrypt.compare(String(password), user.passwordHash)
    : false

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: 'invalid username or password' })
  }
  if (user.disabled) {
    return res.status(401).json({ error: 'account disabled, please contact admin' })
  }

  // jti makes every login produce a different token, even within the same second
  const token = jwt.sign({ username: user.username, id: user.id, jti: crypto.randomUUID() }, SECRET)
  await Session.create({ userId: user.id, token })
  return res.status(200).json({ token, username: user.username, name: user.name })
})

module.exports = router
