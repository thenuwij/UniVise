import { Link } from "react-router-dom";
import { Award, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight, CircleAlert, HelpCircle, ListChecks } from "lucide-react";
import { careerSectionUrl, roadmapStepUrl, roadmapViewUrl } from "@/features/program/utils/roadmapSteps";
import { useDashboardPreview } from "../hooks/useDashboardPreview";
import DegreeEditMenu from "./DegreeEditMenu";

const display = "font-['Plus_Jakarta_Sans',ui-sans-serif,system-ui] tracking-tight";
const card = "min-w-0";
const tag = "rounded-[7px] px-2.5 py-0.5 text-xs font-semibold";
const iconTile = "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]";

function Shimmer({ className = "h-5" }) {
  return <div className={`${className} rounded bg-slate-100 dark:bg-slate-800 animate-pulse`} aria-hidden="true" />;
}

function HeroStat({ value, label, to, linkText }) {
  return (
    <div>
      {value === undefined ? (
        <div className="h-10 w-14 rounded bg-white/20 animate-pulse" aria-hidden="true" />
      ) : (
        <p className={`${display} text-[34px] font-extrabold leading-none`}>{value}</p>
      )}
      <p className="mt-2 text-base text-blue-100">
        {label} · <Link to={to} className="font-semibold text-white underline-offset-4 hover:underline">{linkText} ›</Link>
      </p>
    </div>
  );
}

