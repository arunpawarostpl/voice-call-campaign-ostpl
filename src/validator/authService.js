import jwt from 'jsonwebtoken'

const secretKey = "sdsaaas" // Replace with your actual secret key
const tokenExpiration = '10h' // Token expiration time

// Function to generate JWT token
function generateToken (_id, role) {
  return jwt.sign({ _id, role }, secretKey
    , { expiresIn: tokenExpiration })
}

// Function to verify JWT token
function verifyToken (token) {
  try {
    
    const decodedToken = jwt.verify(token, secretKey)
    if (decodedToken) {
      const { _id, role } = decodedToken
      const UserRole = _id.role
      const UserId = _id._id
      return { UserRole, UserId }
    }
    return error
  } catch (error) {
    return null
  }
}

export { generateToken, verifyToken }
