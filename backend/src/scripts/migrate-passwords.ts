import sequelize from '../config/database';
import Group from '../models/Group';
import { hashPassword } from '../utils/password';
import { Op } from 'sequelize';

//run npx ts-node .\src\scripts\migrate-passwords.ts if ever needed again
async function migratePasswords(): Promise<void> {
  console.log('Starting password migration...');

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const groups = await Group.findAll({
      where: {
        password: {
          [Op.ne]: null as any,
          [Op.notLike]: '$2b$%',
        },
      },
    });

    console.log(`Found ${groups.length} group(s) with plain text passwords.`);

    if (groups.length === 0) {
      console.log('No migration needed. All passwords are already hashed.');
      return;
    }

    let migrated = 0;
    let errors = 0;

    for (const group of groups) {
      try {
        const hashed = await hashPassword(group.password!);
        await group.update({ password: hashed });
        migrated++;
        console.log(`  Migrated group ${group.id} ("${group.group_name}")`);
      } catch (err) {
        errors++;
        console.error(`  Failed to migrate group ${group.id}:`, err);
      }
    }

    console.log(`\nMigration complete: ${migrated} migrated, ${errors} error(s).`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migratePasswords();
