const router = require('express').Router()
const { Blog, User, ReadingList } = require('../models')
const { tokenExtractor } = require('../util/middleware')

router.post('/', async (req, res) => {
  const { blogId, userId } = req.body
  if (!Number.isInteger(blogId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'blogId and userId must be integers' })
  }
  const [blog, user] = await Promise.all([Blog.findByPk(blogId), User.findByPk(userId)])
  if (!blog) return res.status(404).json({ error: 'blog not found' })
  if (!user) return res.status(404).json({ error: 'user not found' })
  const exists = await ReadingList.findOne({ where: { blogId, userId } })
  if (exists) return res.status(400).json({ error: 'blog is already in the reading list' })
  const entry = await ReadingList.create({ blogId, userId })
  return res.status(201).json(entry)
})

router.put('/:id', tokenExtractor, async (req, res) => {
  const entry = await ReadingList.findByPk(req.params.id)
  if (!entry) return res.status(404).json({ error: 'reading list entry not found' })
  if (entry.userId !== req.user.id) {
    return res.status(401).json({ error: 'only the owner of the reading list can mark blogs as read' })
  }
  if (typeof req.body.read !== 'boolean') {
    return res.status(400).json({ error: 'read must be a boolean' })
  }
  entry.read = req.body.read
  await entry.save()
  return res.json(entry)
})

module.exports = router
