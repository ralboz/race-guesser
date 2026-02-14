import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Group from './Group';

interface UserRaceScoreAttributes {
    id: number;
    user_id: string;
    group_id: number;
    race_identifier: string;

    total_points: number;
    exact_hits: number;
    near_hits: number;
    unique_correct_hits: number;

    computed_at: Date;
}

export interface UserRaceScoreCreationAttributes
    extends Omit<UserRaceScoreAttributes, 'id' | 'computed_at'> {
    computed_at?: Date;
}

class UserRaceScore
    extends Model<UserRaceScoreAttributes, UserRaceScoreCreationAttributes>
    implements UserRaceScoreAttributes
{
    public id!: number;
    public user_id!: string;
    public group_id!: number;
    public race_identifier!: string;

    public total_points!: number;
    public exact_hits!: number;
    public near_hits!: number;
    public unique_correct_hits!: number;

    public computed_at!: Date;
}

UserRaceScore.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        group_id: {
            type: DataTypes.BIGINT,
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

        total_points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        exact_hits: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        near_hits: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        unique_correct_hits: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },

        computed_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'UserRaceScores',
        timestamps: false,
        indexes: [
            {
                unique: true,
                name: 'uq_user_race',
                fields: ['group_id', 'user_id', 'race_identifier'] // composite unique index via indexes[] [web:51]
            },
            {
                name: 'idx_leaderboard_race',
                fields: ['group_id', 'race_identifier', 'total_points']
            }
        ]
    }
);

UserRaceScore.belongsTo(Group, { foreignKey: 'group_id' });

export default UserRaceScore;
