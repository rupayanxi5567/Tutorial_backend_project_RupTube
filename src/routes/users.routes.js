import { Router } from "express";
import { registerUser } from "../controllers/users.controllers.js";

let router = Router();

router.route('/register').post(registerUser)





export default router;