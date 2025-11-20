/**
 * Migration Script: Fix Status Constraint
 * Run this with: node run_migration.js
 */

const pool = require("../config/db");

async function runMigration() {
  console.log("=====================================");
  console.log("Status Constraint Fix Migration");
  console.log("=====================================\n");

  try {
    console.log("🔍 Checking current constraint...");
    
    // Check if constraint exists
    const checkConstraint = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'status_format_check'
    `);
    
    if (checkConstraint.rows.length > 0) {
      console.log("✓ Current constraint found:");
      console.log(`  ${checkConstraint.rows[0].definition}\n`);
    }

    console.log("🔧 Dropping old constraint...");
    await pool.query(`
      ALTER TABLE leads 
      DROP CONSTRAINT IF EXISTS status_format_check
    `);
    console.log("✓ Old constraint dropped\n");

    console.log("🔨 Adding updated constraint with all statuses...");
    await pool.query(`
      ALTER TABLE leads
      ADD CONSTRAINT status_format_check CHECK (
        status IN (
          'enquiry',
          'prospect',
          'enrollment',
          'trainingprogress',
          'handsonproject',
          'certification',
          'cvbuild',
          'mockinterviews',
          'liveinterviews',
          'placement',
          'placementdue',
          'placementpaid',
          'finishers',
          'onhold',
          'archived'
        )
      )
    `);
    console.log("✓ New constraint added\n");

    // Verify the new constraint
    const verifyConstraint = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'status_format_check'
    `);

    console.log("✅ Migration completed successfully!");
    console.log("\n📋 New constraint definition:");
    console.log(`  ${verifyConstraint.rows[0].definition}\n`);

    console.log("📝 Supported status values:");
    const statuses = [
      "enquiry", "prospect", "enrollment", "trainingprogress",
      "handsonproject", "certification", "cvbuild", "mockinterviews",
      "liveinterviews", "placement", "placementdue", "placementpaid",
      "finishers", "onhold", "archived"
    ];
    statuses.forEach(s => console.log(`  - ${s}`));
    
    console.log("\n🎉 You can now archive leads without errors!");

  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);
    console.error("\nError details:", error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\n✓ Database connection closed");
  }
}

// Run the migration
runMigration();

