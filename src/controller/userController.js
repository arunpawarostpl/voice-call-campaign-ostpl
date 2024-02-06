import { verifyToken, generateToken } from '../validator/authService.js'
// import bcrypt from 'bcrypt'

import user from '../models/userModel.js'
async function createUser (req, res) {
  const token = req.headers.authorization
  const {
    username,
    mobileNumber,
    email,
    password,
    state,
    city,
    role,
    cutting_percentage,
    credits,
  } = req.body
  try {
    const { UserRole,UserId } = await verifyToken(token)
      if (UserRole === 'user') {
        return console.error(
          'You Dont have permission Please contact the Reseller'
        )
      }
    
if(!cutting_percentage){
const findCutting= await user.find({_id:UserId})
const cutting=findCutting[0].cutting_percentage

const savedUser = new user({
  username,
  mobileNumber,
  email,
  password,
  state,
  city,
  role,
  cutting_percentage:cutting,
  credits,
  createdBy:UserId
})
const newUser = await savedUser.save()
console.log(newUser);
res.status(201).json(newUser)
}else{
  const savedUser = new user({
    username,
    mobileNumber,
    email,
    password,
    state,
    city,
    role,
    cutting_percentage,
    credits,
    createdBy:UserId,
  })
  const newUser = await savedUser.save()
  console.log(newUser);
  res.status(201).json(newUser)
}
  } catch (error) {
    res
      .status(500)
      .json({ message: 'User creation failed', error: error.message })
  }
}

async function loginUser (req, res) {
  const { username, password } = req.body
  try {
    const User = await user.findOne({
      username: username,
      password: password
    })
    const userDetails= User
    if (!User) {

      throw new Error('User not found')
    }
    return res.send({ token: generateToken(User), role:userDetails.role })
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
}

async function GetUserList (req, res) {
  try {
    const arrlist = []
    const usersList = await user.find({})
    return res.json(usersList)
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export { createUser, loginUser, GetUserList }
