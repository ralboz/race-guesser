import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Group from './Group';

interface ReminderLogAttributes {
  id: number;
  group_id: number;
  race_identifier: string;
  sent_by: string;
  recipients_count: number;
  sent_at: Date;
}

interface ReminderLogCreationAttributes extends Omit<ReminderLogAttributes, 'id' | 'sent_at'> {}

class ReminderLog extends Model<ReminderLogAttributes, ReminderLogCreationAttributes> implements ReminderLogAttributes {
  public id!: number;
  public group_id!: number;
  public race_identifier!: string;
  public sent_by!: string;
  public recipients_count!: number;
  public sent_at!: Date;
}

ReminderLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    group_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: Group, key: 'id' },
    },
    race_identifier: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sent_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    recipients_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ReminderLogs',
    timestamps: false,
  }
);

ReminderLog.belongsTo(Group, { foreignKey: 'group_id' });

export default ReminderLog;
