import { Router } from 'express'
import { authMiddleware, signToken, verifyPassword } from '../auth.js'
import { db } from '../db.js'
import { loginLimiter } from '../security.js'

export function authRoutes() {
  const router = Router()

  router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'username/password required' })
    const user = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный логин или пароль' })
    }
    const safeUser = { id: user.id, username: user.username, role: user.role }
    res.json({ token: signToken(safeUser), user: safeUser })
  })

  router.get('/me', authMiddleware, (req, res) => {
    res.json(req.user)
  })

  return router
}
