const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json("Access Denied: No Token");

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'admin') return res.status(403).json("Access Denied: Admins Only");
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json("Invalid Token");
    }
};

module.exports = { verifyAdmin };