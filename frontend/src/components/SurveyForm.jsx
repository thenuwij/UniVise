import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { HiAcademicCap, HiCheck, HiPlus } from "react-icons/hi";
import { HiBuildingOffice2 } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import SurveyProgressBar from "../components/SurveyProgressBar";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

// ── Shared primitives ──────────────────────────────────────────────

function StepHeading({ children }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
      {children}
    </h2>
  );
}

function StepSubtitle({ children }) {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{children}</p>
  );
}

// Single-select option button
function OptionButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center justify-between gap-3
        ${selected
          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/20"
        }`}
    >
      <span>{label}</span>
      {selected && <HiCheck className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}

// Multi-select option button (grid-friendly)
function MultiOptionButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center justify-between gap-2
        ${selected
          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/20"
        }`}
    >
      <span>{label}</span>
      {selected && <HiCheck className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}

// Chip tag for selected items
function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-700">
      {label}
      <button type="button" onClick={onRemove} className="rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5 transition-colors">
        <MdOutlineCancel className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

// Styled text input
function StyledInput({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
    />
  );
}

// Nav buttons
function NavButtons({ onPrev, onNext, onSubmit, nextDisabled, loading, isLast }) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          Back
        </button>
      ) : <div />}

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="button-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="button-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
        >
          Continue
        </button>
      )}
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────

