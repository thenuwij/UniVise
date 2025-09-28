/** @file InlineIcons.jsx
 *  Small dependency-free SVG icons used across Roadmap pages.
 *  Keep these presentational (no state) for easy reuse and tree-shaking.
 */

/** @param {React.SVGProps<SVGSVGElement>} props */
export const ArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M12 19l-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);

/** @param {React.SVGProps<SVGSVGElement>} props */
export const RefreshCw = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/>
  </svg>
);

/** @param {React.SVGProps<SVGSVGElement>} props */
export const Download = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/** @param {React.SVGProps<SVGSVGElement>} props */
export const FileText = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
  </svg>
);

/** @param {React.SVGProps<SVGSVGElement>} props */
export const UniIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M22 10L12 2 2 10l10 6 10-6z"/><path d="M6 12v6l6 4 6-4v-6"/>
  </svg>
);
