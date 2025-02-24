const prisma = require("./client");

const createNotification = async (fromId, toId, content) => {
  try {
    await prisma.notification.create({
      data: {
        fromId,
        toId,
        content,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    throw error;
  }
};

module.exports = { createNotification };
