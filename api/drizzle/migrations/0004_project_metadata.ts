import { sql } from 'drizzle-orm';
import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

export async function up(db: any) {
  // First check if columns exist to avoid collision
  const checkColumns = await db.query(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name IN ('description', 'project_url', 'github_url')
  `);

  const existingColumns = checkColumns.rows.map((row: any) => row.column_name);

  // Only add columns that don't exist
  const alterTableQueries = [];
  
  if (!existingColumns.includes('description')) {
    alterTableQueries.push(sql`ADD COLUMN description TEXT`);
  }
  
  if (!existingColumns.includes('project_url')) {
    alterTableQueries.push(sql`ADD COLUMN project_url VARCHAR(255)`);
  }
  
  if (!existingColumns.includes('github_url')) {
    alterTableQueries.push(sql`ADD COLUMN github_url VARCHAR(255)`);
  }

  if (alterTableQueries.length > 0) {
    await db.query(sql`
      ALTER TABLE projects 
      ${sql.join(alterTableQueries, sql`, `)}
    `);
  }
}

export async function down(db: any) {
  // First check if columns exist before trying to drop them
  const checkColumns = await db.query(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name IN ('description', 'project_url', 'github_url')
  `);

  const existingColumns = checkColumns.rows.map((row: any) => row.column_name);

  // Only drop columns that exist
  const dropColumnQueries = [];
  
  if (existingColumns.includes('description')) {
    dropColumnQueries.push(sql`DROP COLUMN description`);
  }
  
  if (existingColumns.includes('project_url')) {
    dropColumnQueries.push(sql`DROP COLUMN project_url`);
  }
  
  if (existingColumns.includes('github_url')) {
    dropColumnQueries.push(sql`DROP COLUMN github_url`);
  }

  if (dropColumnQueries.length > 0) {
    await db.query(sql`
      ALTER TABLE projects 
      ${sql.join(dropColumnQueries, sql`, `)}
    `);
  }
} 