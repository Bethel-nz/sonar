import { sql } from 'drizzle-orm';
import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

export async function up(db: any) {
  await db.alterTable('workflows')
    .addColumn('description', text('description'))
    .addColumn('project_link', varchar('project_link', { length: 255 }))
    .addColumn('github_url', varchar('github_url', { length: 255 }))
    .execute();
}

export async function down(db: any) {
  await db.alterTable('workflows')
    .dropColumn('description')
    .dropColumn('project_link')
    .dropColumn('github_url')
    .execute();
} 