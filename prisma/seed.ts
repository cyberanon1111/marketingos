import { PrismaClient, Priority, TaskStatus, ProjectStage, DeliverableType, ReviewActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: { email: 'manager@example.com', name: 'Morgan Reyes', role: 'MANAGER' },
  });

  const members = await Promise.all(
    [
      { email: 'alex@example.com', name: 'Alex Chen' },
      { email: 'priya@example.com', name: 'Priya Nair' },
      { email: 'sam@example.com', name: 'Sam Okafor' },
    ].map((m) =>
      prisma.user.upsert({ where: { email: m.email }, update: {}, create: { ...m, role: 'MEMBER' } })
    )
  );
  const [alex, priya, sam] = members;

  const campaign = await prisma.campaign.create({
    data: {
      name: 'Q3 VDR Intelligence Launch',
      objective: 'Drive demo requests for the VDR Intelligence Scorecard',
      businessGoal: 'Generate 50 qualified SQLs for the maritime vertical',
      targetAudience: 'DPAs and Marine Managers at shipmanagement companies',
      channels: ['LinkedIn', 'Email', 'Newsletter'],
      ownerId: manager.id,
      budget: 15000,
      launchDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      successMetrics: '50 SQLs, 12% email CTR, 500 scorecard completions',
    },
  });

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Product Newsletter — Issue 2',
        description: '4-part newsletter series on the 15-day cadence',
        businessGoal: 'Nurture Marine Manager / DPA ICP toward demo requests',
        campaignType: 'Newsletter',
        priority: Priority.HIGH,
        ownerId: manager.id,
        campaignId: campaign.id,
        startDate: new Date(),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        stage: ProjectStage.EXECUTION,
      },
    }),
    prisma.project.create({
      data: {
        name: 'VDR Scorecard LinkedIn Push',
        description: 'Three-post LinkedIn sequence promoting the scorecard',
        businessGoal: 'Top-of-funnel awareness for VDR Intelligence',
        campaignType: 'Social',
        priority: Priority.MEDIUM,
        ownerId: manager.id,
        campaignId: campaign.id,
        startDate: new Date(),
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        stage: ProjectStage.INTERNAL_REVIEW,
      },
    }),
    prisma.project.create({
      data: {
        name: 'SIRE 2.0 Landing Page Refresh',
        description: 'Update landing page copy to include RightShip RISQ 3.2',
        businessGoal: 'Improve conversion on paid + organic SIRE 2.0 traffic',
        campaignType: 'Website',
        priority: Priority.URGENT,
        ownerId: manager.id,
        startDate: new Date(),
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        stage: ProjectStage.PLANNING,
      },
    }),
  ]);
  const [newsletterProject, linkedinProject, sireProject] = projects;

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Draft newsletter issue 2 copy',
        description: 'Write the DPA-focused edition covering SIRE 2.0 readiness',
        projectId: newsletterProject.id,
        campaignId: campaign.id,
        ownerId: alex.id,
        reviewerId: manager.id,
        priority: Priority.HIGH,
        status: TaskStatus.APPROVED,
        estimatedHours: 4,
        actualHours: 4.5,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'Covers SIRE 2.0, RISQ 3.2, client CTA and prospect CTA variants',
        definitionOfDone: 'Copy approved by manager and scheduled in Mailchimp',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Design newsletter header graphic',
        projectId: newsletterProject.id,
        campaignId: campaign.id,
        ownerId: priya.id,
        reviewerId: manager.id,
        priority: Priority.MEDIUM,
        status: TaskStatus.READY_FOR_REVIEW,
        estimatedHours: 2,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'On-brand, 1200x400, matches issue 1 style',
        definitionOfDone: 'Approved and uploaded to asset library',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Schedule newsletter send in Mailchimp',
        projectId: newsletterProject.id,
        campaignId: campaign.id,
        ownerId: alex.id,
        reviewerId: manager.id,
        priority: Priority.HIGH,
        status: TaskStatus.TODO,
        estimatedHours: 1,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Write LinkedIn post 1 — scorecard teaser',
        projectId: linkedinProject.id,
        campaignId: campaign.id,
        ownerId: sam.id,
        reviewerId: manager.id,
        priority: Priority.MEDIUM,
        status: TaskStatus.CHANGES_REQUESTED,
        estimatedHours: 2,
        actualHours: 2,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Produce LinkedIn graphic 2',
        projectId: linkedinProject.id,
        campaignId: campaign.id,
        ownerId: priya.id,
        reviewerId: manager.id,
        priority: Priority.LOW,
        status: TaskStatus.IN_PROGRESS,
        estimatedHours: 3,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Audit current SIRE landing page copy',
        projectId: sireProject.id,
        ownerId: sam.id,
        reviewerId: manager.id,
        priority: Priority.URGENT,
        status: TaskStatus.BLOCKED,
        estimatedHours: 3,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Update hero section with RISQ 3.2 messaging',
        projectId: sireProject.id,
        ownerId: alex.id,
        reviewerId: manager.id,
        priority: Priority.HIGH,
        status: TaskStatus.TODO,
        estimatedHours: 5,
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const [newsletterCopyTask, headerGraphicTask, , linkedinPost1Task] = tasks;

  await prisma.deliverable.create({
    data: {
      taskId: newsletterCopyTask.id,
      type: DeliverableType.GOOGLE_DOC,
      url: 'https://docs.google.com/document/d/example-newsletter-copy',
      submittedById: alex.id,
    },
  });
  await prisma.reviewAction.create({
    data: {
      taskId: newsletterCopyTask.id,
      reviewerId: manager.id,
      action: ReviewActionType.APPROVE,
      comment: 'Great structure, ship it.',
    },
  });

  await prisma.deliverable.create({
    data: {
      taskId: headerGraphicTask.id,
      type: DeliverableType.CANVA,
      url: 'https://canva.com/design/example-header',
      submittedById: priya.id,
    },
  });

  await prisma.deliverable.create({
    data: {
      taskId: linkedinPost1Task.id,
      type: DeliverableType.LINK,
      url: 'https://docs.google.com/document/d/example-li-post-1',
      submittedById: sam.id,
    },
  });
  await prisma.reviewAction.create({
    data: {
      taskId: linkedinPost1Task.id,
      reviewerId: manager.id,
      action: ReviewActionType.REQUEST_CHANGES,
      comment: 'Lead with the stat, not the feature list. Tighten the CTA.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: headerGraphicTask.id,
      authorId: manager.id,
      body: 'Can we try a darker navy background to match issue 1?',
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        type: 'REVIEW_REQUESTED',
        message: 'Priya requested review on "Design newsletter header graphic"',
        link: `/tasks/${headerGraphicTask.id}`,
      },
      {
        userId: sam.id,
        type: 'CHANGES_REQUESTED',
        message: 'Morgan requested changes on "Write LinkedIn post 1 — scorecard teaser"',
        link: `/tasks/${linkedinPost1Task.id}`,
      },
      {
        userId: alex.id,
        type: 'REVIEW_APPROVED',
        message: 'Morgan approved "Draft newsletter issue 2 copy"',
        link: `/tasks/${newsletterCopyTask.id}`,
        read: true,
      },
    ],
  });

  console.log('Seed complete:', {
    users: [manager, ...members].map((u) => u.email),
    projects: projects.map((p) => p.name),
    tasks: tasks.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
