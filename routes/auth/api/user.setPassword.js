import express from 'express';
import bcrypt from 'bcrypt';
import User from '../../../models/user.js';
import Auth from '../../../models/auth.js';


const setPasswordRouter = express.Router();

setPasswordRouter.post('/set-password', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!password || !confirmPassword || !(email)) {
      return res.status(400).json({ 
        status: false, 
        message: 'Email, password, and confirm password are required.' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        status: false, 
        message: 'Password must be at least 8 characters long.' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        status: false, 
        message: 'Passwords do not match.' 
      });
    }

    const user = await User.findOne({email });
    if (!user) {
      return res.status(404).json({ 
        status: false, 
        message: 'User not found. Please register.' 
      });
    }

 

 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    let authUser = await Auth.findOne({ email });

    if (authUser) {
    
      authUser.email = email;
      authUser.password = hashedPassword;
      await authUser.save();
      return res.status(200).json({ 
        status: true, 
        message: 'Password updated successfully.' 
      });
    } else {
   
      const newAuth = new Auth({
        email: email,
        password: hashedPassword,
      });
      await newAuth.save();
      return res.status(201).json({ 
        status: true, 
        message: 'Password created successfully.' 
      });
    }
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).json({ 
      status: false, 
      message: 'An error occurred while setting the password.' 
    });
  }
});

export default setPasswordRouter;
