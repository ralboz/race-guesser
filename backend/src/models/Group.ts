import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface GroupAttributes {
  id: number;
  group_name: string;
  group_type: 'public' | 'private';
  owner_id: string;
  password?: string;
}

interface GroupCreationAttributes {
  id?: number;
  group_name: string;
  group_type: 'public' | 'private';
  owner_id: string;
  password?: string;
}

class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
  public id!: number;
  public group_name!: string;
  public group_type!: 'public' | 'private';
  public owner_id!: string;
  public password?: string;
}

Group.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: false
    },
    group_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    group_type: {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: false,
      defaultValue: 'private'
    },
    owner_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'Groups',
    timestamps: false
  }
);

export default Group;
