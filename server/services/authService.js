const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  async register(userData) {
    const { firstName, lastName, email, password } = userData;
    
    try{
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if(existingUser){
        throw new Error('User with this email already exists');
      }
      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password, 
        ...userData //Include any additional fields
      });
      await user.save();
      const token = user.generateAuthToken();
      //Return user without password
      const userResponse = user.toJSON();
      
      return {
        success: true,
        message: 'User registered successfully',
        user: userResponse,
        token
      };
    }catch(error){
      //Handle mongoose validation errors
      if(error.name === 'ValidationError'){
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation failed: ${messages.join(', ')}`);
      }
      //Handle duplicate key error
      if(error.code === 11000){
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async login(email, password) {
    try{
      //Find user and include password field
      const user = await User.findOne({ 
        email: email.toLowerCase().trim() 
      }).select('+password');
      
      if(!user){
        throw new Error('Invalid email or password');
      }
      
      if(!user.isActive){
        throw new Error('Account has been deactivated. Please contact support.');
      }
      const isPasswordValid = await user.comparePassword(password);
      if(!isPasswordValid){
        throw new Error('Invalid email or password');
      }
      //Update last login
      user.lastLogin = new Date();
      await user.save();
      
      const token = user.generateAuthToken();
      // Return user without password
      const userResponse = user.toJSON();
      
      return {
        success: true,
        message: 'Login successful',
        user: userResponse,
        token
      };
      
    }catch(error){
      throw error;
    }
  }
  
  async getUserProfile(userId) {
    try{
      const user = await User.findById(userId);
      if(!user){
        throw new Error('User not found');
      }
      
      if(!user.isActive){
        throw new Error('Account has been deactivated');
      }
      return {
        success: true,
        user: user.toJSON()
      };
    }catch(error){
      throw error;
    }
  }
  
  async updateProfile(userId, updateData) {
    try{
      const { password, email, isActive, ...safeUpdateData } = updateData;
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          ...safeUpdateData,
          //Ensure strings are trimmed
          ...(safeUpdateData.firstName && { firstName: safeUpdateData.firstName.trim() }),
          ...(safeUpdateData.lastName && { lastName: safeUpdateData.lastName.trim() }),
          ...(safeUpdateData.currentTitle && { currentTitle: safeUpdateData.currentTitle.trim() }),
          ...(safeUpdateData.location && { location: safeUpdateData.location.trim() })
        },
        { 
          new: true, //Return updated document
          runValidators: true //Run mongoose validators
        }
      );
      
      if(!user){
        throw new Error('User not found');
      }
      return {
        success: true,
        message: 'Profile updated successfully',
        user: user.toJSON()
      };
    }catch(error){
      if(error.name === 'ValidationError'){
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation failed: ${messages.join(', ')}`);
      }
      throw error;
    }
  }
  //Verify JWT token
  verifyToken(token){
    try{
      return jwt.verify(token, process.env.JWT_SECRET);
    }catch(error){
      if(error.name === 'TokenExpiredError'){
        throw new Error('Token has expired');
      }
      if(error.name === 'JsonWebTokenError'){
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }
  
  async changePassword(userId, currentPassword, newPassword){
    try{
      const user = await User.findById(userId).select('+password');
      
      if(!user){
        throw new Error('User not found');
      }
      //Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if(!isCurrentPasswordValid){
        throw new Error('Current password is incorrect');
      }
      
      user.password = newPassword;
      await user.save();
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    }catch(error){
      throw error;
    }
  }
}
module.exports = new AuthService();