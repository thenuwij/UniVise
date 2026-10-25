import { Link } from "react-router-dom";
import { Header } from "@/shared/layout/Header";
import { TermsText } from "../components/TermsText";

export default function TermsPage() {
  return (
    <div className="min-h-screen app-page">
      <Header matchDashboard />
      <main className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        <Link to="/" className="mb-6 inline-block text-sm font-semibold text-link hover:underline">Back to UniVise</Link>
        <TermsText scrollable={false} />
      </main>
    </div>
  );
}
