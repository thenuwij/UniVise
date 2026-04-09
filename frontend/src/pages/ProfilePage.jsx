import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  Label,
  Select,
  TextInput
} from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { HiArrowLeft, HiOutlineAcademicCap, HiOutlineUserCircle, HiX } from "react-icons/hi";
import { HiOutlineIdentification } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";

function Panel({ title, icon: Icon, children, hint }) {
  return (
    <div className="card-glass-spotlight">
      <div />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="h-5 w-5 text-slate-500" />}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{hint}</p>}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "Not specified"}</p>
    </div>
  );
}

function TagList({ items }) {
  if (!items?.length) return <span className="text-sm text-slate-400">None specified</span>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((item, i) => (
        <span key={item + i} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
          {item}
        </span>
      ))}
    </div>
  );
}

function TagInput({ values, setValues, placeholder }) {
  const [next, setNext] = useState("");
  const addTag = () => {
    const t = next.trim();
    if (t && !values.includes(t)) setValues([...values, t]);
    setNext("");
  };
  const removeTag = (i) => setValues(values.filter((_, idx) => idx !== i));
  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
    else if (e.key === "Backspace" && !next && values.length) removeTag(values.length - 1);
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput placeholder={placeholder} value={next} onChange={(e) => setNext(e.target.value)} onKeyDown={onKeyDown} className="w-full" />
        <Button onClick={addTag} disabled={!next.trim()}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((tag, i) => (
          <span key={tag + i} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs">
            {tag}
            <button type="button" onClick={() => removeTag(i)} className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200 transition" aria-label={`Remove ${tag}`}>
              <HiX className="h-3 w-3 text-slate-500" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-8 rounded bg-slate-100 dark:bg-slate-700" />)}
      </div>
    </div>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Not Specified");
  const [studentType, setStudentType] = useState("");
  const [careerInterests, setCareerInterests] = useState([]);
  const [degreeInterests, setDegreeInterests] = useState([]);
  const [year, setYear] = useState("");
  const [academicStrengths, setAcademicStrengths] = useState([]);
  const [confidence, setConfidence] = useState("Not Specified");
  const [hobbies, setHobbies] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [atar, setAtar] = useState("");
  const [degreeStage, setDegreeStage] = useState("");
  const [degreeField, setDegreeField] = useState("");
  const [wam, setWam] = useState("");
  const [userId, setUserId] = useState();
  const [loading, setLoading] = useState(true);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const isHS = useMemo(() => studentType === "High School" || studentType === "high_school", [studentType]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) { console.error("Error updating email:", emailError); return; }

      const { error: authError } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName, email, dob, gender },
      });
      if (authError) { console.error("Error updating auth metadata:", authError); return; }

      if (isHS) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("student_school_data").update({
          hobbies, academic_strengths: academicStrengths,
          degree_interest: degreeInterests, career_interests: careerInterests, confidence,
        }).eq("user_id", user.id);
      } else if (studentType === "University") {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("student_uni_data").update({
          wam, degree_field: degreeField, degree_stage: degreeStage,
          interest_areas: careerInterests, hobbies, confidence, academic_year: year,
        }).eq("user_id", user.id);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) return;

        const fn = user.user_metadata.first_name || user.user_metadata.full_name?.split(" ")[0] || "";
        const ln = user.user_metadata.last_name || user.user_metadata.full_name?.split(" ")[1] || "";
        setUserId(user.id);
        setFirstName(fn);
        setLastName(ln);
        setEmail(user.email || "");
        setGender(user.user_metadata.gender || "Not Specified");
        setDob(user.user_metadata.dob || "");

        const st = user.user_metadata.student_type || "";

        if (st === "high_school") {
          const { data } = await supabase.from("student_school_data").select("*").eq("user_id", user.id).single();
          setStudentType("High School");
          setAtar(data?.atar ?? "");
          setYear(data?.year ?? "");
          setConfidence(data?.confidence ?? "Not Specified");
          const toArr = (v) => Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
          setAcademicStrengths(toArr(data?.academic_strengths));
          setCareerInterests(toArr(data?.career_interests));
          setDegreeInterests(toArr(data?.degree_interests));
          setHobbies(toArr(data?.hobbies));
        } else if (st === "university") {
          const { data } = await supabase.from("student_uni_data").select("*").eq("user_id", user.id).single();
          setStudentType("University");
          setWam(data?.wam ?? "");
          setDegreeField(data?.degree_field ?? "");
          setDegreeStage(data?.degree_stage ?? "");
          setCareerInterests(data?.interest_areas ?? []);
          setHobbies(data?.hobbies ?? []);
          setConfidence(data?.confidence ?? "Not Specified");
          setYear(data?.academic_year ?? "");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-6 pb-16">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <HiArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <h1 className="text-xl font-bold">My Account</h1>
          </div>

          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button pill size="sm" color="light" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button pill size="sm" type="submit" form="profileForm">Save changes</Button>
              </div>
            ) : (
              <Button size="sm" className="button-primary border-0" onClick={() => setIsEditing(true)}>
                <FaRegEdit className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <form id="profileForm" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <Panel title="About Me" icon={HiOutlineUserCircle}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" value="First Name" />
                    <TextInput id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName" value="Last Name" />
                    <TextInput id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email" value="Email" />
                    <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="dob" value="Date of Birth" />
                    <TextInput id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="gender" value="Gender" />
                    <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="Not Specified">Not Specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label value="Hobbies" />
                    <TagInput values={hobbies} setValues={setHobbies} placeholder="Type a hobby and press Add" />
                  </div>
                </div>
              </Panel>

              <Panel title="Academic Information" icon={HiOutlineAcademicCap}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentType" value="Student Type" />
                    <Select id="studentType" value={isHS ? "High School" : "University"} disabled>
                      <option>High School</option>
                      <option>University</option>
                    </Select>
                    <p className="mt-1 text-xs text-slate-400">Cannot be changed.</p>
                  </div>
                  <div>
                    <Label htmlFor="year" value="Year" />
                    <Select id="year" value={year} onChange={(e) => setYear(e.target.value)}>
                      {isHS ? (
                        ["Not Specified","Year 10","Year 11","Year 12"].map(v => <option key={v} value={v}>{v}</option>)
                      ) : (
                        ["Not Specified","Year 1","Year 2","Year 3","Year 4","Year 5+","Postgraduate/Other"].map(v => <option key={v} value={v}>{v}</option>)
                      )}
                    </Select>
                  </div>

                  {isHS ? (
                    <>
                      <div>
                        <Label htmlFor="atar" value="ATAR" />
                        <TextInput id="atar" type="number" value={atar} onChange={(e) => setAtar(e.target.value)} />
                      </div>
                      <div>
                        <Label value="Confidence Level" />
                        <Dropdown label={confidence || "Select…"} className="bg-white">
                          {["Very confident - I know what I want","Somewhat confident - I have ideas but unsure","Not confident - I need help figuring out"].map(v => (
                            <DropdownItem key={v} onClick={() => setConfidence(v)}>{v}</DropdownItem>
                          ))}
                        </Dropdown>
                      </div>
                      <div className="col-span-2">
                        <Label value="Academic Strengths" />
                        <TagInput values={academicStrengths} setValues={setAcademicStrengths} placeholder="Add a strength" />
                      </div>
                      <div className="col-span-2">
                        <Label value="Degree Interests" />
                        <TagInput values={degreeInterests} setValues={setDegreeInterests} placeholder="Add a degree interest" />
                      </div>
                      <div className="col-span-2">
                        <Label value="Career Interests" />
                        <TagInput values={careerInterests} setValues={setCareerInterests} placeholder="Add a career interest" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="degreeStage" value="Degree Stage" />
                        <Select id="degreeStage" value={degreeStage || "Not Specified"} onChange={(e) => setDegreeStage(e.target.value)}>
                          {["Not Specified","Bachelors Degree","Masters Degree","PhD or Doctoral Program","Other"].map(v => <option key={v} value={v}>{v}</option>)}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="degreeField" value="Degree Field" />
                        <TextInput id="degreeField" value={degreeField} onChange={(e) => setDegreeField(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="wam" value="WAM" />
                        <TextInput id="wam" type="number" value={wam ?? ""} onChange={(e) => setWam(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label value="Career Interests" />
                        <TagInput values={careerInterests} setValues={setCareerInterests} placeholder="Add a career interest" />
                      </div>
                    </>
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title="Profile Picture" icon={HiOutlineIdentification}>
                <div className="flex flex-col items-center gap-3 py-2">
                  <Avatar rounded size="xl" />
                  <p className="text-xs text-slate-400 text-center">Upload a profile picture.</p>
                </div>
              </Panel>

            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: About Me + Academic Information merged */}
            <div className="lg:col-span-2">
              <div className="card-glass-spotlight">
                <div />
                <div className="relative p-6">
                  {/* About Me section */}
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineUserCircle className="h-5 w-5 text-slate-500" />
                    <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">About Me</h2>
                  </div>
                  {loading ? <LoadingCard /> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <KeyValue label="First Name" value={firstName} />
                      <KeyValue label="Last Name" value={lastName} />
                      <KeyValue label="Email" value={email} />
                      <KeyValue label="Gender" value={gender} />
                      <KeyValue label="Date of Birth" value={dob} />
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Hobbies</p>
                        <TagList items={hobbies} />
                      </div>
                    </div>
                  )}

                  <hr className="border-slate-200 dark:border-slate-700 my-6" />

                  {/* Academic Information section */}
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineAcademicCap className="h-5 w-5 text-slate-500" />
                    <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Academic Information</h2>
                  </div>
                  {loading ? <LoadingCard /> : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {studentType && <Badge color="info">{studentType}</Badge>}
                        {year && <Badge color="purple">{year}</Badge>}
                        {confidence && confidence !== "Not Specified" && <Badge color="success">{confidence}</Badge>}
                      </div>
                      {isHS ? (
                        <div className="grid grid-cols-2 gap-4">
                          <KeyValue label="ATAR" value={atar} />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Academic Strengths</p>
                            <TagList items={academicStrengths} />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Career Interests</p>
                            <TagList items={careerInterests} />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Degree Interests</p>
                            <TagList items={degreeInterests} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <KeyValue label="Degree Stage" value={degreeStage} />
                          <KeyValue label="Degree Field" value={degreeField} />
                          <KeyValue label="WAM" value={wam} />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Career Interests</p>
                            <TagList items={careerInterests} />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Profile Picture + Transcript merged */}
            <div>
              <div className="card-glass-spotlight">
                <div />
                <div className="relative p-6">
                  {/* Profile Picture section */}
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineIdentification className="h-5 w-5 text-slate-500" />
                    <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Profile Picture</h2>
                  </div>
                  <div className="flex flex-col items-center gap-3 py-2">
                    <Avatar rounded size="xl" />
                    <p className="text-xs text-slate-400 text-center">Upload a profile picture.</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
