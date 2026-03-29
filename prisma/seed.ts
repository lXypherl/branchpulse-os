import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding BranchPulse OS database...');

  // Hash the default password once and reuse for all users
  const defaultPasswordHash = await hashPassword('password123');

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
        evidenceUrls: ['https://storage.branchpulse.io/audits/nyc001-safety-01.jpg', 'https://storage.branchpulse.io/audits/nyc001-safety-02.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/nyc002-standard-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/nyc003-inventory-01.jpg', 'https://storage.branchpulse.io/audits/nyc003-inventory-02.jpg', 'https://storage.branchpulse.io/audits/nyc003-inventory-03.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/nyc004-safety-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/mia001-safety-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/mia003-safety-01.jpg', 'https://storage.branchpulse.io/audits/mia003-safety-02.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/sf001-inventory-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/dc002-standard-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/la002-inventory-01.jpg', 'https://storage.branchpulse.io/audits/la002-inventory-02.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/audits/phl003-safety-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/nyc004-lighting-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/nyc004-fire-cert-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/nyc003-fifo-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/nyc003-expired-01.jpg', 'https://storage.branchpulse.io/issues/nyc003-expired-02.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/la002-pos-01.pdf'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/phl003-plumbing-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/phl003-firepanel-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/atl002-door-01.jpg'],
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
        evidenceUrls: ['https://storage.branchpulse.io/issues/atl003-pothole-01.jpg'],
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
        message: 'Your weekly BranchPulse executive briefing is ready. Key highlights: SF Ferry Building achieved 100% compliance, 3 critical issues require attention.',
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
  // SOP Documents
  // ---------------------------------------------------------------------------
  const sopDocs = await Promise.all([
    prisma.sopDocument.create({
      data: {
        title: 'Food Safety & Hygiene Standards',
        description: 'Complete food safety protocols for all branch locations including storage, preparation, and serving guidelines.',
        category: 'Safety',
        version: '4.2',
        content: `# Food Safety & Hygiene Standards v4.2\n\n## Section 1: Temperature Control\nAll cold storage units must maintain temperatures between 0-4°C. Temperature logs must be recorded every 2 hours during operating hours.\n\n## Section 2: Personal Hygiene\nAll staff must wash hands before handling food, after breaks, and after handling raw products. Hand sanitizer stations must be available at all prep areas.\n\n## Section 3: Cross-Contamination Prevention\nSeparate cutting boards and utensils must be used for raw and cooked foods. Color-coded equipment: red for raw meat, green for vegetables, blue for fish.\n\n## Section 4: Storage Requirements\nFIFO (First In, First Out) must be followed. All items must be dated and labeled. Raw products stored below cooked products.\n\n## Section 5: Cleaning Schedules\nDaily deep clean of all prep surfaces. Weekly equipment sanitization. Monthly ventilation system cleaning.`,
        status: 'CURRENT',
        sections: 12,
        createdById: users[0].id,
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Customer Service Protocol',
        description: 'Standard operating procedures for customer interactions, complaint handling, and service recovery.',
        category: 'Operations',
        version: '3.1',
        content: `# Customer Service Protocol v3.1\n\n## Section 1: Greeting Standards\nEvery customer must be acknowledged within 30 seconds of entry. Use the standard greeting: "Welcome to [Branch Name], how can I help you today?"\n\n## Section 2: Complaint Resolution\nLevel 1: Staff resolves on the spot (refund up to $25). Level 2: Manager intervention (refund up to $100). Level 3: HQ escalation (over $100 or legal implications).\n\n## Section 3: Service Recovery\nAfter any complaint, offer a recovery gesture (discount, complimentary item). Log all complaints in the issue tracking system within 24 hours.`,
        status: 'CURRENT',
        sections: 8,
        createdById: users[0].id,
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Inventory Management Guide',
        description: 'Procedures for stock counting, reordering, waste tracking, and supplier management.',
        category: 'Inventory',
        version: '2.5',
        content: `# Inventory Management Guide v2.5\n\n## Section 1: Daily Stock Counts\nCritical items (perishables, high-value) counted daily. Full inventory count weekly on Sundays.\n\n## Section 2: Reorder Points\nAutomatic reorder triggered when stock falls below minimum level. Branch managers review and approve all orders over $500.\n\n## Section 3: Waste Tracking\nAll waste must be logged with reason codes. Monthly waste reports submitted to area manager. Target: less than 2% waste rate.`,
        status: 'CURRENT',
        sections: 15,
        createdById: users[0].id,
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Emergency Response Procedures',
        description: 'Protocols for fire, medical emergencies, security threats, and natural disasters.',
        category: 'Safety',
        version: '5.0',
        content: `# Emergency Response Procedures v5.0\n\n## Section 1: Fire Emergency\nActivate alarm, evacuate via nearest exit, call emergency services, account for all staff at assembly point.\n\n## Section 2: Medical Emergency\nCall emergency services, administer first aid if trained, do not move injured person unless in danger.\n\n## Section 3: Security Threat\nDo not confront. Activate silent alarm. Follow lockdown procedure. Cooperate with authorities.`,
        status: 'CURRENT',
        sections: 6,
        createdById: users[0].id,
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Visual Merchandising Standards',
        description: 'Guidelines for product displays, signage, and brand presentation across all locations.',
        category: 'Brand',
        version: '1.8',
        content: `# Visual Merchandising Standards v1.8\n\n## Section 1: Window Displays\nRefresh every 2 weeks. Follow seasonal campaign guidelines from HQ. Use approved fixtures and lighting.\n\n## Section 2: In-Store Layout\nMaintain clear sight lines. High-margin products at eye level. Impulse items near checkout.`,
        status: 'UNDER_REVIEW',
        sections: 10,
        createdById: users[0].id,
      },
    }),
    prisma.sopDocument.create({
      data: {
        title: 'Cash Handling & POS Operations',
        description: 'Procedures for cash management, POS system usage, end-of-day reconciliation, and fraud prevention.',
        category: 'Finance',
        version: '3.3',
        content: `# Cash Handling & POS Operations v3.3\n\n## Section 1: Opening Procedures\nCount float, verify against previous close. Log opening amount in POS system.\n\n## Section 2: Transaction Processing\nAll sales must be processed through POS. No off-system transactions. Void/refund requires manager PIN.\n\n## Section 3: End of Day\nCount all tills, reconcile against POS totals. Discrepancies over $5 must be reported to area manager.`,
        status: 'CURRENT',
        sections: 9,
        createdById: users[0].id,
      },
    }),
  ]);
  console.log(`Created ${sopDocs.length} SOP documents`);

  console.log(`  SOPs:         ${sopDocs.length}`);
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
