import { NextResponse } from 'next/server';
import { db } from '@/core/db/client';
import { tasks } from '@/core/db/schema';
import { upsertTaskVector } from '@/modules/rag/sync';

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks);

    let success = 0;
    let failed = 0;

    for (const task of allTasks) {
      try {
        await upsertTaskVector(task);
        success++;
      } catch (err) {
        console.error(`Failed to embed task ${task.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      message: 'Backfill complete',
      total: allTasks.length,
      success,
      failed,
    });
  } catch (error) {
    console.error('Backfill failed:', error);
    return NextResponse.json(
      { error: 'Backfill failed' },
      { status: 500 }
    );
  }
}
