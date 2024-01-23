import express from 'express'
const router = express.Router()
import {
  createUser,
  loginUser,
  GetUserList
} from '../controller/userController.js'
import user from '../models/userModel.js'

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
router.post('/user-login', async (req, res) => {
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
    // console.log('Users Count:', usersCount)
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
    // const username = usersList.map(user => user.username)
    // const userRole = usersList.map(role => role.role)
    // console.log(username, userRole)
    res.json(usersList)
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

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
