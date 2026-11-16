import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { buildTemplateWorkbook } from '@/lib/excelImport';

export async function GET() {
  await requireSession();
  const buffer = await buildTemplateWorkbook();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="marketingos-import-template.xlsx"',
    },
  });
}
