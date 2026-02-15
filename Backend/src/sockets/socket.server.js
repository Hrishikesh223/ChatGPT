const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const messageModel = require("../models/message.model");
const aiService = require("../services/ai.service");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // 🔐 Socket Auth
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    const token = cookies.token;

    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayload) => {
      try {
        // 1️⃣ Save user message
        const userMessage = await messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        });

        // 2️⃣ Vectorize user message
        const vectors = await aiService.generateVector(messagePayload.content);

        await createMemory({
          messageID: userMessage._id,
          text: messagePayload.content,
          metadata: {
            chat: messagePayload.chat.toString(),
            user: socket.user._id.toString(),
            role: "user",
            
          },
        });

        // 3️⃣ Parallel fetch: LTM + STM
        const [memory, chatHistory] = await Promise.all([
          queryMemory({ queryVector: vectors, limit: 3 }),
          messageModel
            .find({ chat: messagePayload.chat })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean(),
        ]);

        chatHistory.reverse();

        // 4️⃣ Build STM
        const stm = chatHistory.map(m => ({
          role: m.role,
          content: m.content,
        }));

        // 5️⃣ Build LTM (SYSTEM)
        const messages = [];

        if (memory.length > 0) {
          messages.push({
            role: "system",
            content: memory.map(m => m.metadata.text).join("\n"),
          });
        }

        messages.push(...stm);

        console.log("\n📦 FINAL MESSAGES TO GROK:", messages);

        // 6️⃣ Generate AI response
        const response = await aiService.generateResponse(messages);

        // 7️⃣ Save AI response
        const aiMessage = await messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "assistant",
        });

        await createMemory({
          messageID: aiMessage._id,
          text: response,
          metadata: {
            chat: messagePayload.chat.toString(),
            user: socket.user._id.toString(),
            role: "assistant",
            
          },
        });

        // 8️⃣ Emit back to frontend
        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });

      } catch (err) {
        console.error("❌ SOCKET ERROR:", err);
      }
    });
  });
}

module.exports = initSocketServer;
