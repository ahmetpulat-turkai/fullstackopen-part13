const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { User, Blog } = require('../models')

router.get('/', async (req, res) => {
  const users = await User.findAll({
    include: { model: Blog, attributes: { exclude: ['userId'] } },
  })
  res.json(users)
})

router.post('/', async (req, res) => {
  const { username, name, password } = req.body
  const passwordHash = password ? await bcrypt.hash(String(password), 10) : null
  const user = await User.create({ username, name, passwordHash })
  const { passwordHash: _hash, ...safeUser } = user.toJSON()
  res.status(201).json(safeUser)
})

router.get('/:id', async (req, res) => {
  const where = {}
  if (req.query.read === 'true' || req.query.read === 'false') {
    where.read = req.query.read === 'true'
  }
  const user = await User.findByPk(req.params.id, {
    attributes: ['name', 'username'],
    include: [
      {
        model: Blog,
        as: 'readings',
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] },
        through: { attributes: ['read', 'id'], as: 'readingList', where },
      },
    ],
  })
  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }
  return res.json(user)
})

router.put('/:username', async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } })
  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }
  user.name = req.body.name
  await user.save()
  return res.json(user)
})

module.exports = router
