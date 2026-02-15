const chatModel = require('../models/chat.model');
const userModel = require('../models/user.model');
const messageModel = require("../models/message.model")

async function createChat(req, res) {
    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
        user: user._id,
        title
    });

    res.status(201).json({
        message: "Chat created successfully",
        chat : {
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
            
        }
    })
}

async function getChats(req,res) {
    const user = req.user;
    const chats = await userModel.find({ user: user._id});

    res.status(200).json({
        message: "chats retrievd successfully",
        chats: chats.map(chat=> ({
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user


        }))
    })

}

async function getMessages(req, res) {
  try {
    console.log("Params:", req.params); // ✅ correct place
    console.log("User:", req.user);     // ✅ correct place

    const chatId = req.params.id;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await messageModel
      .find({
        chat: chatId,
        user: req.user._id
      })
      .sort({ createdAt: 1 });

    res.status(200).json({
      message: "Messages retrieved successfully",
      messages
    });

  } catch (error) {
    console.error("❌ getMessages error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getMessages
};



module.exports = {
    createChat,
    getChats,
    getMessages
}