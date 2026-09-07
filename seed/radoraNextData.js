// Complete Radora Next Full Feature Checklist specification
// 6 Portals, 60+ Modules, ~370 Features, 17 Workflow Sequences

export const rawRadoraNextSections = [
  // ==================== 1. ADMIN PORTAL ====================
  {
    portal: "Admin Portal",
    module: "Dashboard Management",
    items: [
      "View Stats",
      "Announcements",
      "System Health",
      "Quick Actions",
      "Alerts Monitoring"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Student Management",
    items: [
      "Add Students",
      "Edit Students",
      "Delete Students",
      "Bulk Import",
      "Profile Management",
      "Enrollment",
      "Class Assignment",
      "Section Assignment",
      "Guardian Linking",
      "Document Verification",
      "Student Promotion",
      "Transfer Management",
      "Alumni Archiving"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Teacher Management",
    items: [
      "Hire Teachers",
      "Assign Subjects",
      "Manage Profiles",
      "Performance Tracking",
      "Department Assignment",
      "Workload Allocation",
      "Qualification Records",
      "Contract Management",
      "Leave Oversight"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Staff Management",
    items: [
      "Add Staff",
      "Assign Roles",
      "Attendance Tracking",
      "Payroll Coordination",
      "Department Mapping",
      "Document Records",
      "Shift Assignment",
      "Performance Reviews"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Attendance System",
    items: [
      "Mark Attendance",
      "View Reports",
      "Generate Analytics",
      "Absence Tracking",
      "Late Arrival Tracking",
      "Class Wise Attendance",
      "Teacher Attendance",
      "Staff Attendance",
      "Attendance Corrections",
      "Leave Linked Attendance"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Timetable Management",
    items: [
      "Create Schedules",
      "Assign Classes",
      "Manage Periods",
      "Room Allocation",
      "Teacher Availability Mapping",
      "Conflict Detection",
      "Exam Timetable Coordination",
      "Substitution Planning",
      "Timetable Publishing"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Exam Management",
    items: [
      "Schedule Exams",
      "Create Question Banks",
      "Publish Results",
      "Grade Management",
      "Exam Hall Allocation",
      "Invigilator Assignment",
      "Marks Moderation",
      "Report Card Generation",
      "Result Approval Workflow"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Fee Management",
    items: [
      "Fee Structure",
      "Payment Tracking",
      "Generate Invoices",
      "Defaulter Reports",
      "Scholarship Mapping",
      "Discount Rules",
      "Late Fee Rules",
      "Receipt Verification",
      "Refund Handling"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Academic Management",
    items: [
      "Curriculum Planning",
      "Syllabus Tracking",
      "Academic Calendar",
      "Subject Configuration",
      "Classwise Curriculum",
      "Term Planning",
      "Learning Outcomes",
      "Promotion Rules"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Notifications and Announcements",
    items: [
      "Send Alerts",
      "Compose Messages",
      "Priority Management",
      "Target Audience Selection",
      "Scheduled Notifications",
      "Email Delivery",
      "SMS Delivery",
      "In-App Alerts",
      "Read Status Tracking"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Reports and Analytics",
    items: [
      "Attendance Reports",
      "Performance Reports",
      "Financial Reports",
      "Admission Reports",
      "Staff Reports",
      "Transport Reports",
      "Library Reports",
      "Custom Report Builder",
      "Data Export"
    ]
  },
  {
    portal: "Admin Portal",
    module: "System Settings",
    items: [
      "User Permissions",
      "School Configuration",
      "Backup Management",
      "Session Settings",
      "Branding Settings",
      "Academic Year Setup",
      "Role Policies",
      "Notification Preferences",
      "Data Retention Rules"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Admin Workflow - Admission",
    isWorkflow: true,
    items: [
      "Receive Inquiry",
      "Register Applicant",
      "Verify Documents",
      "Approve Admission",
      "Assign Class",
      "Generate Student ID",
      "Activate Portal Access"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Admin Workflow - Daily Operations",
    isWorkflow: true,
    items: [
      "Review Dashboard",
      "Check Attendance Exceptions",
      "Approve Requests",
      "Publish Announcements",
      "Monitor Fees",
      "Review Reports"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Admin Workflow - Examination",
    isWorkflow: true,
    items: [
      "Create Exam Plan",
      "Assign Subjects",
      "Publish Schedule",
      "Collect Marks",
      "Approve Results",
      "Release Report Cards"
    ]
  },
  {
    portal: "Admin Portal",
    module: "Admin Workflow - Fee Collection",
    isWorkflow: true,
    items: [
      "Define Fee Heads",
      "Generate Invoices",
      "Track Payments",
      "Send Reminders",
      "Mark Defaulters",
      "Close Billing Cycle"
    ]
  },

  // ==================== 2. TEACHER PORTAL ====================
  {
    portal: "Teacher Portal",
    module: "Teacher Dashboard",
    items: [
      "Class Overview",
      "Schedule",
      "Pending Tasks",
      "Upcoming Lessons",
      "Recent Notifications",
      "Submission Summary"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "My Courses",
    items: [
      "View Assigned Subjects",
      "Course Materials",
      "Syllabus",
      "Course Objectives",
      "Unit Planning",
      "Resource Sharing"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Student Management",
    items: [
      "View Enrolled Students",
      "Student Profiles",
      "Performance Tracking",
      "Behavior Notes",
      "Participation Records",
      "Support Flags"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Attendance Marking",
    items: [
      "Mark Daily Attendance",
      "View Attendance History",
      "Late Entries",
      "Bulk Marking",
      "Attendance Corrections",
      "Absence Remarks"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Homework Management",
    items: [
      "Create Assignments",
      "Set Deadlines",
      "Attach Resources",
      "Assign By Class",
      "Assign By Section",
      "Rubric Definition"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Submission Review",
    items: [
      "View Submissions",
      "Grade Work",
      "Provide Feedback",
      "Return For Revision",
      "Plagiarism Check",
      "Attachment Review"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Exam Management",
    items: [
      "Create Tests",
      "Conduct Exams",
      "Enter Marks",
      "Grade Sheets",
      "Question Paper Upload",
      "Practical Assessment",
      "Result Verification"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Gradebook",
    items: [
      "Maintain Grades",
      "Calculate Averages",
      "Generate Report Cards",
      "Weightage Rules",
      "Subjectwise Analysis",
      "Termwise Records"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Class Communication",
    items: [
      "Send Announcements",
      "Parent Communication",
      "Student Messages",
      "Class Discussion Updates",
      "Meeting Requests",
      "Communication History"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Lesson Planning",
    items: [
      "Create Lesson Plans",
      "Track Progress",
      "Resource Library",
      "Learning Outcomes",
      "Activity Planning",
      "Assessment Mapping"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Personal Schedule",
    items: [
      "View Timetable",
      "Manage Availability",
      "Leave Requests",
      "Substitution Details",
      "Meeting Calendar"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Teacher Profile",
    items: [
      "Update Information",
      "Qualifications",
      "Professional Development",
      "Document Uploads",
      "Experience Records"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Teacher Workflow - Daily Teaching",
    isWorkflow: true,
    items: [
      "Open Dashboard",
      "Review Schedule",
      "Access Course Materials",
      "Take Attendance",
      "Deliver Lesson",
      "Assign Homework",
      "Respond To Messages"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Teacher Workflow - Assignment",
    isWorkflow: true,
    items: [
      "Create Assignment",
      "Set Deadline",
      "Publish To Class",
      "Receive Submissions",
      "Evaluate Work",
      "Share Feedback",
      "Update Gradebook"
    ]
  },
  {
    portal: "Teacher Portal",
    module: "Teacher Workflow - Examination",
    isWorkflow: true,
    items: [
      "Prepare Test",
      "Schedule Assessment",
      "Conduct Exam",
      "Enter Marks",
      "Review Results",
      "Publish Grades"
    ]
  },

  // ==================== 3. STUDENT PORTAL ====================
  {
    portal: "Student Portal",
    module: "Student Dashboard",
    items: [
      "Attendance Percentage",
      "Upcoming Classes",
      "Pending Homework",
      "Recent Grades",
      "Announcements",
      "Quick Links"
    ]
  },
  {
    portal: "Student Portal",
    module: "Attendance View",
    items: [
      "Personal Attendance History",
      "Monthly Reports",
      "Apply For Leave",
      "Absence Reasons",
      "Attendance Alerts"
    ]
  },
  {
    portal: "Student Portal",
    module: "Homework Section",
    items: [
      "View Assignments",
      "Submit Work",
      "Track Deadlines",
      "View Grades",
      "Feedback Review",
      "Resubmission Status"
    ]
  },
  {
    portal: "Student Portal",
    module: "Timetable",
    items: [
      "Weekly Schedule",
      "Class Timings",
      "Room Numbers",
      "Teacher Info",
      "Exam Timetable"
    ]
  },
  {
    portal: "Student Portal",
    module: "Exam Section",
    items: [
      "Exam Schedule",
      "Results",
      "Grade Reports",
      "Performance Analysis",
      "Subject Rankings",
      "Report Card Access"
    ]
  },
  {
    portal: "Student Portal",
    module: "Fee Management",
    items: [
      "View Fee Structure",
      "Payment History",
      "Pending Dues",
      "Online Payment",
      "Receipt Download",
      "Installment Details"
    ]
  },
  {
    portal: "Student Portal",
    module: "Academic Resources",
    items: [
      "Study Materials",
      "E-Library",
      "Video Lectures",
      "Notes",
      "Practice Papers",
      "Recorded Sessions"
    ]
  },
  {
    portal: "Student Portal",
    module: "AI Chat Assistant",
    items: [
      "Academic Help",
      "Doubt Clearing",
      "Study Guidance",
      "Homework Support",
      "Exam Preparation",
      "Concept Revision"
    ]
  },
  {
    portal: "Student Portal",
    module: "Classroom Chat",
    items: [
      "Real Time Messaging",
      "Group Discussions",
      "Peer Collaboration",
      "Teacher Queries",
      "Shared Resources"
    ]
  },
  {
    portal: "Student Portal",
    module: "Notifications",
    items: [
      "Announcements",
      "Reminders",
      "Important Alerts",
      "Deadline Alerts",
      "Fee Alerts"
    ]
  },
  {
    portal: "Student Portal",
    module: "Student Profile",
    items: [
      "Personal Info",
      "Academic History",
      "Achievements",
      "Certificates",
      "Guardian Information",
      "Documents"
    ]
  },
  {
    portal: "Student Portal",
    module: "Progress Tracking",
    items: [
      "Subject Wise Performance",
      "Attendance Trends",
      "Grade Analysis",
      "Goal Tracking",
      "Improvement Suggestions"
    ]
  },
  {
    portal: "Student Portal",
    module: "Student Workflow - Daily Learning",
    isWorkflow: true,
    items: [
      "Check Dashboard",
      "Review Timetable",
      "Attend Classes",
      "Access Resources",
      "Complete Homework",
      "Check Notifications"
    ]
  },
  {
    portal: "Student Portal",
    module: "Student Workflow - Homework Submission",
    isWorkflow: true,
    items: [
      "Open Assignment",
      "Review Instructions",
      "Upload Work",
      "Submit Before Deadline",
      "Track Evaluation",
      "Read Feedback"
    ]
  },
  {
    portal: "Student Portal",
    module: "Student Workflow - Examination",
    isWorkflow: true,
    items: [
      "Check Exam Schedule",
      "Prepare Using Resources",
      "Attend Exam",
      "View Results",
      "Analyze Performance"
    ]
  },

  // ==================== 4. PARENT PORTAL ====================
  {
    portal: "Parent Portal",
    module: "Parent Dashboard",
    items: [
      "Child Overview",
      "Recent Activities",
      "Important Notifications",
      "Fee Summary",
      "Attendance Snapshot"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Child Performance",
    items: [
      "View Grades",
      "Attendance",
      "Behavior Reports",
      "Progress Tracking",
      "Subject Comparison"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Attendance Monitoring",
    items: [
      "Daily Attendance",
      "Absence Reasons",
      "Leave Applications",
      "Attendance Trends",
      "Late Arrival Updates"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Fee Management",
    items: [
      "View Dues",
      "Payment History",
      "Make Online Payments",
      "Download Receipts",
      "Installment Tracking"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Communication",
    items: [
      "Message Teachers",
      "View Announcements",
      "Parent Teacher Meetings",
      "Reply To Notices",
      "Communication Records"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Homework Tracking",
    items: [
      "View Assigned Homework",
      "Submission Status",
      "Grades",
      "Deadline Monitoring",
      "Teacher Feedback"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Exam Results",
    items: [
      "View Report Cards",
      "Exam Schedules",
      "Performance Analysis",
      "Improvement Areas"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Timetable Access",
    items: [
      "View Child Schedule",
      "Teacher Contacts",
      "Room Details",
      "Activity Timings"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Leave Application",
    items: [
      "Apply Leave For Child",
      "Medical Certificates",
      "Approval Status",
      "Leave History"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Events and Calendar",
    items: [
      "School Events",
      "Holidays",
      "Parent Meetings",
      "Activities",
      "Reminder Alerts"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Parent Workflow - Monitoring",
    isWorkflow: true,
    items: [
      "Open Dashboard",
      "Review Attendance",
      "Check Homework",
      "Review Grades",
      "Read Notifications",
      "Message Teachers"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Parent Workflow - Fee Payment",
    isWorkflow: true,
    items: [
      "View Due Amount",
      "Choose Payment Method",
      "Complete Payment",
      "Download Receipt",
      "Confirm Payment Status"
    ]
  },
  {
    portal: "Parent Portal",
    module: "Parent Workflow - Leave Request",
    isWorkflow: true,
    items: [
      "Open Leave Section",
      "Enter Reason",
      "Upload Medical Proof",
      "Submit Request",
      "Track Approval"
    ]
  },

  // ==================== 5. STAFF PORTAL ====================
  {
    portal: "Staff Portal",
    module: "Staff Dashboard",
    items: [
      "Daily Tasks",
      "Attendance",
      "Announcements",
      "Shift Summary",
      "Pending Requests"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Attendance System",
    items: [
      "Mark Own Attendance",
      "View History",
      "Leave Balance",
      "Late Records",
      "Attendance Corrections"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Task Management",
    items: [
      "Assigned Duties",
      "Pending Tasks",
      "Task Completion",
      "Priority Flags",
      "Task Notes"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Leave Management",
    items: [
      "Apply Leave",
      "View Leave Balance",
      "Leave History",
      "Approval Tracking",
      "Document Attachments"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Payroll Access",
    items: [
      "View Salary Slips",
      "Tax Information",
      "Payment History",
      "Deductions",
      "Bank Details"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Resource Management",
    items: [
      "Inventory Tracking",
      "Equipment Allocation",
      "Maintenance Requests",
      "Stock Requests",
      "Usage Logs"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Communication",
    items: [
      "Internal Messaging",
      "Staff Announcements",
      "Notice Board",
      "Department Updates"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Staff Profile",
    items: [
      "Personal Details",
      "Role Information",
      "Documents",
      "Emergency Contacts",
      "Employment Details"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Duty Roster",
    items: [
      "View Shifts",
      "Duty Assignments",
      "Schedule Management",
      "Swap Requests",
      "Overtime Tracking"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Staff Workflow - Daily Duty",
    isWorkflow: true,
    items: [
      "Check Dashboard",
      "Mark Attendance",
      "Review Assigned Tasks",
      "Complete Duties",
      "Update Task Status",
      "Read Notices"
    ]
  },
  {
    portal: "Staff Portal",
    module: "Staff Workflow - Leave",
    isWorkflow: true,
    items: [
      "Check Leave Balance",
      "Apply Leave",
      "Attach Documents",
      "Submit For Approval",
      "Track Status"
    ]
  },

  // ==================== 6. ACCOUNTANT / FINANCE STAFF ====================
  {
    portal: "Accountant / Finance",
    module: "Finance Dashboard",
    items: [
      "Revenue Overview",
      "Pending Payments",
      "Expense Tracking",
      "Collection Trends",
      "Alerts"
    ]
  },
  {
    portal: "Accountant / Finance",
    module: "Fee Collection",
    items: [
      "Record Payments",
      "Generate Receipts",
      "Payment Modes",
      "Installment Entry",
      "Counter Collection",
      "Online Reconciliation"
    ]
  },
  {
    portal: "Accountant / Finance",
    module: "Fee Defaulters",
    items: [
      "Track Pending Dues",
      "Send Reminders",
      "Payment Plans",
      "Defaulter Classification",
      "Follow Up Notes"
    ]
  },
  {
    portal: "Accountant / Finance",
    module: "Expense Management",
    items: [
      "Record Expenses",
      "Categorize Spending",
      "Vendor Payments",
      "Approval Records",
      "Expense Vouchers"
    ]
  },
  {
    portal: "Accountant / Finance",
    module: "Salary Management",
    items: [
      "Process Payroll",
      "Generate Salary Slips",
      "Deductions",
      "Allowances",
      "Bank Transfer Records"
    ]
  },
  {
    portal: "Accountant / Finance",
    module: "Financial Reports",
    items: [
      "Income Statements",
      "Balance Sheets",
      "Cash Flow",
      "Audit Reports",
      "Collection Reports",
      "Expense Summaries",
      "Budget Planning"
    ]
  }
];

// Helper to convert raw sections into the standard Radora Hub checklist format
export const generateRadoraNextChecklistSections = () => {
  return rawRadoraNextSections.map((sec, sIdx) => {
    const isWf = sec.isWorkflow;
    const secName = isWf
      ? `⚡ [Workflow] ${sec.portal} — ${sec.module.replace(/.*Workflow - /, '')}`
      : `📋 ${sec.portal} — ${sec.module}`;

    return {
      id: `sec-rn-${sIdx + 1}`,
      portal: sec.portal,
      name: secName,
      items: sec.items.map((itmText, iIdx) => ({
        id: `itm-rn-${sIdx + 1}-${iIdx + 1}`,
        text: itmText,
        description: `${sec.portal} • ${sec.module} feature specification`,
        status: "Pending",
        priority: isWf ? "High" : (iIdx < 3 ? "High" : "Medium"),
        assignee: sec.portal.replace(" Portal", " Team"),
        dueDate: "",
        notes: "",
        completedAt: null
      }))
    };
  });
};
