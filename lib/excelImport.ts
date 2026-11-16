import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import type { Priority } from '@prisma/client';

export const IMPORT_COLUMNS = [
  { key: 'projectName', header: 'Project Name*', required: true },
  { key: 'projectOwnerEmail', header: 'Project Owner Email*', required: true },
  { key: 'projectDeadline', header: 'Project Deadline', required: false },
  { key: 'projectPriority', header: 'Project Priority', required: false },
  { key: 'taskTitle', header: 'Task Title*', required: true },
  { key: 'taskOwnerEmail', header: 'Task Owner Email*', required: true },
  { key: 'taskReviewerEmail', header: 'Task Reviewer Email*', required: true },
  { key: 'taskDueDate', header: 'Task Due Date', required: false },
  { key: 'taskPriority', header: 'Task Priority', required: false },
] as const;

type ColumnKey = (typeof IMPORT_COLUMNS)[number]['key'];

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export type ParsedTaskRow = {
  rowNumber: number;
  title: string;
  ownerEmail: string;
  ownerId: string | null;
  reviewerEmail: string;
  reviewerId: string | null;
  dueDate: Date | null;
  priority: Priority;
  skipReason: string | null;
};

export type ParsedProjectGroup = {
  projectName: string;
  ownerEmail: string;
  ownerId: string | null;
  deadline: Date | null;
  priority: Priority;
  existingProjectId: string | null;
  tasks: ParsedTaskRow[];
  skipReason: string | null;
};

export type ParseResult = { ok: false; hardError: string } | { ok: true; groups: ParsedProjectGroup[] };

