import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Group from './Group';
import UserPrediction from './UserPrediction';

export type PositionType =
    | 'pole'
    | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';

interface PredictionScoreAttributes {
    id: number;

    prediction_id: number;
    user_id: string;
    group_id: number;
    race_identifier: string;
    position_type: PositionType;

    predicted_driver_name: string;
    actual_driver_name: string;

    base_points: number; // 0/1/2
    unique_correct: boolean;
    final_points: number; // 0/1/2/4 due to double up for unique

    computed_at: Date;
}

export interface PredictionScoreCreationAttributes
    extends Omit<PredictionScoreAttributes, 'id' | 'computed_at'> {
    computed_at?: Date;
}

class PredictionScore
    extends Model<PredictionScoreAttributes, PredictionScoreCreationAttributes>
    implements PredictionScoreAttributes
{
    public id!: number;

    public prediction_id!: number;
    public user_id!: string;
    public group_id!: number;
    public race_identifier!: string;
    public position_type!: PositionType;

    public predicted_driver_name!: string;
    public actual_driver_name!: string;

    public base_points!: number;
    public unique_correct!: boolean;
    public final_points!: number;

    public computed_at!: Date;
}

PredictionScore.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },

        prediction_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: UserPrediction,
                key: 'id'
            }
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
        position_type: {
            type: DataTypes.ENUM('pole', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'),
            allowNull: false
        },

        predicted_driver_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        actual_driver_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        base_points: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        unique_correct: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        final_points: {
            type: DataTypes.TINYINT,
            allowNull: false
        },

        computed_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'PredictionScores',
        timestamps: false,
        indexes: [
            {
                unique: true,
                name: 'uq_user_race_pos',
                fields: ['group_id', 'user_id', 'race_identifier', 'position_type']
            },
            { name: 'idx_group_race', fields: ['group_id', 'race_identifier'] },
            { name: 'idx_group_user', fields: ['group_id', 'user_id'] }
        ]
    }
);

// Associations (optional but useful)
PredictionScore.belongsTo(UserPrediction, { foreignKey: 'prediction_id' });
PredictionScore.belongsTo(Group, { foreignKey: 'group_id' });

export default PredictionScore;
