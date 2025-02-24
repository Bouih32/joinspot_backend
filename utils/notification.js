const prisma = require("./client");

const createNotification = async (fromId, toId, type, content) => {
  try {
    await prisma.notification.create({
      data: {           
          fromId,
          toId,
        content:
          type === "MESSAGE"
            ? `Vous avez reçu un nouveau message de ${content}`
            : `${content} a commencé à vous suivre`,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    throw error;
  }
};

module.exports = { createNotification };
