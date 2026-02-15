const express = require('express');
const authMiddleware = require("../middlewares/auth.middleware")
const chatController = require("../controller/chat.controller")



const router = express.Router();


router.post('/', authMiddleware.authUser, chatController.createChat)
router.get('/', authMiddleware.authUser, chatController.getChats)
router.get('/messages/:id', authMiddleware.authUser, chatController.getMessages)

module.exports = router;