export const ROADMAP_STEPS = [
  { key: "overview", title: "Overview" },
  { key: "structure", title: "Courses" },
  { key: "careers", title: "Careers" },
  { key: "internships", title: "Internships" },
  { key: "societies", title: "Societies" },
];

export const stepNumber = (key) => ROADMAP_STEPS.findIndex((s) => s.key === key) + 1;

export const roadmapStepUrl = (key) => `/roadmap-entryload?step=${stepNumber(key)}`;
