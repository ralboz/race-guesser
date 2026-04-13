import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface UserProfileAttributes {
  user_id: string;
  display_name: string;
  email_notifications: boolean;
  updated_at: Date;
}

interface UserProfileCreationAttributes {
  user_id: string;
  display_name: string;
  email_notifications?: boolean;
  updated_at?: Date;
}

class UserProfile extends Model<UserProfileAttributes, UserProfileCreationAttributes> implements UserProfileAttributes {
  public user_id!: string;
  public display_name!: string;
  public email_notifications!: boolean;
  public updated_at!: Date;
}

UserProfile.init(
  {
    user_id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'UserProfiles',
    timestamps: false
  }
);

export default UserProfile;
