const router = require('express').Router()
const { Blog, User, ReadingList, Session } = require('../models')

// test helper: empties all the tables, available only when TESTING=true
router.post('/', async (req, res) => {
  if (process.env.TESTING !== 'true') {
    return res.status(403).json({ error: 'reset is only available in test mode' })
  }
  await Session.destroy({ where: {} })
  await ReadingList.destroy({ where: {} })
  await Blog.destroy({ where: {} })
  await User.destroy({ where: {} })
  return res.status(204).end()
})

module.exports = router
