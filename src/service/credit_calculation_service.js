import user from "../models/userModel.js";

function calculateCreditsNeeded(duration) {
    const creditPerSecond = 1 / 15; // Assuming 1 credit per 15 seconds
    return Math.ceil(duration * creditPerSecond);
  }


  async function hasSufficientCredits(UserId, creditsNeeded) {
    const userInfo = await user.findOne({ UserId });
    return userInfo.credits >= creditsNeeded;
  }


  async function deductCreditsAndUpdateUser(UserId, creditsNeeded) {
    const userInfo = await user.findOne({ UserId });
    const updatedCredits = userInfo.credits - creditsNeeded;
  
    // Update the user's credit balance in the database
    await user.updateOne({ UserId }, { $set: { credits: updatedCredits } });
  
    return updatedCredits;
  }

  export {deductCreditsAndUpdateUser,hasSufficientCredits,calculateCreditsNeeded}