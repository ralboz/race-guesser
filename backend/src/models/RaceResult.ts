import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export type PositionType =
    | 'pole'
    | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';

interface RaceResultAttributes {
    id: number;
    race_identifier: string;
    position_type: PositionType;
    driver_name: string;
    created_at: Date;
    updated_at: Date;
}

export interface RaceResultCreationAttributes
    extends Omit<RaceResultAttributes, 'id' | 'created_at' | 'updated_at'> {}

class RaceResult
    extends Model<RaceResultAttributes, RaceResultCreationAttributes>
    implements RaceResultAttributes
{
    public id!: number;
    public race_identifier!: string;
    public position_type!: PositionType;
    public driver_name!: string;
    public created_at!: Date;
    public updated_at!: Date;
}

RaceResult.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
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
        tableName: 'RaceResults',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                name: 'uq_race_pos',
                fields: ['race_identifier', 'position_type'] // enforce one result per slot
            }
        ]
    }
);

export default RaceResult;
