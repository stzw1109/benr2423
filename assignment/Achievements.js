async function addAchievement(user, achievement) {
  let result1 = await db
    .collection("players")
    .findOne({ player_id: user }, { $addToSet: { achievements: achievement } });

  if (result1) {
  }
}

module.exports = {
  addAchievement,
};
