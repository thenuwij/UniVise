import { Label, Select, TextInput } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, GraduationCap, Pencil, User, X } from "lucide-react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import { cleanText } from "@/shared/lib/cleanText";
import { supabase } from "@/shared/lib/supabase";
import { useEnrolledProgram } from "@/features/roadmap/hooks/useEnrolledProgram";
import YourDataCard from "../components/YourDataCard";

const TAG_MAX_LENGTH = 60;
const TAG_MAX_COUNT = 10;
const NOT_SET = "Not Specified";

const pill = "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold";
const secondaryButton =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50";
const primaryButton =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50";

const toArr = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
const shown = (v) => (v && v !== NOT_SET ? v : "");

function Section({ title, icon: Icon, editing, onEdit, onCancel, onSave, saving, status, children }) {
  return (
    <section className={`${card} p-6`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-strong">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {title}
        </h2>
        {!editing && onEdit && (
          <button type="button" onClick={onEdit} className={secondaryButton}>
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>
      <div className="mt-5">{children}</div>
      {editing && (
        <div className="mt-6 pt-5 border-t border-line flex flex-wrap items-center justify-end gap-3">
          {status?.error && <p className="mr-auto text-sm font-semibold text-red-600 dark:text-red-400">{status.error}</p>}
          <button type="button" onClick={onCancel} disabled={saving} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving} className={primaryButton}>
            <Check className="h-4 w-4" strokeWidth={3} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
      {!editing && status?.saved && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 dark:text-green-300">
          <Check className="h-4 w-4" strokeWidth={3} />
          Saved
        </p>
      )}
    </section>
  );
}

function Field({ label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-sm text-ink-muted">{label}</p>
      {value ? (
        <p className="mt-0.5 text-[15px] font-semibold text-ink-strong break-words">{value}</p>
      ) : (
        <p className="mt-0.5 text-[15px] text-slate-400 dark:text-slate-500">Not added</p>
      )}
    </div>
  );
}

function ProgramField({ program, loading }) {
  return (
    <div className="sm:col-span-2">
      <p className="text-sm text-ink-muted">Your program</p>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {loading ? (
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : program ? (
          <p className="text-[15px] font-semibold text-ink-strong break-words">{program.program_name} ({program.degree_code})</p>
        ) : (
          <p className="text-[15px] text-slate-400 dark:text-slate-500">Not set</p>
        )}
        <Link to="/roadmap" className="text-sm font-semibold text-link hover:underline">
          Change program
        </Link>
      </div>
    </div>
  );
}

function TagField({ label, items }) {
  return (
    <div className="sm:col-span-2">
      <p className="text-sm text-ink-muted">{label}</p>
      {items?.length ? (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={item + i} className="px-3 py-1 rounded-full text-sm font-medium text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-0.5 text-[15px] text-slate-400 dark:text-slate-500">Not added</p>
      )}
    </div>
  );
}

function TagInput({ id, values, setValues, placeholder }) {
  const [next, setNext] = useState("");
  const full = values.length >= TAG_MAX_COUNT;
  const addTag = () => {
    const t = cleanText(next, TAG_MAX_LENGTH);
    if (t && !values.includes(t) && !full) setValues([...values, t]);
    setNext("");
  };
  const removeTag = (i) => setValues(values.filter((_, idx) => idx !== i));
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !next && values.length) removeTag(values.length - 1);
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput id={id} placeholder={placeholder} maxLength={TAG_MAX_LENGTH} value={next} onChange={(e) => setNext(e.target.value)} onKeyDown={onKeyDown} className="w-full" />
        <button type="button" onClick={addTag} disabled={!cleanText(next, TAG_MAX_LENGTH) || full} className={secondaryButton}>
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((tag, i) => (
            <span key={tag + i} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm font-medium text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800">
              {tag}
              <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`} className="h-5 w-5 inline-flex items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-ink-muted">Press Enter or Add. Up to {TAG_MAX_COUNT}.</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="animate-pulse grid sm:grid-cols-2 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

function Avatar({ url, name }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  if (url && !failed) {
    return <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/60" />;
  }
  return (
    <span className="h-20 w-20 inline-flex items-center justify-center rounded-full text-2xl font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-600 ring-4 ring-blue-100 dark:ring-blue-900/60">
      {initials || <User className="h-8 w-8" />}
    </span>
  );
}

function ProfilePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [studentType, setStudentType] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: NOT_SET,
    hobbies: [],
    year: "",
    atar: "",
    confidence: NOT_SET,
    academicStrengths: [],
    degreeInterests: [],
    careerInterests: [],
    degreeStage: "",
    degreeField: "",
    wam: "",
  });
  const [editing, setEditing] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({});
  const { program: enrolledProgram, loading: programLoading } = useEnrolledProgram();

  const isHS = useMemo(() => studentType === "high_school", [studentType]);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const onInput = (key) => (e) => set(key)(e.target.value);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) return;
        const meta = user.user_metadata || {};
        const st = meta.student_type || "";
        setEmail(user.email || "");
        setAvatarUrl(meta.avatar_url || meta.picture || "");
        setStudentType(st);
        const base = {
          firstName: meta.first_name || meta.full_name?.split(" ")[0] || "",
          lastName: meta.last_name || meta.full_name?.split(" ")[1] || "",
          dob: meta.dob || "",
          gender: meta.gender || NOT_SET,
        };
        if (st === "high_school") {
          const { data } = await supabase.from("student_school_data").select("*").eq("user_id", user.id).single();
          setForm((prev) => ({
            ...prev,
            ...base,
            atar: data?.atar ?? "",
            year: data?.year ?? "",
            confidence: data?.confidence ?? NOT_SET,
            academicStrengths: toArr(data?.academic_strengths),
            careerInterests: toArr(data?.career_interests),
            degreeInterests: toArr(data?.degree_interests),
            hobbies: toArr(data?.hobbies),
          }));
        } else if (st === "university") {
          const { data } = await supabase.from("student_uni_data").select("*").eq("user_id", user.id).single();
          setForm((prev) => ({
            ...prev,
            ...base,
            wam: data?.wam ?? "",
            degreeField: data?.degree_field ?? "",
            degreeStage: data?.degree_stage ?? "",
            careerInterests: data?.interest_areas ?? [],
            hobbies: data?.hobbies ?? [],
            confidence: data?.confidence ?? NOT_SET,
            year: data?.academic_year ?? "",
          }));
        } else {
          setForm((prev) => ({ ...prev, ...base }));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  const startEdit = (section) => {
    setSnapshot(form);
    setStatus({});
    setEditing(section);
  };

  const cancelEdit = () => {
    if (snapshot) setForm(snapshot);
    setStatus({});
    setEditing(null);
  };

  const save = async () => {
    setSaving(true);
    setStatus({});
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { first_name: form.firstName, last_name: form.lastName, dob: form.dob, gender: form.gender },
      });
      if (authError) throw authError;
      const { data: { user } } = await supabase.auth.getUser();
      if (isHS) {
        const { error } = await supabase.from("student_school_data").update({
          hobbies: form.hobbies,
          academic_strengths: form.academicStrengths,
          degree_interest: form.degreeInterests,
          career_interests: form.careerInterests,
          confidence: form.confidence,
        }).eq("user_id", user.id);
        if (error) throw error;
      } else if (studentType === "university") {
        const { error } = await supabase.from("student_uni_data").update({
          wam: form.wam === "" ? null : form.wam,
          degree_field: cleanText(form.degreeField, 100) || null,
          degree_stage: form.degreeStage,
          interest_areas: form.careerInterests,
          hobbies: form.hobbies,
          confidence: form.confidence,
          academic_year: form.year,
        }).eq("user_id", user.id);
        if (error) throw error;
      }
      setStatus({ [editing]: { saved: true } });
      setEditing(null);
    } catch (error) {
      console.error("Error saving profile:", error);
      setStatus({ [editing]: { error: "Couldn't save your changes. Please try again." } });
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const typeLabel = isHS ? "High school student" : studentType === "university" ? "University student" : "";
  const yearOptions = isHS
    ? [NOT_SET, "Year 10", "Year 11", "Year 12"]
    : [NOT_SET, "Year 1", "Year 2", "Year 3", "Year 4", "Year 5+", "Postgraduate/Other"];

  const sectionProps = (key) => ({
    editing: editing === key,
    onEdit: editing ? null : () => startEdit(key),
    onCancel: cancelEdit,
    onSave: save,
    saving,
    status: status[key],
  });

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <PageHeader eyebrow="Account" title="My account" subtitle="Your details, your studies and your data." />

      <div className="max-w-[1440px] mx-auto px-5 md:px-10 pt-8 pb-16 space-y-5">
        <section className={`${card} p-6 flex flex-col sm:flex-row sm:items-center gap-5`}>
          <Avatar key={avatarUrl} url={avatarUrl} name={fullName} />
          <div className="min-w-0">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-7 w-56 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-ink-strong">{fullName || "Your account"}</p>
                <p className="mt-0.5 text-[15px] text-ink-muted break-all">{email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {typeLabel && <span className={`${pill} text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800`}>{typeLabel}</span>}
                  {shown(form.year) && <span className={`${pill} text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800`}>{form.year}</span>}
                  <span className={`${pill} text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800`}>Signed in with Google</span>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <Section title="About you" icon={User} {...sectionProps("about")}>
              {loading ? (
                <LoadingRows />
              ) : editing === "about" ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <TextInput id="firstName" value={form.firstName} onChange={onInput("firstName")} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <TextInput id="lastName" value={form.lastName} onChange={onInput("lastName")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <TextInput id="email" value={email} disabled />
                    <p className="mt-1 text-xs text-ink-muted">Your email comes from your Google sign-in, so it can't be changed here.</p>
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of birth</Label>
                    <TextInput id="dob" type="date" value={form.dob} onChange={onInput("dob")} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select id="gender" value={form.gender} onChange={onInput("gender")}>
                      <option value={NOT_SET}>Not added</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="hobbies">Hobbies</Label>
                    <TagInput id="hobbies" values={form.hobbies} setValues={set("hobbies")} placeholder="Type a hobby" />
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Name" value={fullName} />
                  <Field label="Email" value={email} />
                  <Field label="Date of birth" value={form.dob} />
                  <Field label="Gender" value={shown(form.gender)} />
                  <TagField label="Hobbies" items={form.hobbies} />
                </div>
              )}
            </Section>

            <Section title="Your studies" icon={GraduationCap} {...sectionProps("studies")}>
              {loading ? (
                <LoadingRows />
              ) : editing === "studies" ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select id="year" value={form.year || NOT_SET} onChange={onInput("year")}>
                      {yearOptions.map((v) => (
                        <option key={v} value={v}>{v === NOT_SET ? "Not added" : v}</option>
                      ))}
                    </Select>
                  </div>
                  {isHS ? (
                    <>
                      <div>
                        <Label htmlFor="atar">ATAR</Label>
                        <TextInput id="atar" type="number" value={form.atar} onChange={onInput("atar")} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="strengths">Academic strengths</Label>
                        <TagInput id="strengths" values={form.academicStrengths} setValues={set("academicStrengths")} placeholder="Add a strength" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="degreeInterests">Degree interests</Label>
                        <TagInput id="degreeInterests" values={form.degreeInterests} setValues={set("degreeInterests")} placeholder="Add a degree interest" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="degreeStage">Degree stage</Label>
                        <Select id="degreeStage" value={form.degreeStage || NOT_SET} onChange={onInput("degreeStage")}>
                          {[NOT_SET, "Bachelors Degree", "Masters Degree", "PhD or Doctoral Program", "Other"].map((v) => (
                            <option key={v} value={v}>{v === NOT_SET ? "Not added" : v}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="degreeField">Field of study</Label>
                        <TextInput id="degreeField" maxLength={100} value={form.degreeField} onChange={onInput("degreeField")} />
                      </div>
                      <div>
                        <Label htmlFor="wam">WAM</Label>
                        <TextInput id="wam" type="number" min={0} max={100} value={form.wam ?? ""} onChange={onInput("wam")} />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <Label htmlFor="careerInterests">Career interests</Label>
                    <TagInput id="careerInterests" values={form.careerInterests} setValues={set("careerInterests")} placeholder="Add a career interest" />
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {!isHS && <ProgramField program={enrolledProgram} loading={programLoading} />}
                  <Field label="Year" value={shown(form.year)} />
                  {isHS ? (
                    <>
                      <Field label="ATAR" value={form.atar} />
                      <TagField label="Academic strengths" items={form.academicStrengths} />
                      <TagField label="Degree interests" items={form.degreeInterests} />
                      <Field label="How sure you are about your path" value={shown(form.confidence)} wide />
                    </>
                  ) : (
                    <>
                      <Field label="Degree stage" value={shown(form.degreeStage)} />
                      <Field label="Field of study" value={form.degreeField} />
                      <Field label="WAM" value={form.wam === null ? "" : String(form.wam)} />
                    </>
                  )}
                  <TagField label="Career interests" items={form.careerInterests} />
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-5">
            <YourDataCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
