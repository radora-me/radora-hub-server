import { generateRadoraNextChecklistSections } from './radoraNextData.js';

const radoraNextSections = generateRadoraNextChecklistSections();
const totalItemsCount = radoraNextSections.reduce((acc, s) => acc + (s.items?.length || 0), 0);

export const defaultProjects = [
  {
    _id: "proj-radora-next",
    title: "Radora Next",
    code: "RAD-NEXT",
    description: "Enterprise multi-portal educational & institutional management platform. System architecture across all six portals (Admin, Teacher, Student, Parent, Staff, Accountant/Finance) and 17 operational workflows — tracking platform build and QA status.",
    category: "Engineering",
    status: "In Progress",
    priority: "Urgent",
    lead: "Radora Architecture Team",
    team: [
      "Admin Portal Lead",
      "Teacher Portal Lead",
      "Student Portal Lead",
      "Parent Portal Lead",
      "Staff Portal Lead",
      "Finance Lead"
    ],
    tags: ["Radora Next", "6 Portals", "Enterprise", "Full Architecture", "QA Tracking"],
    startDate: "2026-09-01",
    targetDate: "2026-12-31",
    progress: 0
  }
];

export const defaultChecklists = [
  {
    _id: "chk-radora-next-features",
    projectId: "proj-radora-next",
    title: "Radora Next Feature List",
    description: "System architecture checklist across all six portals — track build / QA status across the whole platform.",
    category: "Engineering",
    templateId: "tpl-radora-next-full",
    totalItems: totalItemsCount,
    completedItems: 0,
    progress: 0,
    sections: radoraNextSections
  }
];

export const defaultTemplates = [
  {
    _id: "tpl-radora-next-full",
    name: "Radora Next — Full Platform Checklist",
    category: "Engineering",
    description: "Official 6-portal blueprint covering Admin, Teacher, Student, Parent, Staff, and Accountant/Finance portals with all 17 workflow sequences.",
    isBuiltin: true,
    estimatedHours: 120,
    tags: ["Radora Next", "6 Portals", "Architecture", "Full Feature Set"],
    sections: radoraNextSections.map(sec => ({
      id: sec.id,
      name: sec.name,
      items: sec.items.map(itm => ({
        id: itm.id,
        text: itm.text,
        description: itm.description,
        priority: itm.priority,
        defaultAssigneeRole: itm.assignee,
        guidelines: `Verify end-to-end functionality for ${itm.text}.`
      }))
    }))
  },
  {
    _id: "tpl-golive-01",
    name: "Radora Production Go-Live Checklist",
    category: "Cloud Ops",
    description: "End-to-end deployment, verification, security, and rollback checklist for Radora production releases.",
    isBuiltin: true,
    estimatedHours: 8,
    tags: ["DevOps", "Release", "Production"],
    sections: [
      {
        id: "sec-pre-flight",
        name: "1. Pre-Deployment & Readiness",
        items: [
          {
            id: "itm-pf-1",
            text: "Release notes signed off by Product & Engineering Leads",
            description: "Verify changelog, breaking changes, and migration scripts are documented.",
            priority: "Critical",
            defaultAssigneeRole: "Tech Lead",
            guidelines: "Ensure version bump matches semantic versioning."
          },
          {
            id: "itm-pf-2",
            text: "Database backup & snapshot completed",
            description: "Execute automated snapshot of production DB cluster and verify snapshot restoration point.",
            priority: "Critical",
            defaultAssigneeRole: "DBA / DevOps",
            guidelines: "Confirm backup size and checksum."
          }
        ]
      }
    ]
  }
];
