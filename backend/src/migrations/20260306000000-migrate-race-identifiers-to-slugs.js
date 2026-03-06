'use strict';

// migration for old open f1 meeting key to new race slug, only required for australia.
const OLD_ID = '1279';
const NEW_ID = 'australia-2026';

const TABLES = ['UserPredictions', 'RaceResults', 'PredictionScores', 'UserRaceScores'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.sequelize.query(
        `UPDATE \`${table}\` SET race_identifier = :newId WHERE race_identifier = :oldId`,
        { replacements: { oldId: OLD_ID, newId: NEW_ID } }
      );
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.sequelize.query(
        `UPDATE \`${table}\` SET race_identifier = :oldId WHERE race_identifier = :newId`,
        { replacements: { oldId: OLD_ID, newId: NEW_ID } }
      );
    }
  },
};
