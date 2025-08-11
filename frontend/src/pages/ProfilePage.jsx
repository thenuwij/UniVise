import { FileUpload } from '../components/FileUpload'

// src/pages/ProfilePage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { MenuBar } from "../components/MenuBar";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { supabase } from "../supabaseClient";
import {
  Button,
  Dropdown,
  DropdownItem,
  Label,
  TextInput,
  Avatar,
  Tooltip,
  Badge,
  Select
} from "flowbite-react";
import { HiX, HiOutlineAcademicCap, HiOutlineUserCircle, HiExternalLink } from "react-icons/hi";
import { HiOutlineIdentification, HiOutlineDocumentText } from "react-icons/hi2";

// ---------- UI helpers ----------
function AuraPanel({ title, icon: Icon, children, hint }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-sm">
      {/* soft spotlight aura */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_240px_at_92%_-12%,rgba(56,189,248,0.18),transparent),radial-gradient(560px_240px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />
      <div className="relative p-6 md:p-7">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-slate-700" />}
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        </div>
        {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800">{value || "Not specified"}</p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur-xl shadow-sm animate-pulse">
      <div className="h-6 w-40 bg-slate-200 rounded" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// Improved TagInput with better hit targets + keyboard UX
function TagInput({ values, setValues, placeholder }) {
  const [next, setNext] = useState("");

  const addTag = () => {
    const t = next.trim();
    if (t && !values.includes(t)) setValues([...values, t]);
    setNext("");
  };
  const removeTag = (i) => setValues(values.filter((_, idx) => idx !== i));
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !next && values.length) {
      removeTag(values.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput
          placeholder={placeholder}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full"
        />
        <Button onClick={addTag} disabled={!next.trim()}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((tag, i) => (
          <span
            key={tag + i}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/60 hover:bg-white transition"
              aria-label={`Remove ${tag}`}
            >
              <HiX className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  // --- state
  const [firstName, setFirstName] = useState("Not Specified");
  const [lastName, setLastName] = useState("Not Specified");
  const [email, setEmail] = useState("Not Specified");
  const [dob, setDob] = useState("Not Specified");
  const [gender, setGender] = useState("Not Specified");
  const [studentType, setStudentType] = useState("Not Specified");
  const [careerInterests, setCareerInterests] = useState([]);
  const [degreeInterests, setDegreeInterests] = useState([]);
  const [year, setYear] = useState("Not Specified");
  const [academicStrengths, setAcademicStrengths] = useState([]);
  const [confidence, setConfidence] = useState("Not Specified");
  const [hobbies, setHobbies] = useState([]);
  const [university, setUniversity] = useState("Not Specified");
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [atar, setAtar] = useState("Not Specified");
  const [degreeStage, setDegreeStage] = useState();
  const [degreeField, setDegreeField] = useState("Not Specified");
  const [wam, setWam] = useState();
  const [reportPath, setReportPath] = useState(null);
  const [userId, setUserId] = useState();
  const [loading, setLoading] = useState(true);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const isHS = useMemo(() => studentType === "High School" || studentType === "high_school", [studentType]);

  // --- save
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // update email first
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        console.error("Error updating email:", emailError);
        return;
      }
      // update auth metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName, email, dob, gender },
      });
      if (authError) {
        console.error("Error updating auth metadata:", authError);
        return;
      }

      if (isHS) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from("student_school_data")
          .update({
            hobbies,
            academic_strengths: academicStrengths,
            degree_interest: degreeInterests,
            career_interests: careerInterests,
            confidence,
          })
          .eq("user_id", user.id);
      } else if (studentType === "University") {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from("student_uni_data")
          .update({
            wam,
            degree_field: degreeField,
            degree_stage: degreeStage,
            interest_areas: careerInterests,
            hobbies,
            confidence,
            academic_year: year,
          })
          .eq("user_id", user.id);
      }

      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) return;

        const fn = user.user_metadata.first_name || "";
        const ln = user.user_metadata.last_name || "";
        const em = user.email || "";
        const db = user.user_metadata.dob || "";
        const st = user.user_metadata.student_type || "";
        const gd = user.user_metadata.gender || "";

        setUserId(user.id);
        setFirstName(fn);
        setLastName(ln);
        setEmail(em);
        setGender(gd);
        setDob(db);

        if (st === "high_school") {
          const { data } = await supabase
            .from("student_school_data")
            .select("*")
            .eq("user_id", user.id)
            .single();

          setAtar(data?.atar ?? "Not Specified");
          setYear(data?.year ?? "Not Specified");
          setReportPath(data?.report_path ?? null);

          const arrStrengths = Array.isArray(data?.academic_strengths)
            ? data.academic_strengths
            : typeof data?.academic_strengths === "string"
            ? data.academic_strengths.split(",").map((h) => h.trim()).filter(Boolean)
            : [];
          setAcademicStrengths(arrStrengths);

          const arrCareerInterests = Array.isArray(data?.career_interests)
            ? data.career_interests
            : typeof data?.career_interests === "string"
            ? data.career_interests.split(",").map((h) => h.trim()).filter(Boolean)
            : [];
          setCareerInterests(arrCareerInterests);

          const arrDegreeInterest = Array.isArray(data?.degree_interests)
            ? data.degree_interests
            : typeof data?.degree_interests === "string"
            ? data.degree_interests.split(",").map((h) => h.trim()).filter(Boolean)
            : [];
          setDegreeInterests(arrDegreeInterest);

          const arrHobbies = Array.isArray(data?.hobbies)
            ? data.hobbies
            : typeof data?.hobbies === "string"
            ? data.hobbies.split(",").map((h) => h.trim()).filter(Boolean)
            : [];
          setHobbies(arrHobbies);

          setConfidence(data?.confidence ?? "Not Specified");
          setStudentType("High School");
        } else if (st === "university") {
          const { data } = await supabase
            .from("student_uni_data")
            .select("*")
            .eq("user_id", user.id)
            .single();

          setStudentType("University");
          setWam(data?.wam ?? "");
          setDegreeField(data?.degree_field ?? "Not Specified");
          setDegreeStage(data?.degree_stage ?? "");
          setCareerInterests(data?.interest_areas ?? []);
          setHobbies(data?.hobbies ?? []);
          setConfidence(data?.confidence ?? "Not Specified");
          setYear(data?.academic_year ?? "Not Specified");
          setReportPath(data?.report_path ?? null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      {/* Header + sticky actions */}
      <header className="mx-auto max-w-7xl px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              Profile
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-800">My Account</h1>
            <p className="mt-1 text-slate-600">
              View and update your details. Changes sync to your recommendations.
            </p>
          </div>

          <div className="sticky top-3 z-10">
            {isEditing ? (
              <div className="flex gap-2">
                <Button pill color="light" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                {/* attaches to the form below by id */}
                <Button pill type="submit" form="profileForm">
                  Save
                </Button>
              </div>
            ) : (
              <Button pill onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
        {isEditing ? (
          <form id="profileForm" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left span 2: About + Academic */}
            <div className="lg:col-span-2 space-y-6">
              <AuraPanel title="About Me" icon={HiOutlineUserCircle}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" value="First Name" />
                    <TextInput id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName" value="Last Name" />
                    <TextInput id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email" value="Email" />
                    <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  {/* DOB + Gender on the same row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dob" value="Date of Birth" />
                      <TextInput
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender" value="Gender" />
                      <Select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full"
                      >
                        {/* Keep “Not Specified” so the initial value renders */}
                        <option value="Not Specified">Not Specified</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </Select>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label value="Hobbies" />
                    <TagInput values={hobbies} setValues={setHobbies} placeholder="Type hobby and press Add" />
                  </div>
                </div>
              </AuraPanel>

              <AuraPanel title="Academic Information" icon={HiOutlineAcademicCap}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentType" value="School Type" />
                    <Select
                      id="studentType"
                      value={isHS ? "High School" : "University"}
                      disabled
                      className="w-full bg-slate-50 text-slate-600"
                    >
                      <option>High School</option>
                      <option>University</option>
                    </Select>
                    <p className="mt-1 text-xs text-slate-500">This cannot be changed.</p>
                  </div>
                  {/* Year */}
                  <div>
                    <Label htmlFor="year" value="Year" />
                    <Select
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full"
                    >
                      {isHS ? (
                        <>
                          <option value="Not Specified">Not Specified</option>
                          <option value="Year 10">Year 10</option>
                          <option value="Year 11">Year 11</option>
                          <option value="Year 12">Year 12</option>
                        </>
                      ) : (
                        <>
                          <option value="Not Specified">Not Specified</option>
                          <option value="Year 1">Year 1</option>
                          <option value="Year 2">Year 2</option>
                          <option value="Year 3">Year 3</option>
                          <option value="Year 4">Year 4</option>
                          <option value="Year 5+">Year 5+</option>
                          <option value="Postgraduate/Other">Postgraduate/Other</option>
                        </>
                      )}
                    </Select>
                  </div>

                  {!isHS && (
                    <>
                      <div>
                        <div>
                          <Label htmlFor="degreeStage" value="Degree Stage" />
                          <Select
                            id="degreeStage"
                            value={degreeStage || "Not Specified"}
                            onChange={(e) => setDegreeStage(e.target.value)}
                            className="w-full"
                          >
                            <option value="Not Specified">Not Specified</option>
                            <option value="Bachelors Degree">Bachelors Degree</option>
                            <option value="Masters Degree">Masters Degree</option>
                            <option value="PhD or Doctoral Program">PhD or Doctoral Program</option>
                            <option value="Other">Other</option>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="degreeField" value="Degree Field" />
                        <TextInput
                          id="degreeField"
                          value={degreeField}
                          onChange={(e) => setDegreeField(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {isHS ? (
                    <>
                      <div>
                        <Label htmlFor="atar" value="ATAR" />
                        <TextInput
                          id="atar"
                          type="number"
                          value={atar}
                          onChange={(e) => setAtar(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label value="Academic Strengths" />
                        <TagInput
                          values={academicStrengths}
                          setValues={setAcademicStrengths}
                          placeholder="Type academic strengths and press Add"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label value="Degree Interests" />
                        <TagInput
                          values={degreeInterests}
                          setValues={setDegreeInterests}
                          placeholder="Type degree interests and press Add"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label value="Career Interests" />
                        <TagInput
                          values={careerInterests}
                          setValues={setCareerInterests}
                          placeholder="Type career interests and press Add"
                        />
                      </div>
                      <div>
                        <Label value="Confidence Level" />
                        <Dropdown label={confidence} className="bg-white">
                          <DropdownItem onClick={() => setConfidence("Very confident - I know what I want")}>
                            Very confident - I know what I want
                          </DropdownItem>
                          <DropdownItem onClick={() => setConfidence("Somewhat confident - I have ideas but unsure")}>
                            Somewhat confident - I have ideas but unsure
                          </DropdownItem>
                          <DropdownItem onClick={() => setConfidence("Not confident - I need help figuring out")}>
                            Not confident - I need help figuring out
                          </DropdownItem>
                        </Dropdown>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="wam" value="Weighted Average Mark (WAM)" />
                        <TextInput id="wam" type="number" value={wam ?? ""} onChange={(e) => setWam(e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label value="Career Interests" />
                        <TagInput
                          values={careerInterests}
                          setValues={setCareerInterests}
                          placeholder="Type career interests and press Add"
                        />
                      </div>
                    </>
                  )}
                </div>
              </AuraPanel>
            </div>

            {/* Right sidebar: avatar + upload */}
            <div className="space-y-6">
              <AuraPanel title="Profile Picture" icon={HiOutlineIdentification}>
                <div className="flex items-center gap-4">
                  <Avatar rounded size="xl" className="py-2" />
                  <div className="text-sm text-slate-500">Add a picture so Eunice recognises you faster.</div>
                </div>
              </AuraPanel>

              <AuraPanel
                title={isHS ? "School Report" : "Transcript"}
                icon={HiOutlineDocumentText}
                hint={isHS ? "Upload your most recent school report." : "Upload your most recent transcript."}
              >
                {/* Keep your existing FileUpload wiring here */}
                {/* Example (unchanged): */}
                {isHS ? (
                  <FileUpload
                    userId={userId}
                    reportType={"highschool_reports"}
                    bucket="reports"
                    table="student_school_data"
                    column="report_path"
                    onUpload={(url) => setReportPath(url)}
                  />
                ) : (
                  <FileUpload
                    userId={userId}
                    reportType={"uni_transcripts"}
                    bucket="reports"
                    table="student_uni_data"
                    column="report_path"
                    onUpload={(url) => setReportPath(url)}
                  />
                )}

                {reportPath && (
                  <a
                    href={reportPath}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <HiExternalLink className="h-4 w-4" />
                    View uploaded document
                  </a>
                )}
              </AuraPanel>
            </div>
          </form>
        ) : (
          // -------- Read-only view --------
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AuraPanel title="About Me" icon={HiOutlineUserCircle}>
                {loading ? (
                  <LoadingCard />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
                    <KeyValue label="First Name" value={firstName} />
                    <KeyValue label="Last Name" value={lastName} />
                    <KeyValue label="Email" value={email} />
                    <KeyValue label="Gender" value={gender} />
                    <KeyValue label="Date of Birth" value={dob} />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Hobbies</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {hobbies?.length ? (
                          hobbies.map((h, i) => (
                            <span
                              key={h + i}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                            >
                              {h}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </AuraPanel>

              <AuraPanel title="Academic Information" icon={HiOutlineAcademicCap}>
                {loading ? (
                  <LoadingCard />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color="info">{studentType}</Badge>
                      {year && <Badge color="purple">{year}</Badge>}
                      {confidence && <Badge color="success">{confidence}</Badge>}
                    </div>

                    {isHS ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                        <KeyValue label="ATAR" value={atar} />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Academic Strengths</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {academicStrengths?.length ? (
                              academicStrengths.map((s, i) => (
                                <span
                                  key={s + i}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">None specified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Career Interests</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {careerInterests?.length ? (
                              careerInterests.map((c, i) => (
                                <span
                                  key={c + i}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                                >
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">None specified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Degree Interests</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {degreeInterests?.length ? (
                              degreeInterests.map((d, i) => (
                                <span
                                  key={d + i}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                                >
                                  {d}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">None specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                        <KeyValue label="Degree Stage" value={degreeStage} />
                        <KeyValue label="Degree Field" value={degreeField} />
                        <KeyValue label="WAM" value={wam} />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Career Interests</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {careerInterests?.length ? (
                              careerInterests.map((c, i) => (
                                <span
                                  key={c + i}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                                >
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">None specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </AuraPanel>
            </div>

            <div className="space-y-4">
              <AuraPanel title="Profile Picture" icon={HiOutlineIdentification}>
                <div className="flex items-center gap-3">
                  <Avatar rounded size="xl" className="py-1" />
                  <div className="text-sm text-slate-500">Add a picture so Eunice recognises you faster.</div>
                </div>
              </AuraPanel>

              <AuraPanel
                title={isHS ? "School Report" : "Transcript"}
                icon={HiOutlineDocumentText}
                hint={isHS ? "Upload your most recent school report." : "Upload your most recent transcript."}
              >
                {isHS ? (
                  <FileUpload
                    userId={userId}
                    reportType={"highschool_reports"}
                    bucket="reports"
                    table="student_school_data"
                    column="report_path"
                    onUpload={(url) => setReportPath(url)}
                  />
                ) : (
                  <FileUpload
                    userId={userId}
                    reportType={"uni_transcripts"}
                    bucket="reports"
                    table="student_uni_data"
                    column="report_path"
                    onUpload={(url) => setReportPath(url)}
                  />
                )}

                {reportPath && (
                  <a
                    href={reportPath}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <HiExternalLink className="h-4 w-4" />
                    View uploaded document
                  </a>
                )}
              </AuraPanel>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;

