import { NextResponse } from 'next/server';
import { db } from '@/core/db/client';
import { tasks } from '@/core/db/schema';
import { upsertTaskVector } from '@/modules/rag/sync';
import { getQdrantClient, ensureCollection, COLLECTION_NAME } from '@/modules/rag/qdrant';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    await ensureCollection();
    const client = getQdrantClient();

    // Skip if already synced (unless ?force=true)
    if (!force) {
      const collectionInfo = await client.getCollection(COLLECTION_NAME);
      const pointCount = collectionInfo.points_count ?? 0;
      const allTasks = await db.select().from(tasks);

      if (pointCount >= allTasks.length && allTasks.length > 0) {
        return NextResponse.json({
          message: 'Already synced, skipping backfill',
          total: allTasks.length,
          synced: pointCount,
          skipped: true,
        });
      }
    }

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
