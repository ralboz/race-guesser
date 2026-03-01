'use strict';

const POSITION_ENUM = ['pole', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Groups (no FK deps — created first)
    await queryInterface.createTable('Groups', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: false,
      },
      group_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      group_type: {
        type: Sequelize.ENUM('public', 'private'),
        allowNull: false,
        defaultValue: 'private',
      },
      owner_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });

    // 2. UserProfiles (no FK deps)
    await queryInterface.createTable('UserProfiles', {
      user_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 3. GroupMembers (FK → Groups)
    await queryInterface.createTable('GroupMembers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 4. UserPredictions (FK → Groups)
    await queryInterface.createTable('UserPredictions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
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
      position_type: {
        type: Sequelize.ENUM(...POSITION_ENUM),
        allowNull: false,
      },
      driver_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 5. RaceResults (no FK deps)
    await queryInterface.createTable('RaceResults', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      race_identifier: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      position_type: {
        type: Sequelize.ENUM(...POSITION_ENUM),
        allowNull: false,
      },
      driver_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('RaceResults', ['race_identifier', 'position_type'], {
      unique: true,
      name: 'uq_race_pos',
    });

    // 6. PredictionScores (FK → UserPredictions, Groups)
    await queryInterface.createTable('PredictionScores', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      prediction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserPredictions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      group_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      race_identifier: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      position_type: {
        type: Sequelize.ENUM(...POSITION_ENUM),
        allowNull: false,
      },
      predicted_driver_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      actual_driver_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      base_points: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      unique_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      final_points: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      computed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('PredictionScores', ['group_id', 'user_id', 'race_identifier', 'position_type'], {
      unique: true,
      name: 'uq_user_race_pos',
    });
    await queryInterface.addIndex('PredictionScores', ['group_id', 'race_identifier'], {
      name: 'idx_group_race',
    });
    await queryInterface.addIndex('PredictionScores', ['group_id', 'user_id'], {
      name: 'idx_group_user',
    });

    // 7. UserRaceScores (FK → Groups)
    await queryInterface.createTable('UserRaceScores', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      group_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      race_identifier: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      total_points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      exact_hits: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      near_hits: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      unique_correct_hits: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      computed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('UserRaceScores', ['group_id', 'user_id', 'race_identifier'], {
      unique: true,
      name: 'uq_user_race',
    });
    await queryInterface.addIndex('UserRaceScores', ['group_id', 'race_identifier', 'total_points'], {
      name: 'idx_leaderboard_race',
    });

    // 8. SequelizeMeta is created automatically by sequelize-cli
  },

  async down(queryInterface) {
    // Drop in reverse order to respect FK constraints
    await queryInterface.dropTable('UserRaceScores');
    await queryInterface.dropTable('PredictionScores');
    await queryInterface.dropTable('RaceResults');
    await queryInterface.dropTable('UserPredictions');
    await queryInterface.dropTable('GroupMembers');
    await queryInterface.dropTable('UserProfiles');
    await queryInterface.dropTable('Groups');
  },
};
