import express from 'express';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import Submission from './submission.js';

const router = express.Router();

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-izauzh4v2x5k3jxj.us.auth0.com/.well-known/jwks.json`
  }),
  audience: 'https://dev-izauzh4v2x5k3jxj.us.auth0.com/api/v2/',
  issuer: `https://dev-izauzh4v2x5k3jxj.us.auth0.com/`,
  algorithms: ['RS256']
});

router.post('/', checkJwt, async (req, res) => {
  try {
    const { compost = 0, recycle = 0, trash = 0, location } = req.body;
    const { sub, name, email } = req.user;

    if (!location || !location.type || !Array.isArray(location.coordinates)) {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    const submission = new Submission({
      userAuth0Id: sub,
      username: name,
      email,
      compost,
      recycle,
      trash,
      location,
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;