function Hero({ greeting, today, dayLine, facts, picks, onHelp }) {
  const ticked = facts.doneCount || 0;
  const { program, specNames = [] } = facts;
  const degree = [program.program_name, ...specNames].join(" · ");
  return (
    <section className="rounded-3xl bg-blue-800 px-6 py-8 text-white sm:px-10 sm:py-9" aria-labelledby="home-hello">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm text-blue-200" data-tour="dash-degree">{today} · {degree}</p>
          <h1 id="home-hello" className={`${display} mt-2 text-[32px] font-extrabold leading-tight sm:text-[44px]`}>{greeting}</h1>
          <p className="mt-2 text-base text-blue-100">{dayLine}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div data-tour="dash-edit" className="home-hero-edit">
            <DegreeEditMenu degreeCode={program.degree_code} canChangeSpecialisation={!facts.failed && facts.hasSpecOptions} />
          </div>
          <button type="button" onClick={onHelp} aria-label="How Home works" className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-white/35 hover:bg-white/10">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {!facts.failed && (
        <div className="mt-7 flex flex-wrap gap-x-14 gap-y-5 border-t border-white/20 pt-6" data-tour="dash-glance">
          <HeroStat value={ticked} label="courses completed" to={roadmapStepUrl("structure")} linkText="Update" />
          {ticked ? (
            <HeroStat value={picks ? picks.available : undefined} label="courses open to you" to={roadmapStepUrl("coursemesh")} linkText="CourseMesh" />
          ) : (
            <p className="self-end text-base text-blue-100">
              New here? <Link to={roadmapViewUrl("degree")} className="font-semibold text-white underline-offset-4 hover:underline">Check out My Program ›</Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function SectionHead({ id, title, to, linkText }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className={`${display} text-[22px] font-bold text-ink-strong`}>{title}</h2>
      {to && <Link to={to} className="text-base font-semibold text-link hover:underline">{linkText}</Link>}
    </div>
  );
}

function NextCourses({ facts, picks }) {
  if (!facts.doneCount) {
    return (
      <section className={card} aria-labelledby="home-next" data-tour="dash-program">
        <SectionHead id="home-next" title="Next courses for you" />
        <div className="mt-4 flex flex-col items-start gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <span className={`${iconTile} h-12 w-12 rounded-[14px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300`} aria-hidden="true"><ListChecks className="h-6 w-6" /></span>
          <p className={`${display} text-lg font-bold text-ink-strong`}>Tick the courses you've done</p>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">We'll show the courses you can take next, the skills each one builds and the careers it helps.</p>
          <Link to={roadmapStepUrl("structure")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[15px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
            Update my courses →
          </Link>
        </div>
      </section>
    );
  }
  return (
    <section className={card} aria-labelledby="home-next" data-tour="dash-program">
      <SectionHead id="home-next" title="Next courses for you" to={roadmapStepUrl("next")} linkText={picks ? `All ${picks.available} ›` : "Open ›"} />
      <ul className="mt-4">
        {!picks && [0, 1, 2].map((i) => <li key={i} className="border-t border-slate-200 py-4 dark:border-slate-800"><Shimmer /></li>)}
        {picks?.picks.slice(0, 3).map((pick) => (
          <li key={pick.code} className="border-t border-slate-200 dark:border-slate-800">
            <Link to={roadmapStepUrl("next")} className="group flex flex-wrap items-center justify-between gap-3 py-3.5">
              <span className="min-w-0">
                <span className="block font-semibold text-ink-strong group-hover:text-link">{pick.code} · {pick.name}</span>
                {pick.skills?.length > 0 && <span className="mt-0.5 block text-[13px] text-slate-500 dark:text-slate-400">{pick.skills.join(", ")}</span>}
              </span>
              <span className="flex gap-1.5">
                {pick.core && <span className={`${tag} ring-1 ring-slate-900 text-slate-900 dark:ring-white dark:text-white`}>Core</span>}
                {pick.usefulness === "high" && <span className={`${tag} bg-slate-900 text-white dark:bg-white dark:text-slate-900`}>Highly useful</span>}
              </span>
            </Link>
          </li>
        ))}
        {picks && !picks.picks.length && (
          <li className="border-t border-slate-200 py-4 text-sm text-slate-500 dark:border-slate-800">No suggestions yet. Open Next courses to see what you can take.</li>
        )}
      </ul>
    </section>
  );
}

function CareerRow({ to, icon: Icon, tone = "blue", label, value, valueClass }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  };
  return (
    <li className="border-t border-slate-200 dark:border-slate-800">
      <Link to={to} className="group flex items-center gap-3.5 py-3">
        <span className={`${iconTile} ${tones[tone]}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1 font-semibold text-ink-strong group-hover:text-link">{label}</span>
        <span className={`flex-shrink-0 text-[15px] font-bold ${valueClass || "text-ink-strong"}`}>{value}</span>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
      </Link>
    </li>
  );
}

function CareerWeek({ roadmap, career, cert }) {
  const ready = career && !career.failed && !career.missing;
  return (
    <section className={card} aria-labelledby="home-career" data-tour="dash-career">
      <SectionHead id="home-career" title="Your career this week" to={roadmapViewUrl("careers")} linkText="My Career ›" />
      <ul className="mt-4">
        {!career && [0, 1, 2].map((i) => <li key={i} className="border-t border-slate-200 py-4 dark:border-slate-800"><Shimmer /></li>)}
        {ready && (
          <>
            <CareerRow to={careerSectionUrl("jobs")} icon={BriefcaseBusiness} label="Jobs hiring now" value={career.jobs} />
            <CareerRow to={careerSectionUrl("internships")} icon={Building2} label="Internships open" value={career.internships} />
            <CareerRow to={careerSectionUrl("networking")} icon={CalendarDays} label="Networking events coming up" value={career.events} />
          </>
        )}
        {cert !== undefined && cert?.count > 0 && (
          <CareerRow to={careerSectionUrl("certifications")} icon={Award} label="Certifications for your careers" value={cert.count} />
        )}
        {roadmap?.placement && (
          roadmap.placement.done ? (
            <CareerRow to={careerSectionUrl("internships")} icon={Check} tone="green" label={`Required placement ${roadmap.placement.code}`} value="Done" valueClass="text-green-700 dark:text-green-400" />
          ) : (
            <CareerRow to={careerSectionUrl("internships")} icon={CircleAlert} tone="amber" label={`Required placement ${roadmap.placement.code}`} value="To do" valueClass="text-amber-700 dark:text-amber-400" />
          )
        )}
        {career && !ready && (
          <CareerRow to={roadmapViewUrl("careers")} icon={BriefcaseBusiness} label="See jobs, internships and events" value="" />
        )}
      </ul>
    </section>
  );
}

function Societies({ roadmap }) {
  const list = roadmap?.societies || [];
  if (roadmap && !list.length) return null;
  return (
    <section className={card} aria-labelledby="home-societies">
      <SectionHead id="home-societies" title="Societies for you to join" to={roadmapStepUrl("societies")} linkText={list.length ? `All ${list.length} ›` : "Open ›"} />
      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-5">
        {!roadmap && [0, 1, 2, 3].map((i) => <Shimmer key={i} className="h-14 w-14 rounded-full" />)}
        {list.slice(0, 6).map((society) => {
          const words = society.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
          const initials = (words.length > 1 ? words.map((w) => w[0]).join("") : words[0] || society.name).slice(0, 2).toUpperCase();
          const inner = (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-800 transition-colors group-hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-200" aria-hidden="true">{initials}</span>
              <span className="w-24 truncate text-center text-sm font-semibold text-ink-strong group-hover:text-link">{society.name}</span>
            </>
          );
          const cls = "group flex flex-col items-center gap-2";
          return society.link ? (
            <a key={society.name} href={society.link.url} target="_blank" rel="noopener noreferrer" className={cls} title={society.name}>{inner}</a>
          ) : (
            <Link key={society.name} to={roadmapStepUrl("societies")} className={cls} title={society.name}>{inner}</Link>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardHome({ facts, greeting, today, dayLine, onHelp }) {
  const { picks, roadmap, career, cert } = useDashboardPreview(facts);

  return (
    <div className="space-y-12">
      <Hero greeting={greeting} today={today} dayLine={dayLine} facts={facts} picks={picks} onHelp={onHelp} />
      {facts.failed ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-[15px] text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800" role="status">
          Your details couldn't be loaded. You can still open <Link to={roadmapViewUrl("degree")} className="font-semibold text-link hover:underline">My Program</Link> or <Link to={roadmapViewUrl("careers")} className="font-semibold text-link hover:underline">My Career</Link>.
        </p>
      ) : (
        <>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <NextCourses facts={facts} picks={picks} />
            <CareerWeek roadmap={roadmap} career={career} cert={cert} />
          </div>
          <Societies roadmap={roadmap} />
        </>
      )}
    </div>
  );
}
