import express from 'express'
const router = express.Router()
import { verifyToken } from '../validator/authService.js'
import {
  createUser,
  loginUser,
} from '../controller/userController.js'
import user from '../models/userModel.js'
import obdCampaignModel from '../models/obdCampaign.js'


//render user

// Route for user Cerate-user
router.post('/user-register', async (req, res) => {
  try {
    await createUser(req, res)
  } catch (error) {
    console.error('Route error:', error)
    res.status(500).json({ message: 'Route error', error: error.message })
  }
})
// Route for user login-user
router.post('/user-login',async(req, res) => {
  try {
    await loginUser(req, res)  
  } catch (error) {
    console.error('Route error:', error)
    res.status(500).json({ message: 'Route error', error: error.message })
  }
})

router.get('/userlength', async (req, res) => {
  try {
    const totalUsersCount = await user.countDocuments()
    const resellerCount = await user.countDocuments({ role: 'reseller' })
    const usercount = await user.countDocuments({ role: 'user' })
    res.json({
      length: totalUsersCount,
      reseller: resellerCount,
      userList: usercount
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/userList', async (req, res) => {
  try {
    const usersList = await user.find({})
    res.json(usersList)
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/user-campaigns', async (req, res) => {
  try {
    const token = req.headers.authorization
    const { UserRole, UserId } = verifyToken(token)
    // const userId = req.query.userId;  
    const userCampaigns = await obdCampaignModel.find( {createdBy:UserId}).select("-audio.data");
    if (!userCampaigns) {
      return res.status(404).json({ message: 'User Campaign not found' });
    }
    res.json(userCampaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.put("/update_credits", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { UserId } = verifyToken(token);
    const { userId, credits } = req.body;

    if (!userId || !credits) {
      return res.status(400).json({ error: 'userId and credits are required in the request body' });
    }

    const requester = await user.findById(UserId);
    const userToUpdate = await user.findById(userId);

    if (!requester || !userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (requester.role === 'admin') {
      // Admin can give unlimited credits
      userToUpdate.credits += credits;
    } else if (requester.role === 'reseller') {
      if (credits > requester.credits) {
        return res.status(400).json({ error: 'Insufficient credits for the reseller' });
      }
      requester.credits -= credits;
      userToUpdate.credits += credits;
    }

    await Promise.all([requester.save(), userToUpdate.save()]);
    res.json({ message: 'Credits updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.put("/reverse_credit_transfer", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { UserId, UserRole } = verifyToken(token);
    const { userId, credits } = req.body;

    if (!userId || !credits) {
      return res.status(400).json({ error: 'userId and credits are required in the request body' });
    }

    const requester = await user.findById(UserId);
    const userToUpdate = await user.findById(userId);

    if (!requester || !userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (requester.role === 'admin' || (requester.role === 'reseller' && requester._id.equals(userToUpdate.createdBy))) {
      // Only allow the sender or an admin to reverse the credit transfer
      userToUpdate.credits -= credits;

      if (userToUpdate.credits < 0) {
        return res.status(400).json({ error: 'Cannot reverse more credits than the user has' });
      }

      requester.credits += credits;
      await Promise.all([requester.save(), userToUpdate.save()]);
      res.json({ message: 'Credit transfer reversed successfully' });
    } else {
      return res.status(403).json({ error: 'Unauthorized. You do not have permission to reverse credit transfers.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






router.get('/users/:id', async (req, res) => {
  try {
    const user = await user.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await user.findByIdAndDelete(req.params.id)
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
