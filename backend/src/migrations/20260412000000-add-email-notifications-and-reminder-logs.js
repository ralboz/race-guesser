'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add email_notifications column to UserProfiles (handle partial re-run)
    const tableDesc = await queryInterface.describeTable('UserProfiles');
    if (!tableDesc.email_notifications) {
      await queryInterface.addColumn('UserProfiles', 'email_notifications', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Create ReminderLogs table to enforce one reminder per race per group
    // Use BIGINT.UNSIGNED to match Groups.id which MySQL stores as unsigned
    await queryInterface.createTable('ReminderLogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      race_identifier: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      sent_by: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      recipients_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ReminderLogs', ['group_id', 'race_identifier'], {
      unique: true,
      name: 'uq_group_race_reminder',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReminderLogs');
    await queryInterface.removeColumn('UserProfiles', 'email_notifications');
  },
};
