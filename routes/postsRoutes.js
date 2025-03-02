const express = require("express");
const router = express.Router();
const {
    createPost,
    addTagToPost,
    getPosts,
    getPostById
  } = require("../controllers/postsControllers");
  const { checkRole } = require("../middlewares/Autorization");
  const { authenticateToken } = require("../middlewares/auth");
  const { validateData } = require("../utils/validation");

router.post("/createPost",
    authenticateToken,
    validateData,
    createPost
  );
  router.post("/:postId/addTag",
    authenticateToken,
    validateData,
    addTagToPost
  );

router.get("/",
    authenticateToken,
    validateData,
    getPosts
  );
router.get("/:id",
    authenticateToken,
    validateData,
    getPostById
  );
module.exports = router;
