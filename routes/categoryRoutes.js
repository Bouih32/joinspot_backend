const express = require("express");
const prisma = require("../utils/client");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await prisma.category.findMany();
    res.status(200).send({ data, message: "ghaya bla di3aya" });
  } catch (error) {
    res.status(500).send(error, { message: "oops " });
  }
});
module.exports = router;
