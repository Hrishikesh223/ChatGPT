const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function authUser(req, res, next) {
  try {
    // 1️⃣ Read token safely
    const token = req.cookies?.token;

    console.log("Cookies received:", req.cookies);
    console.log("Token received:", token);

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token' });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Fetch user
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    // 4️⃣ Attach user to request
    req.user = user;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}

module.exports = {
  authUser
};
