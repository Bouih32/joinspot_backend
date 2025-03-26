const prisma = require("./client");
const { createNotification } = require("./notification");

const createTicket = async (userId, activityId, quantity,paymentIntentId) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { activityId: activityId},
    });
    if (!activity) {
      throw new Error("Activity not found");
    }
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        activityId,
        code,
        quantity,
        paymentIntentId
      },
    });
    if(ticket){
      await prisma.activity.update({
        where: { activityId },
        data: {
          seat: activity.seat - quantity,
        },
      });
    }
    const reserver = await prisma.user.findUnique({
      where: { userId },
      select: { userName: true },
    });

    if (reserver && activity.user) {
      await createNotification(
        userId,
        activity.user.userId,
        `${reserver.userName} a réservé ${quantity} place(s) pour votre activité "${activity.title}"`
      );
    }
    return ticket;
  } catch (error) {
    console.error("Erreur lors de la réservation :", error.message);
    throw error;
  }
};

module.exports = { createTicket };
