import { Link } from "react-router-dom";
import { Header } from "@/shared/layout/Header";
import { PrivacyText } from "../components/PrivacyText";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen app-page">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        <Link to="/" className="mb-6 inline-block text-sm font-semibold text-link hover:underline">Back to UniVise</Link>
        <PrivacyText scrollable={false} />
      </main>
    </div>
  );
}
