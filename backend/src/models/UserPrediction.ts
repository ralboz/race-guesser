import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Group from './Group';

type PositionType = 'pole' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';

interface UserPredictionAttributes {
  id: number;
  user_id: string;
  group_id: number;
  race_identifier: string;
  position_type: PositionType;
  driver_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserPredictionCreationAttributes extends Omit<UserPredictionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class UserPrediction extends Model<UserPredictionAttributes, UserPredictionCreationAttributes> implements UserPredictionAttributes {
  public id!: number;
  public user_id!: string;
  public group_id!: number;
  public race_identifier!: string;
  public position_type!: PositionType;
  public driver_name!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

UserPrediction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Group,
        key: 'id'
      }
    },
    race_identifier: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    position_type: {
      type: DataTypes.ENUM('pole', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'),
      allowNull: false
    },
    driver_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'UserPredictions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define associations
UserPrediction.belongsTo(Group, { foreignKey: 'group_id' });
Group.hasMany(UserPrediction, { foreignKey: 'group_id' });

export default UserPrediction;