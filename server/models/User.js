const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  //Basic user information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
    validate: {
        validator: function(password){
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
        },
        message: 'Password should contain at least one uppercase/lowercase letter and a number'
    },
    select: false 
  },
  
  //Profile information for job tracking
  currentTitle: {
    type: String,
    trim: true,
    maxLength: [100, 'Current title cannot exceed 100 characters']
  },
  targetSalary: {
    type: Number,
    min: [0, 'Target salary cannot be negative']
  },
  location: {
    type: String,
    trim: true,
    maxLength: [100, 'Location cannot exceed 100 characters']
  },
  jobPreferences: {
    workType: {
      type: String,
      enum: ['Remote', 'Onsite', 'Hybrid', 'No preference'],
      default: 'No preference'
    }
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'No preference'],
    default: 'Full-time'
  },
  
  //Account settings
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  //Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  //Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true 
});

//Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try{
    //Hash password with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }catch(error){
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
//Generate JWT token
userSchema.methods.generateAuthToken = function() {
    if(!process.env.JWT_SECRET){
        throw new Error('JWT_SECRET is not defined in your environment variables');
    }
  return jwt.sign(
    { 
      id: this._id,
      email: this.email 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d' 
    }
  );
};
//Get user data without sensitive info
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpire;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};
//Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
//Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);