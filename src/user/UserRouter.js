const UserService = require('./UserService');
const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('./User');

const router = express.Router();

// const validateUsername = async (req, res, next) => {
//   const user = req.body;
//   if (user.username === null) {
//     req.validationErrors = {
//       username: 'Username cannot be null',
//     };
//   }
//   next();
// };
// const validateEmail = async (req, res, next) => {
//   const user = req.body;
//   if (user.email === null) {
//     req.validationErrors = {
//       ...req.validationErrors,
//       email: 'email cannot be null',
//     };
//   }
//   next();
// };

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Username must be min 4 and max 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('email cannot be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await User.findOne({ where: { email } });
      if (user) {
        throw new Error('Email in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be atleast 6 characters long')
    .bail()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
    .withMessage('Password must have atleast 1 uppercase, 1 lowercase and 1 number in it'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // const response = { validationErrors: { ...req.validationErrors } };
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors });
    }

    try {
      await UserService.save(req.body);
      return res.send({ message: 'User created' });
    } catch (e) {
      return res.status(400).send({ validationErrors: { email: 'Email in use' } });
    }
  }
);
module.exports = router;
