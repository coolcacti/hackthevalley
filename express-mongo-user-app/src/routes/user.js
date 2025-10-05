import express from "express";
import { expressjwt as jwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import User from "../models/user.js";
import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-kipzv7bwrxcpd61d.us.auth0.com/.well-known/jwks.json`,
  }),
  audience: "https://dev-kipzv7bwrxcpd61d.us.auth0.com/api/v2/",
  issuer: `https://dev-kipzv7bwrxcpd61d.us.auth0.com/`,
  algorithms: ["RS256"],
});

router.post('/sync', checkJwt, async (req, res) => {
  try {
    const jwtPayload = req.user || req.auth || {};
    const sub = jwtPayload.sub;
    const { name: bodyName, email: bodyEmail, picture: bodyPicture } = req.body || {};

    const name = bodyName || jwtPayload.name || 'User';
    const email = bodyEmail || jwtPayload.email || null;
    const picture = bodyPicture || jwtPayload.picture || "/avatar1.jpeg";

    if (!sub) return res.status(400).json({ message: 'No sub in token' });

    const user = await User.findOneAndUpdate(
      { userAuth0Id: sub },
      {
        userAuth0Id: sub,
        username: name,
        email,
        picture,
        compost: 0,
        recycle: 0,
        trash: 0,
        totalItemsCollected: 0
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(user);
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/", createUser);

router.get("/:id", getUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

export default router;
