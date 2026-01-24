const express = require('express');
const router = express.Router();
const { jwtCheck } = require('../middleware/auth');

router.use(jwtCheck);

router.get('/', (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.auth
  });
});

router.get('/user', (req, res) => {
  const userId = req.auth.payload.sub;

  return res.status(404).json({});
  // res.json({
  //   message: 'User data retrieved',
  //   userId: userId,
  //   groupCode: 342313,
  //   groupName: 'The f1 predictorzz'
  // });
});

module.exports = router;