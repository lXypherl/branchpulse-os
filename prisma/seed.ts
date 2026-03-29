import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding Xyloquent Branch OS database...');

  // Hash the default password once and reuse for all users
  const seedPassword = process.env.SEED_PASSWORD || 'demo';
  const defaultPasswordHash = await hashPassword(seedPassword);

  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------
  const org = await prisma.organization.create({
    data: { name: 'Xyloquent Corp' },
  });
  console.log(`Created organization: ${org.name}`);

  // ---------------------------------------------------------------------------
  // Regions
  // ---------------------------------------------------------------------------
  const [north, south, east, west] = await Promise.all([
    prisma.region.create({ data: { name: 'North Region', organizationId: org.id } }),
    prisma.region.create({ data: { name: 'South Region', organizationId: org.id } }),
    prisma.region.create({ data: { name: 'East Region', organizationId: org.id } }),
    prisma.region.create({ data: { name: 'West Region', organizationId: org.id } }),
  ]);
  console.log('Created 4 regions');

  // ---------------------------------------------------------------------------
  // Areas (2 per region)
  // ---------------------------------------------------------------------------
  const [nycArea, bostonArea, miamiArea, atlantaArea, dcArea, phillyArea, sfArea, laArea] =
    await Promise.all([
      prisma.area.create({ data: { name: 'NYC Area', regionId: north.id } }),
      prisma.area.create({ data: { name: 'Boston Metro', regionId: north.id } }),
      prisma.area.create({ data: { name: 'Miami Metro', regionId: south.id } }),
      prisma.area.create({ data: { name: 'Atlanta Area', regionId: south.id } }),
      prisma.area.create({ data: { name: 'DC Metro', regionId: east.id } }),
      prisma.area.create({ data: { name: 'Philly Metro', regionId: east.id } }),
      prisma.area.create({ data: { name: 'SF Bay Area', regionId: west.id } }),
      prisma.area.create({ data: { name: 'LA Metro', regionId: west.id } }),
    ]);
  console.log('Created 8 areas');

  // ---------------------------------------------------------------------------
  // Users (pass 1: create without hierarchy links)
  // ---------------------------------------------------------------------------
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Sandra Chen',
        email: 'sandra.chen@xyloquent.com',
        role: 'HQ_DIRECTOR',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sandra',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Marcus Williams',
        email: 'marcus.williams@xyloquent.com',
        role: 'FRANCHISE_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'priya.sharma@xyloquent.com',
        role: 'REGIONAL_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Park',
        email: 'david.park@xyloquent.com',
        role: 'REGIONAL_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Emma Torres',
        email: 'emma.torres@xyloquent.com',
        role: 'AREA_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'James Okonkwo',
        email: 'james.okonkwo@xyloquent.com',
        role: 'AREA_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rachel Kim',
        email: 'rachel.kim@xyloquent.com',
        role: 'BRANCH_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carlos Rivera',
        email: 'carlos.rivera@xyloquent.com',
        role: 'BRANCH_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Aisha Patel',
        email: 'aisha.patel@xyloquent.com',
        role: 'FIELD_AUDITOR',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Nathan Brooks',
        email: 'nathan.brooks@xyloquent.com',
        role: 'FIELD_AUDITOR',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nathan',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Olivia Grant',
        email: 'olivia.grant@xyloquent.com',
        role: 'EXECUTIVE_VIEWER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Leo Fernandez',
        email: 'leo.fernandez@xyloquent.com',
        role: 'BRANCH_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo',
        passwordHash: defaultPasswordHash,
      },
    }),
  ]);

  const [
    sandra,
    marcus,
    priya,
    david,
    emma,
    james,
    rachel,
    carlos,
    aisha,
    nathan,
    olivia,
    leo,
  ] = users;
  console.log(`Created ${users.length} users`);

  // ---------------------------------------------------------------------------
  // Branches (~24, spread across areas)
  // ---------------------------------------------------------------------------
  const branchDefs: {
    name: string;
    code: string;
    address: string;
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
    areaId: string;
    managerId: string;
    complianceScore: number;
    lastAuditDate: Date | null;
    operatingHours: string;
  }[] = [
    // NYC Area (4)
    { name: 'Downtown Flagship', code: 'NYC-001', address: '100 Broadway, New York, NY 10005', status: 'ACTIVE', areaId: nycArea.id, managerId: rachel.id, complianceScore: 96.5, lastAuditDate: new Date('2026-03-15'), operatingHours: 'Mon-Sat 8AM-10PM, Sun 9AM-8PM' },
    { name: 'Times Square North', code: 'NYC-002', address: '1501 Broadway, New York, NY 10036', status: 'ACTIVE', areaId: nycArea.id, managerId: carlos.id, complianceScore: 91.2, lastAuditDate: new Date('2026-03-10'), operatingHours: 'Daily 7AM-11PM' },
    { name: 'SoHo Boutique', code: 'NYC-003', address: '435 Broadway, New York, NY 10013', status: 'ACTIVE', areaId: nycArea.id, managerId: leo.id, complianceScore: 88.0, lastAuditDate: new Date('2026-02-28'), operatingHours: 'Mon-Sat 9AM-9PM, Sun 10AM-7PM' },
    { name: 'Chelsea Market Hub', code: 'NYC-004', address: '75 9th Ave, New York, NY 10011', status: 'MAINTENANCE', areaId: nycArea.id, managerId: rachel.id, complianceScore: 72.3, lastAuditDate: new Date('2026-01-20'), operatingHours: 'Mon-Fri 8AM-8PM' },
    // Boston Metro (3)
    { name: 'Lexington Ave', code: 'BOS-001', address: '800 Boylston St, Boston, MA 02199', status: 'ACTIVE', areaId: bostonArea.id, managerId: carlos.id, complianceScore: 94.8, lastAuditDate: new Date('2026-03-12'), operatingHours: 'Mon-Sat 8AM-9PM, Sun 10AM-6PM' },
    { name: 'Fenway Park Place', code: 'BOS-002', address: '4 Yawkey Way, Boston, MA 02215', status: 'ACTIVE', areaId: bostonArea.id, managerId: leo.id, complianceScore: 87.5, lastAuditDate: new Date('2026-02-20'), operatingHours: 'Daily 9AM-9PM' },
    { name: 'Harvard Square', code: 'BOS-003', address: '1 Brattle Sq, Cambridge, MA 02138', status: 'ACTIVE', areaId: bostonArea.id, managerId: rachel.id, complianceScore: 92.1, lastAuditDate: new Date('2026-03-01'), operatingHours: 'Daily 7AM-10PM' },
    // Miami Metro (3)
    { name: 'South Beach Central', code: 'MIA-001', address: '1100 Lincoln Rd, Miami Beach, FL 33139', status: 'ACTIVE', areaId: miamiArea.id, managerId: carlos.id, complianceScore: 89.4, lastAuditDate: new Date('2026-03-05'), operatingHours: 'Daily 8AM-11PM' },
    { name: 'Brickell Tower', code: 'MIA-002', address: '701 Brickell Ave, Miami, FL 33131', status: 'ACTIVE', areaId: miamiArea.id, managerId: leo.id, complianceScore: 93.7, lastAuditDate: new Date('2026-03-18'), operatingHours: 'Mon-Sat 7AM-10PM, Sun 9AM-8PM' },
    { name: 'Wynwood District', code: 'MIA-003', address: '2550 NW 2nd Ave, Miami, FL 33127', status: 'INACTIVE', areaId: miamiArea.id, managerId: rachel.id, complianceScore: 64.2, lastAuditDate: new Date('2025-12-15'), operatingHours: 'Closed for renovation' },
    // Atlanta Area (3)
    { name: 'Peachtree Center', code: 'ATL-001', address: '225 Peachtree St NE, Atlanta, GA 30303', status: 'ACTIVE', areaId: atlantaArea.id, managerId: carlos.id, complianceScore: 97.0, lastAuditDate: new Date('2026-03-20'), operatingHours: 'Mon-Sat 8AM-9PM, Sun 10AM-7PM' },
    { name: 'Midtown Crossing', code: 'ATL-002', address: '999 Peachtree St NE, Atlanta, GA 30309', status: 'ACTIVE', areaId: atlantaArea.id, managerId: leo.id, complianceScore: 85.3, lastAuditDate: new Date('2026-02-15'), operatingHours: 'Daily 8AM-9PM' },
    { name: 'Buckhead Plaza', code: 'ATL-003', address: '3340 Peachtree Rd NE, Atlanta, GA 30326', status: 'MAINTENANCE', areaId: atlantaArea.id, managerId: rachel.id, complianceScore: 78.6, lastAuditDate: new Date('2026-01-10'), operatingHours: 'Mon-Fri 9AM-6PM (limited)' },
    // DC Metro (3)
    { name: 'Georgetown Walk', code: 'DC-001', address: '3222 M St NW, Washington, DC 20007', status: 'ACTIVE', areaId: dcArea.id, managerId: carlos.id, complianceScore: 91.8, lastAuditDate: new Date('2026-03-08'), operatingHours: 'Daily 8AM-10PM' },
    { name: 'Capitol Hill Station', code: 'DC-002', address: '660 Pennsylvania Ave SE, Washington, DC 20003', status: 'ACTIVE', areaId: dcArea.id, managerId: leo.id, complianceScore: 95.4, lastAuditDate: new Date('2026-03-22'), operatingHours: 'Mon-Sat 7AM-9PM, Sun 9AM-7PM' },
    { name: 'Dupont Circle', code: 'DC-003', address: '1350 Connecticut Ave NW, Washington, DC 20036', status: 'ACTIVE', areaId: dcArea.id, managerId: rachel.id, complianceScore: 86.9, lastAuditDate: new Date('2026-02-25'), operatingHours: 'Daily 8AM-10PM' },
    // Philly Metro (3)
    { name: 'Rittenhouse Row', code: 'PHL-001', address: '1700 Walnut St, Philadelphia, PA 19103', status: 'ACTIVE', areaId: phillyArea.id, managerId: carlos.id, complianceScore: 90.2, lastAuditDate: new Date('2026-03-11'), operatingHours: 'Mon-Sat 8AM-9PM, Sun 10AM-7PM' },
    { name: 'Old City Market', code: 'PHL-002', address: '35 S 2nd St, Philadelphia, PA 19106', status: 'ACTIVE', areaId: phillyArea.id, managerId: leo.id, complianceScore: 82.7, lastAuditDate: new Date('2026-02-10'), operatingHours: 'Daily 9AM-8PM' },
    { name: 'University City', code: 'PHL-003', address: '3401 Walnut St, Philadelphia, PA 19104', status: 'MAINTENANCE', areaId: phillyArea.id, managerId: rachel.id, complianceScore: 69.5, lastAuditDate: new Date('2025-12-20'), operatingHours: 'Mon-Fri 10AM-5PM (limited)' },
    // SF Bay Area (3)
    { name: 'Northside Plaza', code: 'SF-001', address: '865 Market St, San Francisco, CA 94103', status: 'ACTIVE', areaId: sfArea.id, managerId: carlos.id, complianceScore: 98.2, lastAuditDate: new Date('2026-03-25'), operatingHours: 'Daily 7AM-10PM' },
    { name: 'Mission District Hub', code: 'SF-002', address: '2000 Mission St, San Francisco, CA 94110', status: 'ACTIVE', areaId: sfArea.id, managerId: leo.id, complianceScore: 84.1, lastAuditDate: new Date('2026-02-18'), operatingHours: 'Daily 8AM-9PM' },
    { name: 'Ferry Building', code: 'SF-003', address: '1 Ferry Building, San Francisco, CA 94111', status: 'ACTIVE', areaId: sfArea.id, managerId: rachel.id, complianceScore: 100.0, lastAuditDate: new Date('2026-03-27'), operatingHours: 'Mon-Fri 7AM-7PM, Sat 8AM-6PM' },
    // LA Metro (2)
    { name: 'South Metro Hub', code: 'LA-001', address: '700 W 7th St, Los Angeles, CA 90017', status: 'ACTIVE', areaId: laArea.id, managerId: carlos.id, complianceScore: 88.9, lastAuditDate: new Date('2026-03-14'), operatingHours: 'Daily 8AM-10PM' },
    { name: 'East Ridge Mall', code: 'LA-002', address: '189 The Grove Dr, Los Angeles, CA 90036', status: 'ACTIVE', areaId: laArea.id, managerId: leo.id, complianceScore: 76.4, lastAuditDate: new Date('2026-01-30'), operatingHours: 'Mon-Sat 9AM-9PM, Sun 10AM-7PM' },
  ];

  const branches = await Promise.all(
    branchDefs.map((b) => prisma.branch.create({ data: b })),
  );
  console.log(`Created ${branches.length} branches`);

  // Lookup helpers
  const branchByCode = (code: string) => branches.find((b) => b.code === code)!;

  // ---------------------------------------------------------------------------
  // Users (pass 2: link to org hierarchy)
  // ---------------------------------------------------------------------------
  await Promise.all([
    // David Park (REGIONAL_MANAGER) -> North Region
    prisma.user.update({ where: { id: david.id }, data: { regionId: north.id } }),
    // Priya Sharma (REGIONAL_MANAGER) -> South Region
    prisma.user.update({ where: { id: priya.id }, data: { regionId: south.id } }),
    // Emma Torres (AREA_MANAGER) -> NYC Area
    prisma.user.update({ where: { id: emma.id }, data: { areaId: nycArea.id } }),
    // James Okonkwo (AREA_MANAGER) -> Boston Metro
    prisma.user.update({ where: { id: james.id }, data: { areaId: bostonArea.id } }),
    // Carlos Rivera (BRANCH_MANAGER) -> Downtown Flagship (first branch in NYC Area)
    prisma.user.update({ where: { id: carlos.id }, data: { branchId: branchByCode('NYC-001').id } }),
    // Leo Fernandez (BRANCH_MANAGER) -> Times Square North (second branch in NYC Area)
    prisma.user.update({ where: { id: leo.id }, data: { branchId: branchByCode('NYC-002').id } }),
    // Rachel Kim (BRANCH_MANAGER) -> Lexington Ave (first branch in Boston Metro)
    prisma.user.update({ where: { id: rachel.id }, data: { branchId: branchByCode('BOS-001').id } }),
    // Aisha Patel (FIELD_AUDITOR) -> Downtown Flagship (for audit assignments)
    prisma.user.update({ where: { id: aisha.id }, data: { branchId: branchByCode('NYC-001').id } }),
    // Nathan Brooks (FIELD_AUDITOR) -> no specific branch (audits across branches)
    // Sandra Chen (HQ_DIRECTOR) -> no hierarchy link needed
    // Marcus Williams (FRANCHISE_MANAGER) -> no hierarchy link needed
    // Olivia Grant (EXECUTIVE_VIEWER) -> no hierarchy link needed
  ]);
  console.log('Linked users to org hierarchy');

  // ---------------------------------------------------------------------------
  // Audit templates
  // ---------------------------------------------------------------------------
  const [safetyTemplate, standardTemplate, inventoryTemplate] = await Promise.all([
    prisma.auditTemplate.create({
      data: {
        name: 'Safety Compliance',
        description: 'Full safety and regulatory compliance audit covering fire safety, food handling, equipment maintenance, and emergency preparedness.',
        category: 'Safety',
      },
    }),
    prisma.auditTemplate.create({
      data: {
        name: 'Standard Review',
        description: 'Quarterly standard operations review including customer service, cleanliness, staff compliance, and brand standards.',
        category: 'Operations',
      },
    }),
    prisma.auditTemplate.create({
      data: {
        name: 'Inventory Hygiene',
        description: 'Inventory accuracy and hygiene audit covering stock rotation, expiry management, storage conditions, and waste tracking.',
        category: 'Inventory',
      },
    }),
  ]);
  console.log('Created 3 audit templates');

  // ---------------------------------------------------------------------------
  // Audits (14)
  // ---------------------------------------------------------------------------
  const audits = await Promise.all([
    prisma.audit.create({
      data: {
        branchId: branchByCode('NYC-001').id,
        templateId: safetyTemplate.id,
        auditorId: aisha.id,
        status: 'APPROVED',
        score: 96.5,
        findings: 'Excellent safety compliance. All fire extinguishers within inspection dates. Emergency exits clearly marked. Minor suggestion: update first-aid kit inventory labels.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/nyc001-safety-01.jpg', 'https://storage.xyloquent.com/audits/nyc001-safety-02.jpg'],
        submittedAt: new Date('2026-03-15T14:30:00Z'),
        reviewedAt: new Date('2026-03-16T09:00:00Z'),
        reviewerId: priya.id,
        createdAt: new Date('2026-03-14T10:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('NYC-002').id,
        templateId: standardTemplate.id,
        auditorId: nathan.id,
        status: 'APPROVED',
        score: 91.2,
        findings: 'Strong overall operations. Staff uniforms consistent. Slight delay observed during peak-hour shift transitions. Recommend reviewing handoff procedures.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/nyc002-standard-01.jpg'],
        submittedAt: new Date('2026-03-10T16:00:00Z'),
        reviewedAt: new Date('2026-03-11T10:30:00Z'),
        reviewerId: priya.id,
        createdAt: new Date('2026-03-09T08:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('NYC-003').id,
        templateId: inventoryTemplate.id,
        auditorId: aisha.id,
        status: 'UNDER_REVIEW',
        score: 88.0,
        findings: 'Good stock rotation overall. Found 3 items past best-before date in cold storage. FIFO not consistently applied in dry goods section.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/nyc003-inventory-01.jpg', 'https://storage.xyloquent.com/audits/nyc003-inventory-02.jpg', 'https://storage.xyloquent.com/audits/nyc003-inventory-03.jpg'],
        submittedAt: new Date('2026-03-28T11:00:00Z'),
        reviewerId: emma.id,
        createdAt: new Date('2026-02-27T09:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('NYC-004').id,
        templateId: safetyTemplate.id,
        auditorId: nathan.id,
        status: 'RETURNED',
        score: 72.3,
        findings: 'Multiple safety concerns found: emergency lighting in back hallway non-functional, expired fire suppression system certification, wet floor signs missing from storage. Requires immediate remediation.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/nyc004-safety-01.jpg'],
        submittedAt: new Date('2026-01-20T15:00:00Z'),
        reviewedAt: new Date('2026-01-21T09:00:00Z'),
        reviewerId: priya.id,
        createdAt: new Date('2026-01-19T08:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('BOS-001').id,
        templateId: standardTemplate.id,
        auditorId: aisha.id,
        status: 'APPROVED',
        score: 94.8,
        findings: 'Branch in excellent condition. Customer wait times well within target. Staff knowledgeable and courteous. Minor signage update recommended for seasonal promotions.',
        evidenceUrls: [],
        submittedAt: new Date('2026-03-12T16:45:00Z'),
        reviewedAt: new Date('2026-03-13T08:30:00Z'),
        reviewerId: david.id,
        createdAt: new Date('2026-03-11T09:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('MIA-001').id,
        templateId: safetyTemplate.id,
        auditorId: nathan.id,
        status: 'APPROVED',
        score: 89.4,
        findings: 'Safety compliance generally good. HVAC system filters need replacement schedule review. All certifications current.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/mia001-safety-01.jpg'],
        submittedAt: new Date('2026-03-05T14:00:00Z'),
        reviewedAt: new Date('2026-03-06T10:00:00Z'),
        reviewerId: david.id,
        createdAt: new Date('2026-03-04T08:30:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('MIA-003').id,
        templateId: safetyTemplate.id,
        auditorId: aisha.id,
        status: 'CLOSED',
        score: 64.2,
        findings: 'Pre-renovation safety audit. Multiple systems offline pending renovation. Documented current state for insurance and compliance records. Branch closed to public.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/mia003-safety-01.jpg', 'https://storage.xyloquent.com/audits/mia003-safety-02.jpg'],
        submittedAt: new Date('2025-12-15T13:00:00Z'),
        reviewedAt: new Date('2025-12-16T09:00:00Z'),
        reviewerId: david.id,
        createdAt: new Date('2025-12-14T08:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('ATL-001').id,
        templateId: standardTemplate.id,
        auditorId: nathan.id,
        status: 'APPROVED',
        score: 97.0,
        findings: 'Top-performing branch. Exemplary customer service scores. Clean facility, well-organized back of house. Model branch for training purposes.',
        evidenceUrls: [],
        submittedAt: new Date('2026-03-20T15:30:00Z'),
        reviewedAt: new Date('2026-03-21T08:00:00Z'),
        reviewerId: priya.id,
        createdAt: new Date('2026-03-19T09:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('SF-001').id,
        templateId: inventoryTemplate.id,
        auditorId: aisha.id,
        status: 'APPROVED',
        score: 98.2,
        findings: 'Outstanding inventory management. Perfect FIFO compliance, zero waste above threshold, digital tracking system fully utilized.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/sf001-inventory-01.jpg'],
        submittedAt: new Date('2026-03-25T17:00:00Z'),
        reviewedAt: new Date('2026-03-26T08:00:00Z'),
        reviewerId: david.id,
        createdAt: new Date('2026-03-24T08:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('SF-003').id,
        templateId: safetyTemplate.id,
        auditorId: nathan.id,
        status: 'APPROVED',
        score: 100.0,
        findings: 'Perfect safety score. All systems inspected and current. Commendable emergency preparedness documentation. Staff training records 100% complete.',
        evidenceUrls: [],
        submittedAt: new Date('2026-03-27T16:00:00Z'),
        reviewedAt: new Date('2026-03-28T09:00:00Z'),
        reviewerId: priya.id,
        createdAt: new Date('2026-03-26T08:30:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('DC-002').id,
        templateId: standardTemplate.id,
        auditorId: aisha.id,
        status: 'SUBMITTED',
        score: 95.4,
        findings: 'Very well-run branch. Minor point deduction for signage updates needed. Excellent staff engagement scores.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/dc002-standard-01.jpg'],
        submittedAt: new Date('2026-03-22T14:00:00Z'),
        createdAt: new Date('2026-03-21T09:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('LA-002').id,
        templateId: inventoryTemplate.id,
        auditorId: nathan.id,
        status: 'RETURNED',
        score: 76.4,
        findings: 'Several inventory discrepancies found. Manual counts do not match POS records for 12 SKUs. Cold chain temperature logs have 3-day gap. Immediate corrective action required.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/la002-inventory-01.jpg', 'https://storage.xyloquent.com/audits/la002-inventory-02.jpg'],
        submittedAt: new Date('2026-01-30T15:00:00Z'),
        reviewedAt: new Date('2026-01-31T10:00:00Z'),
        reviewerId: david.id,
        createdAt: new Date('2026-01-29T08:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('PHL-003').id,
        templateId: safetyTemplate.id,
        auditorId: aisha.id,
        status: 'CLOSED',
        score: 69.5,
        findings: 'Branch under maintenance. Multiple non-compliance issues documented before shutdown: HVAC failure, plumbing code violation in restroom, outdated fire panel. All tracked for post-renovation remediation.',
        evidenceUrls: ['https://storage.xyloquent.com/audits/phl003-safety-01.jpg'],
        submittedAt: new Date('2025-12-20T14:00:00Z'),
        reviewedAt: new Date('2025-12-21T09:00:00Z'),
        reviewerId: priya.id,
        createdAt: new Date('2025-12-19T08:00:00Z'),
      },
    }),
    prisma.audit.create({
      data: {
        branchId: branchByCode('PHL-001').id,
        templateId: standardTemplate.id,
        auditorId: nathan.id,
        status: 'DRAFT',
        score: null,
        findings: null,
        evidenceUrls: [],
        createdAt: new Date('2026-03-28T08:00:00Z'),
      },
    }),
  ]);
  console.log(`Created ${audits.length} audits`);

  // ---------------------------------------------------------------------------
  // Issues (18)
  // ---------------------------------------------------------------------------
  const issues = await Promise.all([
    prisma.issue.create({
      data: {
        title: 'Emergency lighting failure in back hallway',
        description: 'Two emergency exit lights in the back hallway are non-functional. Bulbs appear burned out and one unit has a cracked housing. Immediate replacement required per fire code.',
        branchId: branchByCode('NYC-004').id,
        reportedById: nathan.id,
        assignedToId: rachel.id,
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
        category: 'Safety',
        dueDate: new Date('2026-02-01'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/nyc004-lighting-01.jpg'],
        correctiveAction: 'Replacement units ordered. Electrician scheduled for Feb 3.',
        auditId: audits[3].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Expired fire suppression system certification',
        description: 'Fire suppression system certification expired on Dec 31, 2025. Vendor has been contacted but has not yet scheduled re-inspection.',
        branchId: branchByCode('NYC-004').id,
        reportedById: nathan.id,
        assignedToId: rachel.id,
        severity: 'CRITICAL',
        status: 'OPEN',
        category: 'Safety',
        dueDate: new Date('2026-02-15'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/nyc004-fire-cert-01.jpg'],
        auditId: audits[3].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'FIFO non-compliance in dry goods storage',
        description: 'During inventory audit, older stock found behind newer deliveries in dry goods section. Three pallets improperly rotated. Staff retraining needed.',
        branchId: branchByCode('NYC-003').id,
        reportedById: aisha.id,
        assignedToId: leo.id,
        severity: 'MEDIUM',
        status: 'UNDER_REVIEW',
        category: 'Inventory',
        dueDate: new Date('2026-04-10'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/nyc003-fifo-01.jpg'],
        correctiveAction: 'Staff retraining completed March 5. New labeling system implemented. Awaiting follow-up verification.',
        auditId: audits[2].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Expired products found in cold storage',
        description: 'Three items past best-before date found in walk-in cooler during routine audit. Items removed and documented. Root cause: missed daily check on March 25.',
        branchId: branchByCode('NYC-003').id,
        reportedById: aisha.id,
        assignedToId: leo.id,
        severity: 'HIGH',
        status: 'RESOLVED',
        category: 'Inventory',
        dueDate: new Date('2026-03-30'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/nyc003-expired-01.jpg', 'https://storage.xyloquent.com/issues/nyc003-expired-02.jpg'],
        correctiveAction: 'Items disposed. Daily check sheet revised with mandatory sign-off. Additional cooler inspection added at shift change.',
        auditId: audits[2].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'HVAC filter replacement overdue',
        description: 'HVAC air filters are 2 months past scheduled replacement date. Air quality may be affected. Maintenance vendor needs to be contacted.',
        branchId: branchByCode('MIA-001').id,
        reportedById: nathan.id,
        assignedToId: carlos.id,
        severity: 'MEDIUM',
        status: 'RESOLVED',
        category: 'Maintenance',
        dueDate: new Date('2026-03-20'),
        evidenceUrls: [],
        correctiveAction: 'Filters replaced on March 8. Set up quarterly auto-reminder in maintenance system.',
        auditId: audits[5].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Shift handoff procedure delays',
        description: 'During peak hours, shift transitions are taking 15-20 minutes instead of the target 5 minutes, causing customer service gaps. Observed during 2PM and 6PM handoffs.',
        branchId: branchByCode('NYC-002').id,
        reportedById: nathan.id,
        assignedToId: carlos.id,
        severity: 'LOW',
        status: 'IN_PROGRESS',
        category: 'Operations',
        dueDate: new Date('2026-04-15'),
        evidenceUrls: [],
        correctiveAction: 'New handoff checklist drafted. Trial period started March 15.',
        auditId: audits[1].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'POS inventory discrepancy - 12 SKUs',
        description: 'Physical inventory count does not match POS system records for 12 SKUs. Variance ranges from 3-18 units per SKU. Possible causes: theft, receiving errors, or POS misconfiguration.',
        branchId: branchByCode('LA-002').id,
        reportedById: nathan.id,
        assignedToId: leo.id,
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        category: 'Inventory',
        dueDate: new Date('2026-02-28'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/la002-pos-01.pdf'],
        correctiveAction: 'Full recount scheduled. POS vendor consulted for system audit.',
        auditId: audits[11].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Cold chain temperature log gap',
        description: 'Temperature monitoring logs show a 3-day gap (Jan 25-27). Cooler temperatures were not recorded. No product spoilage observed but compliance requirement not met.',
        branchId: branchByCode('LA-002').id,
        reportedById: nathan.id,
        assignedToId: leo.id,
        severity: 'HIGH',
        status: 'RESOLVED',
        category: 'Inventory',
        dueDate: new Date('2026-02-15'),
        evidenceUrls: [],
        correctiveAction: 'Digital temperature logger installed to replace manual process. No gaps since Feb 1.',
        auditId: audits[11].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Plumbing code violation in restroom',
        description: 'Restroom sink faucet not meeting hot water temperature requirements. Water heater malfunction suspected.',
        branchId: branchByCode('PHL-003').id,
        reportedById: aisha.id,
        assignedToId: rachel.id,
        severity: 'HIGH',
        status: 'OPEN',
        category: 'Maintenance',
        dueDate: new Date('2026-04-30'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/phl003-plumbing-01.jpg'],
        auditId: audits[12].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Outdated fire alarm control panel',
        description: 'Fire alarm panel model is 12 years old and no longer supported by manufacturer. Replacement parts unavailable. Full panel replacement recommended.',
        branchId: branchByCode('PHL-003').id,
        reportedById: aisha.id,
        assignedToId: rachel.id,
        severity: 'CRITICAL',
        status: 'OPEN',
        category: 'Safety',
        dueDate: new Date('2026-05-15'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/phl003-firepanel-01.jpg'],
        auditId: audits[12].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Seasonal signage not updated',
        description: 'Spring promotion signage has not been installed. Q1 campaign materials still displayed in window and in-store poster frames.',
        branchId: branchByCode('DC-002').id,
        reportedById: aisha.id,
        assignedToId: leo.id,
        severity: 'LOW',
        status: 'OPEN',
        category: 'Brand Standards',
        dueDate: new Date('2026-04-05'),
        evidenceUrls: [],
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Broken entry door closer mechanism',
        description: 'Main entrance door closer is broken causing the door to slam. Creates accessibility issue and noise complaint risk. Temporary wedge being used.',
        branchId: branchByCode('ATL-002').id,
        reportedById: marcus.id,
        assignedToId: leo.id,
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        category: 'Maintenance',
        dueDate: new Date('2026-04-10'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/atl002-door-01.jpg'],
        correctiveAction: 'Replacement part ordered. ETA April 3.',
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Staff training certificates expired',
        description: 'Four staff members have food handling certificates expiring this month. Re-certification must be completed before end of April.',
        branchId: branchByCode('BOS-002').id,
        reportedById: aisha.id,
        assignedToId: leo.id,
        severity: 'MEDIUM',
        status: 'OPEN',
        category: 'Compliance',
        dueDate: new Date('2026-04-30'),
        evidenceUrls: [],
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Customer complaint - long wait times',
        description: 'Three customer complaints received in one week regarding wait times exceeding 15 minutes during lunch rush. Current staffing may be insufficient for demand.',
        branchId: branchByCode('SF-002').id,
        reportedById: carlos.id,
        assignedToId: leo.id,
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        category: 'Operations',
        dueDate: new Date('2026-04-15'),
        evidenceUrls: [],
        correctiveAction: 'Added one additional staff member for 11AM-2PM shift. Monitoring wait times.',
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Parking lot pothole creating trip hazard',
        description: 'Large pothole near main entrance in parking lot. Approximately 8 inches wide and 3 inches deep. Trip hazard for customers, especially at night.',
        branchId: branchByCode('ATL-003').id,
        reportedById: nathan.id,
        assignedToId: rachel.id,
        severity: 'HIGH',
        status: 'OPEN',
        category: 'Safety',
        dueDate: new Date('2026-04-05'),
        evidenceUrls: ['https://storage.xyloquent.com/issues/atl003-pothole-01.jpg'],
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Wifi network down for customers',
        description: 'Customer-facing wifi has been intermittently dropping for the past week. Router reset provides temporary fix but issue returns within hours.',
        branchId: branchByCode('BOS-003').id,
        reportedById: rachel.id,
        assignedToId: rachel.id,
        severity: 'LOW',
        status: 'RESOLVED',
        category: 'IT',
        dueDate: new Date('2026-03-15'),
        evidenceUrls: [],
        correctiveAction: 'Replaced faulty router. Network stable since March 8.',
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Missing wet floor signs',
        description: 'Audit revealed no wet floor signs in storage. Previous signs reported damaged and discarded. Replacements not ordered.',
        branchId: branchByCode('NYC-004').id,
        reportedById: nathan.id,
        assignedToId: rachel.id,
        severity: 'MEDIUM',
        status: 'CLOSED',
        category: 'Safety',
        dueDate: new Date('2026-02-10'),
        evidenceUrls: [],
        correctiveAction: 'Four new wet floor signs ordered and received. Placed in designated storage locations.',
        auditId: audits[3].id,
      },
    }),
    prisma.issue.create({
      data: {
        title: 'Grease trap maintenance overdue',
        description: 'Kitchen grease trap has not been serviced in 4 months. Service interval is 90 days per health code. Slow drainage observed.',
        branchId: branchByCode('PHL-002').id,
        reportedById: aisha.id,
        assignedToId: leo.id,
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        category: 'Maintenance',
        dueDate: new Date('2026-04-08'),
        evidenceUrls: [],
        correctiveAction: 'Emergency service call placed. Vendor confirmed appointment for April 1.',
      },
    }),
  ]);
  console.log(`Created ${issues.length} issues`);

  // ---------------------------------------------------------------------------
  // Escalations (3)
  // ---------------------------------------------------------------------------
  const escalations = await Promise.all([
    prisma.escalation.create({
      data: {
        issueId: issues[0].id, // Emergency lighting - critical
        level: 1,
        escalatedToId: emma.id,
        reason: 'Critical safety issue unresolved for 5+ business days. Branch manager requested additional resources for emergency repair.',
        triggeredAt: new Date('2026-01-28T09:00:00Z'),
        resolvedAt: new Date('2026-02-03T17:00:00Z'),
      },
    }),
    prisma.escalation.create({
      data: {
        issueId: issues[1].id, // Fire suppression cert - critical
        level: 1,
        escalatedToId: emma.id,
        reason: 'Fire suppression certification still expired after 2 weeks. Vendor not responding to scheduling requests.',
        triggeredAt: new Date('2026-02-05T08:00:00Z'),
      },
    }),
    prisma.escalation.create({
      data: {
        issueId: issues[1].id, // Fire suppression cert - escalated higher
        level: 2,
        escalatedToId: priya.id,
        reason: 'Level 1 escalation unresolved for 10 days. Regional manager intervention required to engage alternate vendor or expedite.',
        triggeredAt: new Date('2026-02-15T08:00:00Z'),
      },
    }),
  ]);
  console.log(`Created ${escalations.length} escalations`);

  // ---------------------------------------------------------------------------
  // Promo checks (5)
  // ---------------------------------------------------------------------------
  const promoChecks = await Promise.all([
    prisma.promoCheck.create({
      data: {
        name: 'Spring Collection Launch',
        description: 'Verify all Spring 2026 promotional materials are displayed according to brand guidelines.',
        branchId: branchByCode('NYC-001').id,
        status: 'CONFIRMED',
        checklistItems: [
          { item: 'Window display updated', completed: true },
          { item: 'In-store banners installed', completed: true },
          { item: 'Digital menu boards updated', completed: true },
          { item: 'Staff briefed on promotions', completed: true },
          { item: 'POS system promo codes active', completed: true },
        ],
        dueDate: new Date('2026-03-25'),
        completedAt: new Date('2026-03-23T14:00:00Z'),
      },
    }),
    prisma.promoCheck.create({
      data: {
        name: 'Spring Collection Launch',
        description: 'Verify all Spring 2026 promotional materials are displayed according to brand guidelines.',
        branchId: branchByCode('NYC-002').id,
        status: 'CONFIRMED',
        checklistItems: [
          { item: 'Window display updated', completed: true },
          { item: 'In-store banners installed', completed: true },
          { item: 'Digital menu boards updated', completed: true },
          { item: 'Staff briefed on promotions', completed: true },
          { item: 'POS system promo codes active', completed: true },
        ],
        dueDate: new Date('2026-03-25'),
        completedAt: new Date('2026-03-24T10:00:00Z'),
      },
    }),
    prisma.promoCheck.create({
      data: {
        name: 'Spring Collection Launch',
        description: 'Verify all Spring 2026 promotional materials are displayed according to brand guidelines.',
        branchId: branchByCode('DC-002').id,
        status: 'PENDING',
        checklistItems: [
          { item: 'Window display updated', completed: false },
          { item: 'In-store banners installed', completed: false },
          { item: 'Digital menu boards updated', completed: true },
          { item: 'Staff briefed on promotions', completed: false },
          { item: 'POS system promo codes active', completed: true },
        ],
        dueDate: new Date('2026-04-01'),
      },
    }),
    prisma.promoCheck.create({
      data: {
        name: 'Easter Weekend Special',
        description: 'Ensure Easter weekend promotional pricing and decorations are in place.',
        branchId: branchByCode('SF-001').id,
        status: 'CONFIRMED',
        checklistItems: [
          { item: 'Holiday decorations installed', completed: true },
          { item: 'Special pricing updated in POS', completed: true },
          { item: 'Staff schedule adjusted for holiday hours', completed: true },
          { item: 'Social media promo posted', completed: true },
        ],
        dueDate: new Date('2026-04-03'),
        completedAt: new Date('2026-03-28T16:00:00Z'),
      },
    }),
    prisma.promoCheck.create({
      data: {
        name: 'Easter Weekend Special',
        description: 'Ensure Easter weekend promotional pricing and decorations are in place.',
        branchId: branchByCode('LA-001').id,
        status: 'FAILED',
        checklistItems: [
          { item: 'Holiday decorations installed', completed: true },
          { item: 'Special pricing updated in POS', completed: false },
          { item: 'Staff schedule adjusted for holiday hours', completed: false },
          { item: 'Social media promo posted', completed: true },
        ],
        dueDate: new Date('2026-04-03'),
      },
    }),
  ]);
  console.log(`Created ${promoChecks.length} promo checks`);

  // ---------------------------------------------------------------------------
  // Stock requests (5)
  // ---------------------------------------------------------------------------
  const stockRequests = await Promise.all([
    prisma.stockRequest.create({
      data: {
        branchId: branchByCode('NYC-001').id,
        requestedById: rachel.id,
        items: [
          { sku: 'CLN-001', name: 'All-Purpose Cleaner', quantity: 24, unit: 'bottles' },
          { sku: 'PPE-003', name: 'Disposable Gloves (L)', quantity: 10, unit: 'boxes' },
          { sku: 'PKG-012', name: 'Paper Bags (Large)', quantity: 500, unit: 'pieces' },
        ],
        status: 'FULFILLED',
        notes: 'Monthly restocking order. Delivered March 20.',
        createdAt: new Date('2026-03-15T09:00:00Z'),
      },
    }),
    prisma.stockRequest.create({
      data: {
        branchId: branchByCode('SF-001').id,
        requestedById: carlos.id,
        items: [
          { sku: 'MKT-045', name: 'Spring Promo Posters', quantity: 12, unit: 'pieces' },
          { sku: 'MKT-046', name: 'Table Tent Cards', quantity: 50, unit: 'pieces' },
          { sku: 'MKT-047', name: 'Window Cling Decals', quantity: 6, unit: 'pieces' },
        ],
        status: 'APPROVED',
        notes: 'Needed for Spring Collection Launch. Rush delivery requested.',
        createdAt: new Date('2026-03-22T11:00:00Z'),
      },
    }),
    prisma.stockRequest.create({
      data: {
        branchId: branchByCode('ATL-002').id,
        requestedById: leo.id,
        items: [
          { sku: 'MNT-008', name: 'Door Closer Mechanism (Commercial)', quantity: 1, unit: 'unit' },
          { sku: 'MNT-009', name: 'Door Hinge Set', quantity: 2, unit: 'sets' },
        ],
        status: 'APPROVED',
        notes: 'Emergency repair for main entrance door. See Issue #ATL-DOOR-001.',
        createdAt: new Date('2026-03-26T08:30:00Z'),
      },
    }),
    prisma.stockRequest.create({
      data: {
        branchId: branchByCode('BOS-002').id,
        requestedById: leo.id,
        items: [
          { sku: 'FNB-100', name: 'Coffee Beans (House Blend)', quantity: 50, unit: 'kg' },
          { sku: 'FNB-101', name: 'Oat Milk', quantity: 48, unit: 'cartons' },
          { sku: 'FNB-102', name: 'Paper Cups (12oz)', quantity: 1000, unit: 'pieces' },
          { sku: 'FNB-103', name: 'Cup Lids (12oz)', quantity: 1000, unit: 'pieces' },
        ],
        status: 'PENDING',
        notes: 'Weekly supply order. Higher volume expected for Boston Marathon weekend.',
        createdAt: new Date('2026-03-28T07:00:00Z'),
      },
    }),
    prisma.stockRequest.create({
      data: {
        branchId: branchByCode('MIA-001').id,
        requestedById: carlos.id,
        items: [
          { sku: 'HVAC-015', name: 'HVAC Air Filter (20x25x1)', quantity: 4, unit: 'pieces' },
          { sku: 'HVAC-016', name: 'HVAC Air Filter (16x20x1)', quantity: 2, unit: 'pieces' },
        ],
        status: 'FULFILLED',
        notes: 'Replacement filters for overdue HVAC maintenance.',
        createdAt: new Date('2026-03-06T09:00:00Z'),
      },
    }),
  ]);
  console.log(`Created ${stockRequests.length} stock requests`);

  // ---------------------------------------------------------------------------
  // Notifications (10)
  // ---------------------------------------------------------------------------
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: rachel.id,
        title: 'Critical Issue Assigned',
        message: 'You have been assigned a critical issue: "Emergency lighting failure in back hallway" at Chelsea Market Hub (NYC-004).',
        read: true,
        type: 'ISSUE_ASSIGNED',
        createdAt: new Date('2026-01-20T15:30:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: emma.id,
        title: 'Issue Escalated to You',
        message: 'Issue "Expired fire suppression system certification" at Chelsea Market Hub has been escalated to you (Level 1). Vendor not responding.',
        read: true,
        type: 'ESCALATION',
        createdAt: new Date('2026-02-05T08:05:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: priya.id,
        title: 'Level 2 Escalation',
        message: 'Issue "Expired fire suppression system certification" has been escalated to Level 2. Regional manager intervention needed.',
        read: true,
        type: 'ESCALATION',
        createdAt: new Date('2026-02-15T08:05:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: leo.id,
        title: 'Audit Under Review',
        message: 'The Inventory Hygiene audit for SoHo Boutique (NYC-003) has been submitted for your review.',
        read: false,
        type: 'AUDIT_STATUS',
        createdAt: new Date('2026-03-28T11:05:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: carlos.id,
        title: 'Promo Check Failed',
        message: 'Easter Weekend Special promo check for South Metro Hub (LA-001) has failed. 2 of 4 checklist items incomplete.',
        read: false,
        type: 'PROMO_CHECK',
        createdAt: new Date('2026-03-29T08:00:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: leo.id,
        title: 'New Issue Assigned',
        message: 'You have been assigned a new issue: "POS inventory discrepancy - 12 SKUs" at East Ridge Mall (LA-002).',
        read: true,
        type: 'ISSUE_ASSIGNED',
        createdAt: new Date('2026-01-30T15:30:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: sandra.id,
        title: 'Monthly Compliance Summary',
        message: 'March 2026 compliance summary ready: 20 of 24 branches above 85% threshold. 2 branches under maintenance. See dashboard for details.',
        read: false,
        type: 'REPORT',
        createdAt: new Date('2026-03-29T06:00:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: rachel.id,
        title: 'Stock Request Fulfilled',
        message: 'Your stock request for Downtown Flagship (NYC-001) has been fulfilled. 3 items delivered.',
        read: true,
        type: 'STOCK_REQUEST',
        createdAt: new Date('2026-03-20T14:00:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: nathan.id,
        title: 'Audit Draft Reminder',
        message: 'You have a draft audit for Rittenhouse Row (PHL-001) that has not been submitted. Please complete and submit.',
        read: false,
        type: 'AUDIT_REMINDER',
        createdAt: new Date('2026-03-29T07:00:00Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: olivia.id,
        title: 'Weekly Executive Briefing',
        message: 'Your weekly Xyloquent Branch executive briefing is ready. Key highlights: SF Ferry Building achieved 100% compliance, 3 critical issues require attention.',
        read: false,
        type: 'REPORT',
        createdAt: new Date('2026-03-29T07:30:00Z'),
      },
    }),
  ]);
  console.log(`Created ${notifications.length} notifications`);

  // ---------------------------------------------------------------------------
  // Audit log entries (12)
  // ---------------------------------------------------------------------------
  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: aisha.id,
        action: 'CREATE',
        entityType: 'Audit',
        entityId: audits[0].id,
        details: 'Created Safety Compliance audit for Downtown Flagship (NYC-001)',
        createdAt: new Date('2026-03-14T10:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: aisha.id,
        action: 'SUBMIT',
        entityType: 'Audit',
        entityId: audits[0].id,
        details: 'Submitted audit with score 96.5',
        createdAt: new Date('2026-03-15T14:30:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: priya.id,
        action: 'APPROVE',
        entityType: 'Audit',
        entityId: audits[0].id,
        details: 'Approved Safety Compliance audit for Downtown Flagship',
        createdAt: new Date('2026-03-16T09:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: nathan.id,
        action: 'CREATE',
        entityType: 'Issue',
        entityId: issues[0].id,
        details: 'Reported critical issue: Emergency lighting failure at Chelsea Market Hub',
        createdAt: new Date('2026-01-20T15:15:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: emma.id,
        action: 'ESCALATE',
        entityType: 'Issue',
        entityId: issues[1].id,
        details: 'Escalated fire suppression cert issue to Level 1',
        createdAt: new Date('2026-02-05T08:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: priya.id,
        action: 'ESCALATE',
        entityType: 'Issue',
        entityId: issues[1].id,
        details: 'Escalated fire suppression cert issue to Level 2 - regional intervention',
        createdAt: new Date('2026-02-15T08:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: rachel.id,
        action: 'CREATE',
        entityType: 'StockRequest',
        entityId: stockRequests[0].id,
        details: 'Created monthly restocking order for Downtown Flagship (3 items)',
        createdAt: new Date('2026-03-15T09:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: marcus.id,
        action: 'APPROVE',
        entityType: 'StockRequest',
        entityId: stockRequests[0].id,
        details: 'Approved stock request for Downtown Flagship',
        createdAt: new Date('2026-03-15T11:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: carlos.id,
        action: 'UPDATE',
        entityType: 'PromoCheck',
        entityId: promoChecks[0].id,
        details: 'Completed Spring Collection Launch promo check at Downtown Flagship - all items confirmed',
        createdAt: new Date('2026-03-23T14:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: nathan.id,
        action: 'RETURN',
        entityType: 'Audit',
        entityId: audits[11].id,
        details: 'Audit returned for East Ridge Mall - significant inventory discrepancies require remediation',
        createdAt: new Date('2026-01-31T10:00:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: sandra.id,
        action: 'VIEW',
        entityType: 'Report',
        entityId: 'monthly-compliance-2026-03',
        details: 'HQ Director viewed March 2026 monthly compliance report',
        createdAt: new Date('2026-03-29T06:15:00Z'),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: leo.id,
        action: 'UPDATE',
        entityType: 'Issue',
        entityId: issues[3].id,
        details: 'Marked expired products issue as resolved. Corrective actions implemented.',
        createdAt: new Date('2026-03-06T16:00:00Z'),
      },
    }),
  ]);
  console.log(`Created ${auditLogs.length} audit log entries`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\nSeed complete! Summary:');
  console.log('  Organization: 1');
  console.log('  Regions:      4');
  console.log('  Areas:        8');
  console.log(`  Branches:     ${branches.length}`);
  console.log(`  Users:        ${users.length}`);
  console.log('  Templates:    3');
  console.log(`  Audits:       ${audits.length}`);
  console.log(`  Issues:       ${issues.length}`);
  console.log(`  Escalations:  ${escalations.length}`);
  console.log(`  Promo Checks: ${promoChecks.length}`);
  console.log(`  Stock Reqs:   ${stockRequests.length}`);
  console.log(`  Notifications:${notifications.length}`);
  console.log(`  Audit Logs:   ${auditLogs.length}`);

  // ---------------------------------------------------------------------------
  // SOP Documents (6)
  // ---------------------------------------------------------------------------
  const sopDocuments = await Promise.all([
    prisma.sopDocument.create({
      data: {
        title: 'Food Safety & Hygiene Standards',
        description: 'Comprehensive food safety and hygiene protocols covering handling, storage, preparation, and serving standards for all branch locations.',
        category: 'Safety',
        version: '4.2',
        status: 'CURRENT',
        sections: 12,
        createdById: sandra.id,
        content: `Section 1: Purpose and Scope

This Standard Operating Procedure establishes the food safety and hygiene requirements for all Xyloquent Corp branch locations. It applies to all employees who handle, prepare, store, or serve food products. Compliance with this SOP is mandatory and subject to regular audit verification.

Section 2: Personal Hygiene Requirements

All food-handling staff must wash hands thoroughly with soap and warm water for a minimum of 20 seconds before starting work, after using the restroom, after handling raw products, and after any activity that may contaminate hands. Hand sanitizer may be used as a supplement but not a replacement for hand washing.

Staff must wear clean uniforms, hair nets or caps, and disposable gloves when handling ready-to-eat items. Jewelry (except plain wedding bands) must be removed before entering food preparation areas. Any cuts, burns, or skin infections must be covered with waterproof bandages and gloves.

Section 3: Temperature Control and Cold Chain

All refrigerated products must be stored at or below 40 degrees F (4 degrees C). Frozen products must be maintained at 0 degrees F (-18 degrees C) or below. Temperature logs must be recorded every 4 hours during operating hours using the digital monitoring system.

Hot-held items must maintain a minimum internal temperature of 140 degrees F (60 degrees C). Cold-held items must not exceed 40 degrees F (4 degrees C). Any product found outside these ranges for more than 2 hours must be discarded immediately and documented in the waste log.

Section 4: Receiving and Storage

All deliveries must be inspected upon arrival. Check temperatures of refrigerated and frozen items with a calibrated thermometer. Reject any shipment where cold chain integrity is compromised. Document all receiving inspections in the delivery log.

Apply the FIFO (First In, First Out) rotation method to all inventory. Label all products with received date and use-by date. Store raw proteins on the lowest shelves to prevent cross-contamination. Maintain minimum 6-inch clearance from floors for all storage.

Section 5: Cross-Contamination Prevention

Separate cutting boards and utensils must be used for raw proteins, produce, and ready-to-eat items. Color-coded equipment is provided: red for raw meat, green for produce, blue for seafood, and white for ready-to-eat items.

Never store raw proteins above ready-to-eat items. Clean and sanitize all food contact surfaces between uses with approved sanitizing solution at 200ppm concentration. Replace sanitizer solution every 2 hours or when visibly soiled.

Section 6: Cleaning and Sanitization Schedule

Daily cleaning tasks include all food contact surfaces, floors, equipment exteriors, and restrooms. Weekly deep cleaning covers behind and under equipment, ventilation hoods, and walk-in cooler floors. Monthly cleaning includes ceiling tiles, light fixtures, and exterior areas.

Use only approved cleaning chemicals from the designated supply list. Follow manufacturer dilution ratios exactly. Never mix different cleaning products. Store all chemicals in the locked chemical storage area, separated from food products.

Section 7: Pest Control

Report any evidence of pest activity immediately to the shift manager. Do not attempt to apply pesticides or set traps without authorization. The contracted pest control service conducts monthly inspections and treatments.

Maintain all exterior doors with self-closing mechanisms and door sweeps. Seal any gaps or cracks in walls, floors, and around utility penetrations. Keep dumpster areas clean and lids closed at all times.

Section 8: Allergen Management

All menu items containing the eight major allergens must be clearly labeled. Staff must be trained to respond to allergen inquiries and know the composition of all menu items.

When preparing allergen-free orders, use dedicated equipment and clean all surfaces thoroughly. Any allergen-related incident must be reported to management immediately and documented in the incident log.

Section 9: Emergency Food Safety Procedures

In the event of a power outage, do not open refrigerator or freezer doors. If power is not restored within 4 hours, begin transferring critical items to backup cold storage. Document all temperature readings during the outage.

Section 10: Training and Certification

All new employees must complete food safety orientation within their first week. Annual recertification is required for all food-handling staff. Training records must be maintained on file for a minimum of 3 years.

Section 11: Record Keeping

Maintain all food safety records for a minimum of 1 year. This includes temperature logs, receiving records, cleaning schedules, pest control reports, and training certificates. Records must be available for inspection at all times.

Section 12: Compliance and Enforcement

Violations of food safety procedures will result in progressive disciplinary action. Critical violations require immediate corrective action. Branches will be audited quarterly on food safety compliance. Scores below 80% will trigger an immediate follow-up audit within 30 days.`,
        createdAt: new Date('2025-08-10T09:00:00Z'),
        updatedAt: new Date('2026-03-15T14:30:00Z'),
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Customer Service Protocol',
        description: 'Standard customer service procedures including greeting standards, complaint resolution, escalation paths, and service recovery guidelines.',
        category: 'Operations',
        version: '3.1',
        status: 'CURRENT',
        sections: 8,
        createdById: sandra.id,
        content: `Section 1: Service Philosophy

Xyloquent Corp is committed to delivering an exceptional customer experience at every touchpoint. Our service philosophy centers on three core principles: Warmth, Efficiency, and Resolution. Every interaction should leave customers feeling valued and satisfied.

Section 2: Greeting and Engagement Standards

Every customer must be acknowledged within 10 seconds of entering the branch. The standard greeting is warm, natural, and includes eye contact. Staff should use the customer's name when known.

During peak hours, a queue acknowledgment is acceptable when immediate personal attention is not possible. Never let a customer feel ignored. If hands are occupied, a smile and nod convey attention.

Section 3: Service Timing Standards

Counter service transactions should be completed within 3 minutes. Consultation-based interactions should not exceed 10 minutes without a status update to the customer. Phone calls must be answered within 3 rings during business hours.

Wait times exceeding 5 minutes require a proactive update from staff. If wait times exceed 10 minutes, offer a complimentary item or service recovery gesture as appropriate.

Section 4: Complaint Handling (HEART Method)

Follow the HEART method for all customer complaints:
H - Hear the customer out completely without interruption
E - Empathize with their situation
A - Apologize sincerely, taking ownership regardless of fault
R - Resolve the issue with a concrete solution within your authority
T - Thank the customer for bringing the issue to your attention

Document all complaints in the customer feedback system within 1 hour of resolution.

Section 5: Escalation Matrix

Level 1 (Staff): Product quality issues, simple refund requests, information inquiries. Resolution authority up to $25 in service recovery.
Level 2 (Shift Supervisor): Repeated complaints, complex refund requests, staffing-related issues. Resolution authority up to $75.
Level 3 (Branch Manager): Safety concerns, discrimination complaints, legal threats, social media incidents. Resolution authority up to $250.
Level 4 (Regional/HQ): Any incident involving injury, media attention, or potential legal liability. Immediate escalation required.

Section 6: Phone and Digital Communication

Answer all calls with the standard greeting. Never place a caller on hold for more than 60 seconds without checking back. Respond to all email inquiries within 24 business hours. Social media mentions must be flagged to management.

Section 7: Accessibility and Inclusion

Provide assistance to customers with disabilities proactively but respectfully. Service animals are always welcome. Maintain accessible pathways and ensure ADA compliance in all service areas. Language assistance resources are available through the company language line.

Section 8: Service Recovery and Follow-Up

For any significant service failure, follow up with the customer within 48 hours by phone or email. Offer a tangible gesture of goodwill proportional to the inconvenience. Track all service recovery actions in the Xyloquent Branch system.`,
        createdAt: new Date('2025-06-15T10:00:00Z'),
        updatedAt: new Date('2026-02-28T11:00:00Z'),
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Inventory Management Guide',
        description: 'Complete guide to inventory management including ordering, receiving, storage, rotation, counting procedures, and waste tracking.',
        category: 'Inventory',
        version: '2.5',
        status: 'CURRENT',
        sections: 15,
        createdById: sandra.id,
        content: `Section 1: Overview

This SOP governs all inventory management activities across Xyloquent Corp branches. Proper inventory management ensures product availability, minimizes waste, controls costs, and supports accurate financial reporting.

Section 2: Inventory Classification

Products are classified into three tiers based on value and velocity:
Tier A: High-value or high-velocity items requiring daily monitoring
Tier B: Medium-value items requiring weekly monitoring
Tier C: Low-value or slow-moving items requiring monthly monitoring

Section 3: Par Level Management

Par levels (minimum stock quantities) are established for all Tier A and Tier B items. Par levels are reviewed and adjusted quarterly based on sales trends, seasonality, and promotional calendars. When stock falls below par level, an automatic reorder notification is generated in Xyloquent Branch.

Section 4: Ordering Procedures

Standard orders must be placed by 2:00 PM local time for next-day delivery. Emergency orders incur a 15% surcharge and should only be placed for critical stock-outs. All orders must be placed through the Xyloquent Branch procurement module.

Section 5: Receiving Procedures

All deliveries must be inspected by a trained receiver. Check delivery against the purchase order for accuracy in items, quantities, and pricing. Temperature-sensitive items must be checked with a calibrated probe thermometer. Move perishable items to appropriate storage within 15 minutes of acceptance.

Section 6: Storage Requirements

Maintain organized storage areas with clear labeling and adequate lighting. Store items at least 6 inches off the floor. Follow strict temperature zones: Dry storage 50-70F, Refrigerated 35-40F, Frozen 0F or below.

Section 7: FIFO Rotation

All inventory must be rotated using the First In, First Out method. New stock goes behind or below existing stock. Date labels must be applied to all items at time of receiving. Conduct FIFO spot checks daily during the morning shift.

Section 8: Cycle Counting

Tier A items: counted daily. Tier B items: counted weekly (every Monday). Tier C items: counted monthly (first business day of month). All counts must be entered into Xyloquent Branch by end of the counting day. Variances exceeding 3% must be investigated.

Section 9: Full Physical Inventory

Conduct a full physical inventory on the last business day of each quarter. All staff participate in the count. Two-person count teams are required for accuracy. Blind counts are mandatory.

Section 10: Waste Tracking

All waste must be recorded in the waste log with reason codes: Expired, Damaged, Preparation Waste, Customer Return, or Theft/Shrinkage. Weekly waste reports are generated automatically. Branches exceeding the waste threshold (2% of sales) receive a waste reduction action plan.

Section 11: Returns and Credits

Initiate vendor returns within 48 hours of identifying non-conforming product. Photograph all items being returned. File credit requests in the procurement module.

Section 12: Inventory Adjustments

All inventory adjustments must be approved by the branch manager. Adjustments exceeding $500 require area manager approval. Document the reason for every adjustment.

Section 13: Seasonal and Promotional Inventory

Seasonal inventory must be ordered according to the promotional calendar distributed by HQ. Pre-orders close 30 days before promotion start date. Post-promotion inventory must be assessed within 3 days.

Section 14: Vendor Management

Maintain relationships with approved vendors only. Report any vendor performance issues through the vendor scorecard system. Vendor reviews are conducted quarterly.

Section 15: System and Technology

Xyloquent Branch is the system of record for all inventory data. Manual workarounds are permitted only during system outages and must be reconciled within 24 hours of system restoration.`,
        createdAt: new Date('2025-09-01T08:00:00Z'),
        updatedAt: new Date('2026-01-20T16:00:00Z'),
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Emergency Response Procedures',
        description: 'Emergency response protocols covering fire, medical, severe weather, active threat, power outage, and building evacuation procedures.',
        category: 'Safety',
        version: '5.0',
        status: 'CURRENT',
        sections: 6,
        createdById: sandra.id,
        content: `Section 1: General Emergency Principles

In any emergency, prioritize human safety above all else. Property and inventory are replaceable; people are not. All staff must know the location of emergency exits, fire extinguishers, first aid kits, and the emergency assembly point.

The designated Emergency Coordinator for each shift is the senior manager on duty. In their absence, the most senior staff member assumes the role.

Section 2: Fire Emergency

Upon discovering a fire or smoke: activate the nearest fire alarm pull station, call 911 immediately. If the fire is small and you have been trained, attempt to extinguish using the nearest fire extinguisher (PASS technique: Pull, Aim, Squeeze, Sweep). If the fire cannot be controlled immediately, evacuate using the nearest safe exit. Do not use elevators. Close doors behind you. Proceed to the assembly point. Account for all staff and customers.

Do not re-enter the building until cleared by fire officials.

Section 3: Medical Emergency

For any medical emergency: assess the scene for safety, call 911 for any life-threatening condition, administer first aid within your training level. AED devices are located at the main entrance and break room. Do not move an injured person unless in immediate danger. Designate someone to meet paramedics.

Report all medical incidents to the branch manager within 1 hour. Complete an incident report in Xyloquent Branch within 24 hours.

Section 4: Severe Weather

When a severe weather warning is issued: monitor local weather alerts, notify all staff and customers. For tornado warnings, move everyone to the interior safe room. For flooding, move to upper floors if applicable. Do not walk or drive through floodwater. Remain sheltered until all-clear is issued.

Section 5: Active Threat / Security Incident

Follow the RUN-HIDE-FIGHT protocol. RUN: If there is a safe escape path, leave immediately. HIDE: If escape is not possible, find a secure hiding place, lock and barricade doors, silence phones. FIGHT: As an absolute last resort only. Report all security incidents to law enforcement and corporate security immediately.

Section 6: Power Outage and Building Systems Failure

During a power outage: remain calm, use flashlights (not candles), emergency lighting should activate automatically. If emergency lighting fails, evacuate. Secure all cash registers. Do not open refrigerators unnecessarily. If power is not restored within 2 hours, begin food safety protocols for temperature-sensitive inventory.

For gas leak: evacuate immediately, do not use electrical devices, call 911 from outside. For water main break: shut off the main water valve if accessible, contact facilities management.`,
        createdAt: new Date('2025-04-20T07:00:00Z'),
        updatedAt: new Date('2026-03-01T09:45:00Z'),
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Visual Merchandising Standards',
        description: 'Brand visual standards for in-store displays, signage placement, product presentation, window displays, and seasonal decoration guidelines.',
        category: 'Brand',
        version: '1.8',
        status: 'UNDER_REVIEW',
        sections: 10,
        createdById: sandra.id,
        content: `Section 1: Brand Identity Overview

Visual merchandising at Xyloquent Corp branches must consistently reflect our brand identity: modern, warm, and premium. Every visual element from signage to product display should communicate quality and attention to detail.

Section 2: Window Displays

Window displays are the first impression for walk-in traffic. Refresh window displays according to the seasonal calendar (minimum quarterly). Key principles: clean glass (inside and out, cleaned daily), adequate lighting (spotlights angled at 30 degrees), minimal clutter (rule of three for product groupings), and clear pricing where applicable.

Section 3: Interior Signage Standards

All signage must use approved templates from the marketing portal. Hand-written signs are not permitted in customer-facing areas. Signage must be level, clean, and in good condition. Pricing signs must be accurate and updated within 24 hours of any price change.

Section 4: Product Display Guidelines

Maintain fully stocked displays during all operating hours. Follow the planogram provided for each product category. Product facing must be done every 2 hours during peak periods and at close of each shift. Remove any damaged or soiled packaging from the sales floor immediately.

Section 5: Lighting Standards

Maintain all lighting fixtures in working order. Replace burned-out bulbs within 24 hours. Ambient lighting levels should be maintained at 50-75 foot-candles in retail areas and 30-50 foot-candles in seating areas. Lighting should be warm white (2700K-3000K).

Section 6: Cleanliness and Presentation

The sales floor, fixtures, and displays must be spotless at all times. Dust and wipe all display surfaces daily. Vacuum or mop floors every 2 hours during operating hours. Remove clutter, personal items, and non-approved materials from customer-visible areas.

Section 7: Seasonal and Promotional Displays

Follow the promotional display guide for each campaign. Install promotional materials according to the planogram and timeline provided. Photograph completed installations and upload to Xyloquent Branch for verification. Use only approved decoration items.

Section 8: Digital Displays and Menu Boards

Ensure all digital displays are powered on and showing current content during operating hours. Report any malfunctions to IT support immediately. Menu boards must reflect current offerings and pricing.

Section 9: Exterior and Curb Appeal

Maintain clean and inviting exterior areas. Sweep entrance and sidewalk areas twice daily. Keep trash receptacles emptied. Exterior signage must be illuminated during all dark hours. Seasonal banners and flags must be installed according to the marketing calendar.

Section 10: Visual Audit and Compliance

Branch managers must conduct a daily visual walk-through using the Visual Standards Checklist in Xyloquent Branch. Mystery shopper evaluations include visual merchandising scoring. Branches scoring below 80% on visual standards will receive a corrective action plan.`,
        createdAt: new Date('2025-11-05T11:00:00Z'),
        updatedAt: new Date('2025-12-10T15:30:00Z'),
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Cash Handling & POS Operations',
        description: 'Procedures for cash handling, point-of-sale operations, daily reconciliation, deposit procedures, and loss prevention measures.',
        category: 'Finance',
        version: '3.3',
        status: 'CURRENT',
        sections: 9,
        createdById: sandra.id,
        content: `Section 1: Purpose

This SOP establishes the procedures for all cash handling and point-of-sale operations at Xyloquent Corp branches. Strict adherence protects the company, employees, and customers from financial loss and fraud.

Section 2: Cash Register Operations

Each cash register must be assigned to a single operator per shift. Register assignment is logged in the POS system at the start of each shift. Do not share register access codes. Begin each shift with a verified starting bank amount ($200 standard). Count the bank in the presence of a witness and sign the count sheet.

Keep the register drawer closed when not actively making change. Do not leave a register unattended with the drawer open.

Section 3: Transaction Processing

Process all transactions through the POS system. No off-system transactions are permitted. For cash transactions: announce the amount received, place the bill on the register ledge until change is made, count change back to the customer, then place the bill in the drawer.

Void transactions require supervisor authorization. Refunds require branch manager approval for amounts over $50. All refunds must be processed to the original payment method when possible.

Section 4: Safe Management

The branch safe is accessible only to the branch manager and designated key holders. Safe combinations must be changed every 90 days. Cash in the register should not exceed $500 at any time. Perform safe drops whenever the register exceeds $300 in accumulated cash.

Section 5: Daily Reconciliation

At the end of each shift, each register operator must count their drawer and complete a shift report. The count must match the POS system total within a $2 variance. The closing manager reconciles all registers, safe contents, and POS reports before leaving. The daily reconciliation report must be submitted in Xyloquent Branch by midnight.

Over/short patterns are monitored by loss prevention. Three instances of shortages exceeding $5 in a 30-day period will trigger a formal investigation.

Section 6: Bank Deposit Procedures

Prepare bank deposits daily. Count all cash with a witness. Seal the deposit in a tamper-evident bank bag. Deposits must be transported using the approved armored carrier service or by the branch manager using a varied schedule. Verify deposit receipt within 48 hours.

Section 7: Gift Card and Stored Value

Activate gift cards only at the time of purchase. Do not pre-activate cards. Report any suspicious gift card activity (bulk purchases, requests for specific card numbers) to loss prevention immediately.

Section 8: Loss Prevention Measures

Security cameras cover all register areas and the safe. Do not obstruct camera views. Never count cash in view of customers. Perform all cash counts in the back office. Employee purchases must be processed by another team member, never self-processed.

Section 9: POS System Administration

POS system access is role-based: cashiers have transaction access only, supervisors have void and discount authority, managers have full administrative access. Report any POS malfunctions to IT support immediately. System updates are deployed overnight; verify POS functionality at the start of each business day.`,
        createdAt: new Date('2025-07-22T13:00:00Z'),
        updatedAt: new Date('2026-03-22T10:00:00Z'),
      },
    }),
  ]);
  console.log(`Created ${sopDocuments.length} SOP documents`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\nSeed complete! Summary:');
  console.log('  Organization: 1');
  console.log('  Regions:      4');
  console.log('  Areas:        8');
  console.log(`  Branches:     ${branches.length}`);
  console.log(`  Users:        ${users.length}`);
  console.log('  Templates:    3');
  console.log(`  Audits:       ${audits.length}`);
  console.log(`  Issues:       ${issues.length}`);
  console.log(`  Escalations:  ${escalations.length}`);
  console.log(`  Promo Checks: ${promoChecks.length}`);
  console.log(`  Stock Reqs:   ${stockRequests.length}`);
  console.log(`  Notifications:${notifications.length}`);
  console.log(`  Audit Logs:   ${auditLogs.length}`);
  console.log(`  SOP Docs:     ${sopDocuments.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
