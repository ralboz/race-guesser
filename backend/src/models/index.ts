import sequelize from '../config/database';
import Group from './Group';
import UserPrediction from './UserPrediction';
import GroupMember from './GroupMember';
import UserProfile from './UserProfile';

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    // Schema changes are handled by migrations (npx sequelize-cli db:migrate)
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export { sequelize, Group, UserPrediction, GroupMember, UserProfile, initializeDatabase };
