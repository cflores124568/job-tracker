const authService = require('../services/authService');

class AuthController{
  //Register a new user
  //POST /api/auth/register
  async register(req, res){
    try{
      const {firstName, lastName, email, password, currentTitle, targetSalary, location, skills, industry, jobPreferences} = req.body;
      // Basic validation
      if(!firstName || !lastName || !email || !password){
        return res.status(400).json({
          success: false,
          message: 'First name, last name, email, and password are required'
        });
      }
      //Call auth service
      const result = await authService.register({
        firstName,
        lastName,
        email,
        password,
        currentTitle,
        targetSalary,
        location,
        skills,
        industry,
        jobPreferences
      });

      //Set token in cookie for additional security
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json(result);

    }catch(error){
      console.error('Registration error:', error);
      
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }
  //Login user
  //POST /api/auth/login
  async login(req, res){
    try{
      const {email, password} = req.body;
      if(!email || !password){
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      const result = await authService.login(email, password);
      //Set token in cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.status(200).json(result);
    }catch(error){
      console.error('Login error:', error);
      //Don't reveal too much information for security
      const message = error.message.includes('Invalid email or password') 
        ? 'Invalid email or password'
        : 'Login failed';
      res.status(401).json({
        success: false,
        message
      });
    }
  }
  //Logout user
  //POST /api/auth/logout
  async logout(req, res){
    try{
      //Clear token cookie
      res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0) //Expires immediately
      });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }catch(error){
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
  //Get current user profile
  //GET /api/auth/me
  //Requires authentication middleware
  async getMe(req, res){
    try{
      //req.user is set by auth middleware
      const result = await authService.getUserProfile(req.user.id);
      res.status(200).json(result);
    }catch(error){
      console.error('Get profile error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found'
      });
    }
  }
  //Update user profile
  //PUT /api/auth/profile
  //Requires authentication middleware
  async updateProfile(req, res){
    try{
      const userId = req.user.id;
      const updateData = req.body;
      //Remove fields that shouldn't be updated via this endpoint
      const {password, email, isActive, isEmailVerified, ...safeUpdateData} = updateData;
      const result = await authService.updateProfile(userId, safeUpdateData);
      res.status(200).json(result);
    }catch(error){
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Profile update failed'
      });
    }
  }
  //Change password
  //PUT /api/auth/change-password
  //Requires authentication middleware
  async changePassword(req, res){
    try{
      const {currentPassword, newPassword, confirmPassword} = req.body;
      const userId = req.user.id;

      if(!currentPassword || !newPassword || !confirmPassword){
        return res.status(400).json({
          success: false,
          message: 'Current password, new password, and confirmation are required'
        });
      }

      if(newPassword !== confirmPassword){
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match'
        });
      }

      if(newPassword.length < 8){
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json(result);
    }catch(error){
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed'
      });
    }
  }
  //Request password reset
  //POST /api/auth/request-password-reset
  async requestPasswordReset(req, res){
    try{
      const {email} = req.body;

      if(!email){
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }
      const User = require('../models/User');
      const user = await User.findOne({email: email.toLowerCase()});
      //Always return success for security without revealing email
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      if(!user){
        return;
      }
      //Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // TODO: Send email with reset link
      // For now, log the token (in production, send via email service)
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: ${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`);

    }catch(error){
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed'
      });
    }
  }
  //Reset password with token
  //POST /api/auth/reset-password
  async resetPassword(req, res){
    try{
      const {resetPasswordToken, newPassword, confirmPassword} = req.body;

      if(!resetPasswordToken || !newPassword || !confirmPassword){
        return res.status(400).json({
          success: false,
          message: 'Reset token, new password, and confirmation are required'
        });
      }

      if(newPassword !== confirmPassword){
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match'
        });
      }

      const User = require('../models/User');
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
      });

      if(!user){
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }
      //Update password and clear reset token
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    }catch(error){
      console.error('Password reset error:', error);
      res.status(400).json({
        success: false,
        message: 'Password reset failed'
      });
    }
  }
  //Send email verification
  //POST /api/auth/send-verification-email
  async sendVerificationEmail(req, res){
    try{
      const User = require('../models/User');
      const user = await User.findById(req.user.id);

      if(!user){
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if(user.isEmailVerified){
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }
      //Generate verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      // TODO: Send email with verification link
      // For now, log the token (in production, send via email service)
      console.log(`Email verification token for ${user.email}: ${verificationToken}`);
      console.log(`Verification link: ${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`);

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });

    }catch(error){
      console.error('Send verification email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  }
  //Verify email with token
  //POST /api/auth/verify-email
  async verifyEmail(req, res){
    try{
      const {token} = req.body;

      if(!token){
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }
      const User = require('../models/User');
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpire: {$gt: Date.now()}
      });

      if(!user){
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }
      //Mark email as verified and clear token
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    }catch(error){
      console.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  }
  //Refresh JWT token
  //POST /api/auth/refresh
  async refreshToken(req, res){
    try{
      const userId = req.user.id;
      //Get user and generate new token
      const userResult = await authService.getUserProfile(userId);
      
      if(!userResult.success){
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      //Generate new token (assuming the user model has this method)
      const User = require('../models/User');
      const user = await User.findById(userId);
      const newToken = user.generateAuthToken();

      //Set new token in cookie
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        token: newToken,
        user: userResult.user
      });
    }catch(error){
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }
  //Validate token (for frontend to check if user is still authenticated)
  //GET /api/auth/validate
  async validateToken(req, res){
    try{
      //If we reach here, the auth middleware has already validated the token
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        user: {
          id: req.user.id,
          email: req.user.email
        }
      });
    }catch(error){
      res.status(401).json({
        success: false,
        message: 'Token validation failed'
      });
    }
  }
}
module.exports = new AuthController();