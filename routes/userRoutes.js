const { register }= require("../controllers/usersController");
const { login , getAllUsers,setAvatar}= require("../controllers/usersController");
const router =require("express").Router();
router.post("/register",register)
router.post("/login",login)
router.post("/setavatar/:id", setAvatar);
router.get("/allusers/:id", getAllUsers);
module.exports =router