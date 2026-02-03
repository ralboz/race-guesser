import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Group from './Group';

interface GroupMemberAttributes {
  id: number;
  user_id: string;
  group_id: number;
  created_at: Date;
  updated_at: Date;
  Group?: Group;
}

interface GroupMemberCreationAttributes extends Omit<GroupMemberAttributes, 'id' | 'created_at' | 'updated_at'> {}

class GroupMember extends Model<GroupMemberAttributes, GroupMemberCreationAttributes> implements GroupMemberAttributes {
  public id!: number;
  public user_id!: string;
  public group_id!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public Group?: Group;
}

GroupMember.init(
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
    tableName: 'GroupMembers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define associations
GroupMember.belongsTo(Group, { foreignKey: 'group_id' });
Group.hasMany(GroupMember, { foreignKey: 'group_id' });

export default GroupMember;
