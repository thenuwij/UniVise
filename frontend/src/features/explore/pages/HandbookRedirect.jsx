import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { HANDBOOK_HOME, handbookUrl } from "@/shared/lib/handbook";

// Preserve old bookmarks without rendering the retired internal Handbook.
export default function HandbookRedirect({ kind }) {
  const params = useParams();
  const identifier = params.courseId || params.degreeId || params.id;
  const href = kind && identifier ? handbookUrl(kind, identifier) : HANDBOOK_HOME;
  useEffect(() => { window.location.replace(href); }, [href]);
  return <p className="p-6">Opening the UNSW Handbook… <a href={href} className="text-link underline">Continue to Handbook</a></p>;
}