export async function buildTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Projects & Tasks');
  sheet.columns = IMPORT_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 26 }));
  sheet.getRow(1).font = { bold: true };

  sheet.addRow({
    projectName: 'Q4 Product Launch',
    projectOwnerEmail: 'manager@example.com',
    projectDeadline: '2026-12-01',
    projectPriority: 'HIGH',
    taskTitle: 'Draft launch announcement',
    taskOwnerEmail: 'alex@example.com',
    taskReviewerEmail: 'manager@example.com',
    taskDueDate: '2026-11-15',
    taskPriority: 'HIGH',
  });
  sheet.addRow({
    projectName: 'Q4 Product Launch',
    projectOwnerEmail: 'manager@example.com',
    taskTitle: 'Design launch graphics',
    taskOwnerEmail: 'priya@example.com',
    taskReviewerEmail: 'manager@example.com',
    taskDueDate: '2026-11-20',
    taskPriority: 'MEDIUM',
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('text' in v && typeof v.text === 'string') return v.text;
    if ('result' in v && v.result != null) return String(v.result);
    if ('richText' in v && Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('');
  }
  return String(v).trim();
}

function cellDate(cell: ExcelJS.Cell): Date | null {
  const v = cell.value;
  if (v instanceof Date) return v;
  const text = cellText(cell);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizePriority(cell: ExcelJS.Cell): Priority {
  const text = cellText(cell).trim().toUpperCase();
  return (PRIORITIES as string[]).includes(text) ? (text as Priority) : 'MEDIUM';
}

export async function parseImportWorkbook(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's bundled types predate @types/node's generic Buffer<TArrayBuffer> — safe runtime cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
  } catch {
    return { ok: false, hardError: 'Could not read this file. Please upload a .xlsx file exported from the template.' };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return { ok: false, hardError: 'The uploaded file has no sheets.' };

  const headerRow = sheet.getRow(1);
  const columnIndex = new Map<ColumnKey, number>();
  headerRow.eachCell((cell, colNumber) => {
    const text = cellText(cell).trim().toLowerCase();
    const match = IMPORT_COLUMNS.find((c) => c.header.toLowerCase() === text);
    if (match) columnIndex.set(match.key, colNumber);
  });

  const missing = IMPORT_COLUMNS.filter((c) => c.required && !columnIndex.has(c.key));
  if (missing.length > 0) {
    return {
      ok: false,
      hardError: `Missing required column(s): ${missing.map((c) => c.header).join(', ')}. Please use the downloaded template and don't rename the header row.`,
    };
  }

  const get = (row: ExcelJS.Row, key: ColumnKey): ExcelJS.Cell | null => {
    const idx = columnIndex.get(key);
    return idx ? row.getCell(idx) : null;
  };

  type RawRow = {
    rowNumber: number;
    projectName: string;
    projectOwnerEmail: string;
    projectDeadline: Date | null;
    projectPriority: Priority;
    taskTitle: string;
    taskOwnerEmail: string;
    taskReviewerEmail: string;
    taskDueDate: Date | null;
    taskPriority: Priority;
  };

  const rawRows: RawRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const projectName = cellText(get(row, 'projectName')!);
    const taskTitle = cellText(get(row, 'taskTitle')!);
    if (!projectName && !taskTitle) return; // blank row

    rawRows.push({
      rowNumber,
      projectName,
      projectOwnerEmail: cellText(get(row, 'projectOwnerEmail')!).toLowerCase(),
      projectDeadline: cellDate(get(row, 'projectDeadline')!),
      projectPriority: normalizePriority(get(row, 'projectPriority')!),
      taskTitle,
      taskOwnerEmail: cellText(get(row, 'taskOwnerEmail')!).toLowerCase(),
      taskReviewerEmail: cellText(get(row, 'taskReviewerEmail')!).toLowerCase(),
      taskDueDate: cellDate(get(row, 'taskDueDate')!),
      taskPriority: normalizePriority(get(row, 'taskPriority')!),
    });
  });

  if (rawRows.length === 0) {
    return { ok: false, hardError: 'No data rows found below the header row.' };
  }

  const emails = new Set<string>();
  const projectNames = new Set<string>();
  for (const r of rawRows) {
    if (r.projectOwnerEmail) emails.add(r.projectOwnerEmail);
    if (r.taskOwnerEmail) emails.add(r.taskOwnerEmail);
    if (r.taskReviewerEmail) emails.add(r.taskReviewerEmail);
    if (r.projectName) projectNames.add(r.projectName.trim().toLowerCase());
  }

  const [users, existingProjects] = await Promise.all([
    prisma.user.findMany({ where: { email: { in: Array.from(emails) } } }),
    prisma.project.findMany({ where: { archived: false } }),
  ]);
  const userIdByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
  const existingProjectByName = new Map(existingProjects.map((p) => [p.name.trim().toLowerCase(), p.id]));

  const groups = new Map<string, ParsedProjectGroup>();

  for (const r of rawRows) {
    if (!r.projectName) {
      continue; // can't group a task without a project name; effectively unrecoverable, drop silently
    }
    const key = r.projectName.trim().toLowerCase();
    let group = groups.get(key);
    if (!group) {
      const existingProjectId = existingProjectByName.get(key) ?? null;
      const ownerId = userIdByEmail.get(r.projectOwnerEmail) ?? null;
      let skipReason: string | null = null;
      if (!existingProjectId) {
        if (!r.projectOwnerEmail) skipReason = 'New project is missing a Project Owner Email.';
        else if (!ownerId) skipReason = `No user found with email "${r.projectOwnerEmail}" for the project owner.`;
      }
      group = {
        projectName: r.projectName.trim(),
        ownerEmail: r.projectOwnerEmail,
        ownerId,
        deadline: r.projectDeadline,
        priority: r.projectPriority,
        existingProjectId,
        tasks: [],
        skipReason,
      };
      groups.set(key, group);
    }

    let taskSkipReason: string | null = null;
    const ownerId = userIdByEmail.get(r.taskOwnerEmail) ?? null;
    const reviewerId = userIdByEmail.get(r.taskReviewerEmail) ?? null;
    if (!r.taskTitle) taskSkipReason = 'Missing Task Title.';
    else if (!r.taskOwnerEmail) taskSkipReason = 'Missing Task Owner Email.';
    else if (!ownerId) taskSkipReason = `No user found with email "${r.taskOwnerEmail}" for the task owner.`;
    else if (!r.taskReviewerEmail) taskSkipReason = 'Missing Task Reviewer Email.';
    else if (!reviewerId) taskSkipReason = `No user found with email "${r.taskReviewerEmail}" for the task reviewer.`;
    else if (ownerId === reviewerId) taskSkipReason = 'Task owner and reviewer cannot be the same person.';

    group.tasks.push({
      rowNumber: r.rowNumber,
      title: r.taskTitle,
      ownerEmail: r.taskOwnerEmail,
      ownerId,
      reviewerEmail: r.taskReviewerEmail,
      reviewerId,
      dueDate: r.taskDueDate,
      priority: r.taskPriority,
      skipReason: taskSkipReason,
    });
  }

  return { ok: true, groups: Array.from(groups.values()) };
}
