const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')

const app = express()
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(helmet())

const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
const REFRESH_SECRET = process.env.REFRESH_SECRET || crypto.randomBytes(32).toString('hex')

const daftarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'kebanyakan nyoba login, tunggu 15 menit' },
  standardHeaders: true,
  legacyHeaders: false
})

const daftarUmum = rateLimit({
  windowMs: 60 * 1000,
  max: 60
})

app.use(daftarUmum)

let users = []
let refreshStore = new Map()

function validasiUsername(u) {
  if (typeof u !== 'string') return 'username harus teks'
  if (u.length < 3) return 'username minimal 3 huruf'
  if (u.length > 20) return 'username maksimal 20 huruf'
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'username cuma boleh huruf angka sama underscore'
  return null
}

function validasiPassword(p) {
  if (typeof p !== 'string') return 'password harus teks'
  if (p.length < 8) return 'password minimal 8 karakter'
  if (p.length > 72) return 'password maksimal 72 karakter'
  if (!/[a-z]/.test(p)) return 'password harus ada huruf kecil'
  if (!/[A-Z]/.test(p)) return 'password harus ada huruf besar'
  if (!/[0-9]/.test(p)) return 'password harus ada angka'
  return null
}

function bikinToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    SECRET,
    { expiresIn: '15m', issuer: 'jwt-auth-hardened' }
  )
}

function bikinRefresh(user) {
  const t = crypto.randomBytes(40).toString('hex')
  refreshStore.set(t, { id: user.id, dibuat: Date.now() })
  return t
}

app.post('/daftar', async (req, res) => {
  const { username, password } = req.body || {}

  const errU = validasiUsername(username)
  if (errU) return res.status(400).json({ error: errU })

  const errP = validasiPassword(password)
  if (errP) return res.status(400).json({ error: errP })

  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'username udah dipake' })
  }

  const hash = await bcrypt.hash(password, 12)
  const user = { id: users.length + 1, username, password: hash }
  users.push(user)

  res.status(201).json({ ok: true, id: user.id })
})

app.post('/masuk', daftarLogin, async (req, res) => {
  const { username, password } = req.body || {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'format salah' })
  }

  const user = users.find(u => u.username === username)

  const hashBohongan = '$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTU'
  const hash = user ? user.password : hashBohongan

  const cocok = await bcrypt.compare(password, hash)

  if (!user || !cocok) {
    return res.status(401).json({ error: 'username atau password salah' })
  }

  const token = bikinToken(user)
  const refresh = bikinRefresh(user)

  res.cookie('refresh', refresh, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.json({ ok: true, token, expired: '15 menit' })
})

app.post('/refresh', (req, res) => {
  const t = req.cookies && req.cookies.refresh

  if (!t || !refreshStore.has(t)) {
    return res.status(401).json({ error: 'refresh token gak valid' })
  }

  const data = refreshStore.get(t)
  refreshStore.delete(t)

  const user = users.find(u => u.id === data.id)
  if (!user) return res.status(401).json({ error: 'user gak ada' })

  const tokenBaru = bikinToken(user)
  const refreshBaru = bikinRefresh(user)

  res.cookie('refresh', refreshBaru, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.json({ ok: true, token: tokenBaru })
})

app.post('/keluar', (req, res) => {
  const t = req.cookies && req.cookies.refresh
  if (t) refreshStore.delete(t)
  res.clearCookie('refresh')
  res.json({ ok: true })
})

function cekToken(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'token gak ada' })
  }

  const token = header.slice(7)

  try {
    req.user = jwt.verify(token, SECRET, { issuer: 'jwt-auth-hardened' })
    next()
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token kadaluarsa, refresh dulu' })
    }
    return res.status(401).json({ error: 'token gak valid' })
  }
}

app.get('/aku', cekToken, (req, res) => {
  const user = users.find(u => u.id === req.user.sub)
  if (!user) return res.status(404).json({ error: 'gak ada' })

  res.json({ id: user.id, username: user.username })
})

app.get('/catatan', cekToken, (req, res) => {
  res.json({
    pesan: 'cuma bisa diakses kalo bawa token yang bener',
    user: req.user.username
  })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('jalan di ' + PORT))
