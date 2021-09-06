import express from 'express'
import { pool } from '../db'
import bcrypt from "bcryptjs"

const router = express.Router()

const isSuperadmin = (req, res, next) => {
    if (req.user && req.user.is_superadmin)
        return next()
    else
        return res.sendStatus(401)
}

router.get('/all', isSuperadmin, async (req, res) => {
    console.log('getusers')
    const users = await pool.query('SELECT * FROM users;')
    users.rows.forEach(e => delete e.pass_hash)
    res.json(users.rows)
})

router.post('/newUser', isSuperadmin, async (req, res) => {
    const passHash = await bcrypt.hash(req.body.password, 10)
    try {
        await pool.query('INSERT INTO users (username, pass_hash) VALUES ($1, $2);', [req.body.username, passHash]);
    } catch (e) {
        res.json({error: "USER_EXISTS"})
        return
    }
    res.json({})
})

router.post('/changeUser', isSuperadmin, async (req, res) => {
    let sql = ''
    let vals = []
    if (req.body.username) {
        sql = 'UPDATE users SET username = $1 WHERE id = $2;'
        vals = [req.body.username, req.body.id]
    } else if (req.body.password) {
        const passHash = await bcrypt.hash(req.body.password, 10);
        sql = 'UPDATE users SET pass_hash = $1 WHERE id = $2;'
        vals = [passHash, req.body.id]
    } else
        res.sendStatus(200)
    await pool.query(sql, vals)
    res.sendStatus(200)
})

router.post('/deleteUser', isSuperadmin, async (req, res) => {
    await pool.query('DELETE FROM users WHERE id = $1;', [req.body.id])
    res.sendStatus(200)
})

export default router