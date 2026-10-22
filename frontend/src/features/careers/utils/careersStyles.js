export const chipClass = (active) =>
  `px-3 py-1 rounded-md text-[13px] font-medium transition-colors ${
    active
      ? "text-white bg-brand-blue"
      : "text-ink bg-surface border border-line hover:border-blue-300 hover:text-link"
  }`;
