'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('RaceLineupChanges')) return;

    await queryInterface.createTable('RaceLineupChanges', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      // Race where the change starts to apply
      race_identifier: { type: Sequelize.STRING(100), allowNull: false },
      // 'race' = this race only, 'onward' = this race and every later race
      scope: { type: Sequelize.ENUM('race', 'onward'), allowNull: false },
      replaced_driver_name: { type: Sequelize.STRING(100), allowNull: false },
      new_driver_name: { type: Sequelize.STRING(100), allowNull: false },
      new_driver_number: { type: Sequelize.INTEGER, allowNull: false },
      new_driver_code: { type: Sequelize.STRING(3), allowNull: false },
      new_driver_team: { type: Sequelize.STRING(100), allowNull: false },
      // Audit: how many stored rows were renamed when the change was applied
      predictions_rewritten: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      results_rewritten: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      scores_rewritten: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.STRING(255), allowNull: false },
      reverted_at: { type: Sequelize.DATE, allowNull: true },
      reverted_by: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('RaceLineupChanges', ['race_identifier'], {
      name: 'idx_lineup_changes_race',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('RaceLineupChanges');
  },
};
