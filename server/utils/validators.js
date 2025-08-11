const { body, validationResult } = require('express-validator');
//respects fields of User.js model
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters and include one uppercase letter, one lowercase letter, and one number'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('currentTitle').optional().trim().isLength({ max: 100 }).withMessage('Current title cannot exceed 100 characters'),
  body('targetSalary').optional().isNumeric().withMessage('Target salary must be a number'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('jobPreferences.workType').optional().isIn(['Remote', 'Onsite', 'Hybrid', 'No preference']).withMessage('Invalid work type'),
  body('employmentType').optional().isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'No preference']).withMessage('Invalid employment type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters and include one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('New password and confirmation do not match'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateResetPassword = [
  body('resetPasswordToken').notEmpty().withMessage('Reset token is required'), // Changed from 'token'
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters and include one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('New password and confirmation do not match'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

//Optional: Add profile update validation
const validateUpdateProfile = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('currentTitle').optional().trim().isLength({ max: 100 }).withMessage('Current title cannot exceed 100 characters'),
  body('targetSalary').optional().isNumeric().withMessage('Target salary must be a number'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('jobPreferences.workType').optional().isIn(['Remote', 'Onsite', 'Hybrid', 'No preference']).withMessage('Invalid work type'),
  body('employmentType').optional().isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'No preference']).withMessage('Invalid employment type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateResetPassword,
  validateUpdateProfile, 
};