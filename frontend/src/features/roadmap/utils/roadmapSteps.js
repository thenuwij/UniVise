export const ROADMAP_VIEWS = {
  degree: {
    path: "/roadmap/unsw",
    steps: [
      { key: "structure", title: "My courses" },
      { key: "next", title: "Take next" },
      { key: "coursemesh", title: "CourseMesh" },
      { key: "societies", title: "Societies" },
    ],
  },
  careers: {
    path: "/careers",
    steps: [
      { key: "careers", title: "Careers" },
      { key: "internships", title: "Internships" },
    ],
  },
};

const viewOfStep = (key) =>
  Object.keys(ROADMAP_VIEWS).find((view) => ROADMAP_VIEWS[view].steps.some((s) => s.key === key)) || "degree";

export const roadmapViewPath = (view) => (ROADMAP_VIEWS[view] || ROADMAP_VIEWS.degree).path;

export const stepNumber = (key) => ROADMAP_VIEWS[viewOfStep(key)].steps.findIndex((s) => s.key === key) + 1;

export const roadmapViewUrl = (view) => (view === "careers" ? "/roadmap-entryload?view=careers" : "/roadmap-entryload");

export const careerSectionUrl = (section) => `/roadmap-entryload?view=careers&section=${section}`;

export const roadmapStepUrl = (key) => {
  const view = viewOfStep(key);
  const viewQuery = view === "careers" ? "view=careers&" : "";
  return `/roadmap-entryload?${viewQuery}step=${stepNumber(key)}`;
};