function SurveyForm() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedHobby, setSelectedHobby] = useState('');
  const [selectedCareerField, setSelectedCareerField] = useState('');
  const [selectedDegreeInterest, setSelectedDegreeInterest] = useState('');

  const subjectOptions = [
    "None of these","Aboriginal Languages","Aboriginal Studies","Agriculture","Ancient History",
    "Biology","Business Studies","Ceramics","Community and Family Studies","Computing Applications",
    "Dance","Design and Technology","Drama","Economics","English","Exploring Early Childhood",
    "Food Technology","Geography","Health and Movement Science","History","Industrial Technology",
    "Investigating Science","Legal Studies","Marine Studies","Mathematics","Modern History","Music",
    "Photography, Video and Digital Imaging","Physics","Science","Society and Culture",
    "Software Engineering","Sport, Lifestyle and Recreation","Studies of Religion",
    "Textiles and Design","Visual Arts","Visual Design","VET Courses","Work Studies",
  ];

  const careerFieldOptions = [
    "Technology","Business","Health & Medicine","Engineering","Education & Training",
    "Science & Research","Law & Public Policy","Arts & Design","Media & Communication",
    "Finance & Accounting","Trades & Construction","Environment & Sustainability",
    "Government & Public Service","Hospitality & Tourism","Sports & Fitness",
    "Social Work & Community Services","Agriculture & Natural Resources",
    "Manufacturing & Logistics","Entrepreneurship","Arts & Entertainment","Other / Not Sure Yet",
  ];

  const degreeInterestOptions = [
    "Computer Science & Information Technology","Business, Commerce & Management",
    "Medicine & Health Sciences","Engineering & Technology","Education & Teaching",
    "Science (Biological, Physical, Chemical, Environmental)","Law & Legal Studies",
    "Arts, Humanities & Social Sciences","Media, Communication & Journalism",
    "Music, Performing & Visual Arts","Finance, Accounting & Economics",
    "Architecture, Design & Creative Arts","Psychology & Social Work",
    "Nursing & Allied Health","Agriculture & Environmental Studies",
    "Sports Science & Physical Education","Politics, International Relations & Public Policy",
    "Hospitality, Tourism & Event Management","Trades, Vocational & Applied Studies",
    "Double Degrees / Combined Programs","Other / Not Sure Yet",
  ];

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);
  const handleChange = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  const generateRecommendations = async () => {
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recommendation/prompt`, {
      method: "GET",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (userType === "high_school") {
      const { error } = await supabase.from("student_school_data").insert([{
        user_id: session?.user?.id,
        year: formData.year_other || formData.year || null,
        academic_strengths: formData.subjects || [],
        hobbies: formData.hobbies || [],
        career_interests: formData.career_fields || [],
        atar: formData.atar ? parseFloat(formData.atar) : formData.atar_goal ? parseFloat(formData.atar_goal) : null,
        confidence: formData.confidence || null,
        degree_interest: formData.degree_interest || [],
      }]);
      if (error) { setMessage("Error submitting survey."); setLoading(false); return; }
      await supabase.auth.updateUser({ data: { student_type: "high_school" } });
      generateRecommendations().catch(console.error);
      navigate("/quiz/loading");
    }

    if (userType === "university") {
      const { error } = await supabase.from("student_uni_data").insert([{
        user_id: session?.user?.id,
        degree_stage: formData.degree_stage_other || formData.degree_stage || null,
        academic_year: formData.academic_year_other || formData.academic_year || null,
        degree_field: formData.degree_field_other || formData.degree_field || null,
        interest_areas: formData.interest_areas || [],
        interest_areas_other: formData.interest_areas_other || null,
        priorities: formData.priorities || [],
        work_style: formData.work_style || [],
        hobbies: formData.hobbies || [],
        hobbies_other: formData.hobbies_other || null,
      }]);
      if (error) { setMessage("Error submitting survey."); setLoading(false); return; }
      await supabase.auth.updateUser({ data: { student_type: "university" } });
      generateRecommendations().catch(console.error);
      navigate("/quiz/loading");
    }
  };

  const totalSteps = userType === "high_school" ? 8 : 8;

  return (
    <div className="w-full max-w-xl">
      <SurveyProgressBar step={step} totalSteps={userType ? totalSteps : 1} />

      {/* ── Step 1: User type ── */}
      {step === 1 && (
        <div>
          <StepHeading>Who are you?</StepHeading>
          <StepSubtitle>This helps us personalise your UniVise experience.</StepSubtitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {[
              { type: "high_school", label: "High School Student", desc: "Year 10–12, exploring degrees and ATAR pathways" },
              { type: "university", label: "University Student", desc: "Enrolled at UNSW, planning courses and careers" },
            ].map(({ type, label, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => { setUserType(type); handleNext(); }}
                className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  {type === "high_school"
                    ? <HiAcademicCap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    : <HiBuildingOffice2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── HIGH SCHOOL FLOW ── */}

      {userType === "high_school" && step === 2 && (
        <div>
          <StepHeading>What year are you currently in?</StepHeading>
          <StepSubtitle>We'll tailor advice to where you are in your studies.</StepSubtitle>
          <div className="flex flex-col gap-2">
            {["Year 10", "Year 11", "Year 12", "Other"].map(o => (
              <OptionButton key={o} label={o} selected={formData.year === o} onClick={() => handleChange("year", o)} />
            ))}
          </div>
          {formData.year === "Other" && (
            <div className="mt-3">
              <StyledInput placeholder="Enter your year (e.g., Year 9)" value={formData.year_other || ""} onChange={e => handleChange("year_other", e.target.value)} />
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.year || (formData.year === "Other" && !formData.year_other)} />
        </div>
      )}

      {userType === "high_school" && step === 3 && (
        <div>
          <StepHeading>What are your favourite subjects?</StepHeading>
          <StepSubtitle>Select from the list and add them to your profile.</StepSubtitle>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Choose a subject</option>
              {subjectOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedSubject && !formData.subjects?.includes(selectedSubject)) {
                  handleChange("subjects", [...(formData.subjects || []), selectedSubject]);
                  setSelectedSubject('');
                }
              }}
              disabled={!selectedSubject || formData.subjects?.includes(selectedSubject)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <HiPlus className="w-4 h-4" /> Add
            </button>
          </div>
          {formData.subjects?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.subjects.map(s => <Chip key={s} label={s} onRemove={() => handleChange("subjects", formData.subjects.filter(x => x !== s))} />)}
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.subjects?.length} />
        </div>
      )}

      {userType === "high_school" && step === 4 && (
        <div>
          <StepHeading>What are your hobbies or interests?</StepHeading>
          <StepSubtitle>Type anything — sport, music, coding, art, etc.</StepSubtitle>
          <div className="flex gap-2 mb-3">
            <StyledInput
              placeholder="e.g., coding, photography"
              value={selectedHobby}
              onChange={e => setSelectedHobby(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (selectedHobby && !formData.hobbies?.includes(selectedHobby)) {
                  handleChange("hobbies", [...(formData.hobbies || []), selectedHobby]);
                  setSelectedHobby('');
                }
              }}
              disabled={!selectedHobby}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
            >
              <HiPlus className="w-4 h-4" /> Add
            </button>
          </div>
          {formData.hobbies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.hobbies.map(h => <Chip key={h} label={h} onRemove={() => handleChange("hobbies", formData.hobbies.filter(x => x !== h))} />)}
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.hobbies?.length} />
        </div>
      )}

      {userType === "high_school" && step === 5 && (
        <div>
          <StepHeading>What career fields interest you?</StepHeading>
          <StepSubtitle>Select all that appeal to you.</StepSubtitle>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedCareerField}
              onChange={e => setSelectedCareerField(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Choose a career field</option>
              {careerFieldOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedCareerField && !formData.career_fields?.includes(selectedCareerField)) {
                  handleChange("career_fields", [...(formData.career_fields || []), selectedCareerField]);
                  setSelectedCareerField('');
                }
              }}
              disabled={!selectedCareerField || formData.career_fields?.includes(selectedCareerField)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <HiPlus className="w-4 h-4" /> Add
            </button>
          </div>
          {formData.career_fields?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.career_fields.map(f => <Chip key={f} label={f} onRemove={() => handleChange("career_fields", formData.career_fields.filter(x => x !== f))} />)}
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.career_fields?.length} />
        </div>
      )}

      {userType === "high_school" && step === 6 && (
        <div>
          <StepHeading>What's your ATAR situation?</StepHeading>
          <StepSubtitle>This helps us match you to realistic degree options.</StepSubtitle>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { value: "known", label: "I already know my ATAR" },
              { value: "goal", label: "I have an ATAR goal in mind" },
              { value: "unsure", label: "I'm not sure yet" },
            ].map(({ value, label }) => (
              <OptionButton key={value} label={label} selected={formData.atar_status === value} onClick={() => handleChange("atar_status", value)} />
            ))}
          </div>
          {formData.atar_status === "known" && (
            <StyledInput placeholder="Enter your ATAR (e.g. 92.5)" value={formData.atar || ""} onChange={e => handleChange("atar", e.target.value)} />
          )}
          {formData.atar_status === "goal" && (
            <StyledInput placeholder="Enter your ATAR goal (e.g. 85)" value={formData.atar_goal || ""} onChange={e => handleChange("atar_goal", e.target.value)} />
          )}
          <NavButtons
            onPrev={handlePrev} onNext={handleNext}
            nextDisabled={!formData.atar_status || (formData.atar_status === "known" && !formData.atar) || (formData.atar_status === "goal" && !formData.atar_goal)}
          />
        </div>
      )}

      {userType === "high_school" && step === 7 && (
        <div>
          <StepHeading>How confident are you about your future path?</StepHeading>
          <StepSubtitle>Be honest — there's no wrong answer.</StepSubtitle>
          <div className="flex flex-col gap-2">
            {[
              "Very confident — I know what I want",
              "Somewhat confident — I have ideas but unsure",
              "Not confident — I need help figuring it out",
            ].map(o => (
              <OptionButton key={o} label={o} selected={formData.confidence === o} onClick={() => handleChange("confidence", o)} />
            ))}
          </div>
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.confidence} />
        </div>
      )}

      {userType === "high_school" && step === 8 && (
        <div>
          <StepHeading>What degrees interest you?</StepHeading>
          <StepSubtitle>Select all that appeal — you can always change later.</StepSubtitle>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedDegreeInterest}
              onChange={e => setSelectedDegreeInterest(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select degree interest</option>
              {degreeInterestOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedDegreeInterest && !formData.degree_interest?.includes(selectedDegreeInterest)) {
                  handleChange("degree_interest", [...(formData.degree_interest || []), selectedDegreeInterest]);
                  setSelectedDegreeInterest('');
                }
              }}
              disabled={!selectedDegreeInterest || formData.degree_interest?.includes(selectedDegreeInterest)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <HiPlus className="w-4 h-4" /> Add
            </button>
          </div>
          {formData.degree_interest?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.degree_interest.map(d => <Chip key={d} label={d} onRemove={() => handleChange("degree_interest", formData.degree_interest.filter(x => x !== d))} />)}
            </div>
          )}
          <NavButtons onPrev={handlePrev} onSubmit={handleSubmit} loading={loading} isLast />
          {message && <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">{message}</p>}
        </div>
      )}

      {/* ── UNIVERSITY FLOW ── */}

      {userType === "university" && step === 2 && (
        <div>
          <StepHeading>What stage of study are you in?</StepHeading>
          <StepSubtitle>We'll tailor recommendations to your level.</StepSubtitle>
          <div className="flex flex-col gap-2">
            {["Bachelor's Degree", "Master's Degree", "PhD or Doctoral Program", "Other"].map(o => (
              <OptionButton key={o} label={o} selected={formData.degree_stage === o} onClick={() => handleChange("degree_stage", o)} />
            ))}
          </div>
          {formData.degree_stage === "Other" && (
            <div className="mt-3">
              <StyledInput placeholder="Please specify" value={formData.degree_stage_other || ""} onChange={e => handleChange("degree_stage_other", e.target.value)} />
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.degree_stage || (formData.degree_stage === "Other" && !formData.degree_stage_other)} />
        </div>
      )}

      {userType === "university" && step === 3 && (
        <div>
          <StepHeading>What year of your degree are you in?</StepHeading>
          <StepSubtitle>This helps us suggest the right courses and opportunities.</StepSubtitle>
          <div className="flex flex-col gap-2">
            {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5 or later"].map(o => (
              <OptionButton key={o} label={o} selected={formData.academic_year === o} onClick={() => handleChange("academic_year", o)} />
            ))}
          </div>
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.academic_year} />
        </div>
      )}

      {userType === "university" && step === 4 && (
        <div>
          <StepHeading>Which field is your program in?</StepHeading>
          <StepSubtitle>Select the one that best describes your degree.</StepSubtitle>
          <div className="grid grid-cols-2 gap-2">
            {["Commerce & Business","Science","Engineering","Computer Science & IT","Arts & Humanities","Law","Health & Medicine","Media & Communications","Other"].map(o => (
              <MultiOptionButton key={o} label={o} selected={formData.degree_field === o} onClick={() => handleChange("degree_field", o)} />
            ))}
          </div>
          {formData.degree_field === "Other" && (
            <div className="mt-3">
              <StyledInput placeholder="Please specify" value={formData.degree_field_other || ""} onChange={e => handleChange("degree_field_other", e.target.value)} />
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.degree_field || (formData.degree_field === "Other" && !formData.degree_field_other)} />
        </div>
      )}

      {userType === "university" && step === 5 && (
        <div>
          <StepHeading>Which areas interest you most?</StepHeading>
          <StepSubtitle>Select all that apply — helps us find the best career matches.</StepSubtitle>
          <div className="grid grid-cols-2 gap-2">
            {["Business & Finance","Tech & Software","Science & Research","Engineering & Design","Health & Medicine","Law & Policy","Arts & Media","Other","I'm still exploring"].map(o => (
              <MultiOptionButton
                key={o} label={o}
                selected={formData.interest_areas?.includes(o)}
                onClick={() => {
                  const updated = formData.interest_areas?.includes(o)
                    ? formData.interest_areas.filter(x => x !== o)
                    : [...(formData.interest_areas || []), o];
                  handleChange("interest_areas", updated);
                }}
              />
            ))}
          </div>
          {formData.interest_areas?.includes("Other") && (
            <div className="mt-3">
              <StyledInput placeholder="Please specify" value={formData.interest_areas_other || ""} onChange={e => handleChange("interest_areas_other", e.target.value)} />
            </div>
          )}
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.interest_areas?.length} />
        </div>
      )}

      {userType === "university" && step === 6 && (
        <div>
          <StepHeading>What matters most to you in your future career?</StepHeading>
          <StepSubtitle>Pick up to 3 — helps us weigh recommendations toward what you actually want.</StepSubtitle>
          <div className="grid grid-cols-2 gap-2">
            {[
              "High salary",
              "Making an impact / helping others",
              "Work-life balance",
              "Intellectual challenge",
              "Creative freedom",
              "Career prestige",
              "Job security & stability",
              "Autonomy & flexibility",
              "Fast career growth",
            ].map(o => {
              const isSelected = formData.priorities?.includes(o);
              const atLimit = (formData.priorities?.length || 0) >= 3;
              return (
                <MultiOptionButton
                  key={o} label={o}
                  selected={isSelected}
                  onClick={() => {
                    if (isSelected) {
                      handleChange("priorities", formData.priorities.filter(x => x !== o));
                    } else if (!atLimit) {
                      handleChange("priorities", [...(formData.priorities || []), o]);
                    }
                  }}
                />
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {formData.priorities?.length || 0} / 3 selected
          </p>
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.priorities?.length} />
        </div>
      )}

      {userType === "university" && step === 7 && (
        <div>
          <StepHeading>How do you like to work?</StepHeading>
          <StepSubtitle>Select all that apply — most people enjoy a mix.</StepSubtitle>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Hands-on building & making things",
              "Research & deep analysis",
              "Client-facing & communication",
              "Creative & artistic work",
              "Leadership & coordination",
              "Still figuring it out",
            ].map(o => (
              <MultiOptionButton
                key={o} label={o}
                selected={formData.work_style?.includes(o)}
                onClick={() => {
                  const updated = formData.work_style?.includes(o)
                    ? formData.work_style.filter(x => x !== o)
                    : [...(formData.work_style || []), o];
                  handleChange("work_style", updated);
                }}
              />
            ))}
          </div>
          <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!formData.work_style?.length} />
        </div>
      )}

      {userType === "university" && step === 8 && (
        <div>
          <StepHeading>What are your hobbies or interests?</StepHeading>
          <StepSubtitle>Helps Eunice understand what drives you beyond studies.</StepSubtitle>
          <div className="grid grid-cols-2 gap-2">
            {["Sports & Fitness","Creative Arts (music, design, writing)","Technology & Coding","Volunteering & Community Projects","Gaming & Entertainment","Entrepreneurship","Other","Not sure yet"].map(o => (
              <MultiOptionButton
                key={o} label={o}
                selected={formData.hobbies?.includes(o)}
                onClick={() => {
                  const updated = formData.hobbies?.includes(o)
                    ? formData.hobbies.filter(x => x !== o)
                    : [...(formData.hobbies || []), o];
                  handleChange("hobbies", updated);
                }}
              />
            ))}
          </div>
          {formData.hobbies?.includes("Other") && (
            <div className="mt-3">
              <StyledInput placeholder="Please specify" value={formData.hobbies_other || ""} onChange={e => handleChange("hobbies_other", e.target.value)} />
            </div>
          )}
          <NavButtons onPrev={handlePrev} onSubmit={handleSubmit} loading={loading} isLast />
          {message && <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">{message}</p>}
        </div>
      )}
    </div>
  );
}

export default SurveyForm;
