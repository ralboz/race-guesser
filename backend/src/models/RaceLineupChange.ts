import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export type LineupChangeScope = 'race' | 'onward';

interface RaceLineupChangeAttributes {
    id: number;
    race_identifier: string;
    scope: LineupChangeScope;
    replaced_driver_name: string;
    new_driver_name: string;
    new_driver_number: number;
    new_driver_code: string;
    new_driver_team: string;
    predictions_rewritten: number;
    results_rewritten: number;
    scores_rewritten: number;
    created_by: string;
    reverted_at: Date | null;
    reverted_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface RaceLineupChangeCreationAttributes
    extends Omit<RaceLineupChangeAttributes, 'id' | 'created_at' | 'updated_at' | 'reverted_at' | 'reverted_by'> {}

/**
 * An admin-made change to the driver lineup (stand-in or mid-season swap).
 * The effective lineup for a race is the season JSON with every non-reverted
 * change applied in id order (see data/drivers.ts: applyLineupChanges).
 */
class RaceLineupChange
    extends Model<RaceLineupChangeAttributes, RaceLineupChangeCreationAttributes>
    implements RaceLineupChangeAttributes
{
    public id!: number;
    public race_identifier!: string;
    public scope!: LineupChangeScope;
    public replaced_driver_name!: string;
    public new_driver_name!: string;
    public new_driver_number!: number;
    public new_driver_code!: string;
    public new_driver_team!: string;
    public predictions_rewritten!: number;
    public results_rewritten!: number;
    public scores_rewritten!: number;
    public created_by!: string;
    public reverted_at!: Date | null;
    public reverted_by!: string | null;
    public created_at!: Date;
    public updated_at!: Date;
}

RaceLineupChange.init(
    {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        race_identifier: { type: DataTypes.STRING(100), allowNull: false },
        scope: { type: DataTypes.ENUM('race', 'onward'), allowNull: false },
        replaced_driver_name: { type: DataTypes.STRING(100), allowNull: false },
        new_driver_name: { type: DataTypes.STRING(100), allowNull: false },
        new_driver_number: { type: DataTypes.INTEGER, allowNull: false },
        new_driver_code: { type: DataTypes.STRING(3), allowNull: false },
        new_driver_team: { type: DataTypes.STRING(100), allowNull: false },
        predictions_rewritten: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        results_rewritten: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        scores_rewritten: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        created_by: { type: DataTypes.STRING(255), allowNull: false },
        reverted_at: { type: DataTypes.DATE, allowNull: true },
        reverted_by: { type: DataTypes.STRING(255), allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: 'RaceLineupChanges',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default RaceLineupChange;
