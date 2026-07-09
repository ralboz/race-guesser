'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('UserProfiles');
    if (!tableDesc.results_email_opt_out) {
      await queryInterface.addColumn('UserProfiles', 'results_email_opt_out', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('UserProfiles', 'results_email_opt_out');
  },
};
