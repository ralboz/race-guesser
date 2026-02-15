import sequelize from '../config/database';
import Group from './Group';
import UserPrediction from './UserPrediction';
import GroupMember from './GroupMember';
import UserProfile from './UserProfile';

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export { sequelize, Group, UserPrediction, GroupMember, UserProfile, initializeDatabase };
