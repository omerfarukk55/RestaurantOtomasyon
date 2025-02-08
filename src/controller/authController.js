const { sql } = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await sql.query`
            SELECT id, username, password, role 
            FROM users 
            WHERE username = ${username}
        `;

        const user = result.recordset[0];

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, email, full_name } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user
        const result = await sql.query`
            INSERT INTO users (username, password, email, full_name, role)
            VALUES (${username}, ${hashedPassword}, ${email}, ${full_name}, 'customer')
            SELECT SCOPE_IDENTITY() as id
        `;

        const userId = result.recordset[0].id;

        const token = jwt.sign(
            { userId, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            message: 'User created successfully',
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};