import { Router } from "express";
import { 
    addToHistory, 
    getUserHistory, 
    login, 
    register 
} from "../controllers/user.controller.js";

const router = Router();

// ✅ Authentication Routes
router.route("/register").post(register);  
router.route("/login").post(login);        

// ✅ Meeting History Routes
router.route("/add_to_activity").post(addToHistory);      
router.route("/get_all_activity").get(getUserHistory);    


export default router;