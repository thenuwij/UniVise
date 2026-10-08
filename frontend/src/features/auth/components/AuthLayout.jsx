import { Briefcase, Map, Network } from "lucide-react";
import { Header } from "@/shared/layout/Header";

const FEATURES = [
  { icon: Map, title: "Your roadmap", text: "Your degree, courses and specialisation in five clear steps." },
  { icon: Network, title: "CourseMesh", text: "See which courses unlock next and plan your terms." },
  { icon: Briefcase, title: "Careers", text: "Real graduate outcomes, live job ads and internships." },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col app-page">
      <Header />
      <div className="-mt-4 flex-1 grid lg:grid-cols-2">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-blue to-brand-indigo dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 px-6 py-8 md:px-12 lg:px-16 lg:py-16">
          <div aria-hidden className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-blue-300/15 dark:bg-blue-400/10" />
          <div aria-hidden className="absolute -bottom-40 -left-20 h-[360px] w-[360px] rounded-full bg-indigo-300/15 dark:bg-indigo-400/10" />
          <div className="relative flex h-full max-w-xl flex-col lg:mx-auto lg:justify-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-band-soft">UniVise for UNSW students</p>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-band-ink">
              Plan your degree, courses and career in one place
            </h2>
            <ul className="mt-10 hidden lg:flex flex-col gap-6">
              {FEATURES.map(({ icon: Icon, title: name, text }) => (
                <li key={name} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="font-semibold text-band-ink">{name}</p>
                    <p className="mt-0.5 text-[15px] text-band-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex items-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950/40 dark:to-indigo-950/70 px-6 py-10 md:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-ink-strong">{title}</h1>
            {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
