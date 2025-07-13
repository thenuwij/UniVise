import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import SurveyProgressBar from "../components/SurveyProgressBar";


function SurveyForm() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const generateRecommendations = async () => {
    try {
      const resp = await fetch("http://localhost:8000/recommendation/prompt", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });

      if (!resp.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await resp.json();
      console.log("Recommendations:", data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  }

  const handleSubmit = async () => {
    setLoading(true);
    if (userType == "high_school") {
        const { error } = await supabase.from("student_school_data").insert([
        {
            user_id: session?.user?.id,
            year: formData.year_other || formData.year || null,
            academic_strengths: formData.subjects || [],
            hobbies: formData.hobbies || [],
            career_interests: formData.career_fields || [],
            atar: formData.atar ? parseFloat(formData.atar) : formData.atar_goal ? parseFloat(formData.atar_goal) : null,
            confidence: formData.confidence || null,
            degree_interest: formData.degree_interest || [],
        },
        ]);

        if (error) {
            console.error(error);
            setMessage("Error submitting survey.");
            setLoading(false);
        } else {
                await supabase.auth.updateUser({
                    data: { student_type: "high_school" }
                });
                setMessage("Survey submitted successfully!");
                await generateRecommendations();
                setTimeout(() => navigate("/dashboard", { replace: true }), 500);
        }
      }

    if (userType === "university") {
      const { error } = await supabase.from("student_uni_data").insert([
        {
          user_id: session?.user?.id,
          degree_stage: formData.degree_stage_other || formData.degree_stage || null,
          academic_year: formData.academic_year_other || formData.academic_year || null,
          degree_field: formData.degree_field_other || formData.degree_field || null,
          wam: formData.wam ? parseFloat(formData.wam) : null,
          switching_pathway: formData.switching_pathway || null,
          study_feelings: formData.study_feelings || null,
          interest_areas: formData.interest_areas || [],
          interest_areas_other: formData.interest_areas_other || null,
          hobbies: formData.hobbies || [],
          hobbies_other: formData.hobbies_other || null,
          confidence: formData.confidence || null,
          want_help: formData.want_help || null,
        },
      ]);

      if (error) {
        console.error(error);
        setMessage("Error submitting survey.");
        setLoading(false);
      } else {
          await supabase.auth.updateUser({
            data: { student_type: "university" }
          });
          setMessage("Survey submitted successfully!");
          await generateRecommendations();
          setTimeout(() => navigate("/dashboard", { replace: true }), 500);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl sm:max-w-xl mx-auto p-6 sm:p-4">
    {step === 1 && (
        <div>
            <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">Which describes you best?</h2>

            <div className="flex flex-col gap-4">
            <Button
                size="xl"
                className="py-6 text-lg"
                onClick={() => {
                setUserType("high_school");
                handleNext();
                }}
            >
                High School Student
            </Button>

            <Button
                size="xl"
                className="py-6 text-lg"
                onClick={() => {
                setUserType("university");
                handleNext();
                }}
            >
                University Student
            </Button>
            </div>
        </div>
        )}

      {/* High School Flow */}
    {userType === "high_school" && step === 2 && (
    <div>
        <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What year are you currently in?</h2>

        <select
        className="border p-2 w-full mb-4"
        value={formData.year || ""}
        onChange={(e) => handleChange("year", e.target.value)}
        >
        <option value="" disabled>Select your year</option>
        <option value="Year 10">Year 10</option>
        <option value="Year 11">Year 11</option>
        <option value="Year 12">Year 12</option>
        <option value="Other">Other</option>
        </select>

        {formData.year === "Other" && (
        <input
            type="text"
            placeholder="Enter your year (e.g., Year 10)"
            className="border p-2 w-full mb-4"
            onChange={(e) => handleChange("year_other", e.target.value)}
        />
        )}

        <div className="flex justify-between">
        <Button onClick={handlePrev}>
            Back
        </Button>

        <Button 
        onClick={handleNext} 
        disabled={
            !formData.year || 
            (formData.year === "Other" && !formData.year_other)
        }
        >
        Next
        </Button>
        </div>
    </div>
    )}

{userType === "high_school" && step === 3 && (
  <div>
    <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What are your favourite subjects or academic strengths?</h2>

    <div className="flex flex-col gap-3 mb-6">
      {["Science", "Mathematics", "English / Humanities", "Business / Economics", "Arts / Design", "Health / Biology", "Not sure yet"].map((option) => (
        <Button
          key={option}
          color={formData.subjects?.includes(option) ? "blue" : "gray"}
          onClick={() => {
            const updated = formData.subjects?.includes(option)
              ? formData.subjects.filter((s) => s !== option)
              : [...(formData.subjects || []), option];
            handleChange("subjects", updated);
          }}
          className="w-full"
        >
          {option}
        </Button>
      ))}
    </div>

    <div className="flex justify-between">
        <Button onClick={handlePrev}>
            Back
        </Button>

        <Button onClick={handleNext} disabled={!formData.subjects || formData.subjects.length === 0}>
            Next
        </Button>
    </div>

  </div>
)}

  {userType === "high_school" && step === 4 && (
        <div>
          <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What are your hobbies/personal interests?</h2>
          <div className="flex flex-col gap-3 mb-6">
            {["Sports & Fitness", "Creative Arts (music, design, writing)", "Technology & Coding", "Community or Volunteering", "Gaming & Entertainment", "Other", "Not sure yet"].map((option) => (
              <Button
                key={option}
                color={formData.hobbies?.includes(option) ? "blue" : "gray"}
                onClick={() => {
                  const updated = formData.hobbies?.includes(option)
                    ? formData.hobbies.filter((s) => s !== option)
                    : [...(formData.hobbies || []), option];
                  handleChange("hobbies", updated);
                }}
                className="w-full"
              >
                {option}
              </Button>
            ))}
          </div>
          <div className="flex justify-between">
            <Button onClick={handlePrev}>Back</Button>
            <Button onClick={handleNext} disabled={!formData.hobbies || formData.hobbies.length === 0}>Next</Button>
          </div>
        </div>
      )}

    {userType === "high_school" && step === 5 && (
    <div>
        <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What career field(s) interest you the most?</h2>
        <div className="flex flex-col gap-3 mb-6">
        {["Science & Research","Tech & Engineering","Business & Finance","Health & Medicine","Arts & Media","I’m still exploring"
        ].map((option) => (
            <Button
            key={option}
            color={formData.career_fields?.includes(option) ? "blue" : "gray"}
            onClick={() => {
                const updated = formData.career_fields?.includes(option)
                ? formData.career_fields.filter((s) => s !== option)
                : [...(formData.career_fields || []), option];
                handleChange("career_fields", updated);
            }}
            className="w-full"
            >
            {option}
            </Button>
        ))}
        </div>
        <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.career_fields || formData.career_fields.length === 0}>Next</Button>
        </div>
    </div>
    )}


    {userType === "high_school" && step === 6 && (
      <div>
        <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What’s your ATAR status?</h2>
         <div className="flex flex-col gap-3 mb-6">
            <Button color={formData.atar_status === "known" ? "blue" : "gray"} onClick={() => handleChange("atar_status", "known")} className="w-full">I already know my ATAR</Button>
            {formData.atar_status === "known" && (
              <input placeholder="Enter your ATAR" className="border p-2 w-full mb-4 mt-2" onChange={(e) => handleChange("atar", e.target.value)} />
            )}
            <Button color={formData.atar_status === "goal" ? "blue" : "gray"} onClick={() => handleChange("atar_status", "goal")} className="w-full">I don’t have it yet, but I have an ATAR goal</Button>
            {formData.atar_status === "goal" && (
              <input placeholder="Enter your ATAR goal" className="border p-2 w-full mb-4 mt-2" onChange={(e) => handleChange("atar_goal", e.target.value)} />
            )}
            <Button color={formData.atar_status === "unsure" ? "blue" : "gray"} onClick={() => handleChange("atar_status", "unsure")} className="w-full">I’m not sure yet</Button>
          </div>
          <div className="flex justify-between">
            <Button onClick={handlePrev}>Back</Button>
            <Button 
                onClick={handleNext} 
                disabled={
                    !formData.atar_status || 
                    (formData.atar_status === "known" && !formData.atar) || 
                    (formData.atar_status === "goal" && !formData.atar_goal)
                }
            >
            Next
            </Button>
          </div>
        </div>
      )}

      {userType === "high_school" && step === 7 && (
        <div>
          <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">How confident are you about your future study path?</h2>
          <div className="flex flex-col gap-3 mb-6">
            {["Very confident — I know what I want", "Somewhat confident — I have ideas but unsure", "Not confident — I need help figuring it out"].map((option) => (
              <Button
                key={option}
                color={formData.confidence === option ? "blue" : "gray"}
                onClick={() => handleChange("confidence", option)}
                className="w-full"
              >
                {option}
              </Button>
            ))}
          </div>
          <div className="flex justify-between">
            <Button onClick={handlePrev}>Back</Button>
            <Button onClick={handleNext} disabled={!formData.confidence}>Next</Button>
          </div>
        </div>
      )}

    {userType === "high_school" && step === 8 && (
  <div>
    <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">
        What degree(s) are you most interested in?
    </h2>
    <div className="flex flex-col gap-3 mb-6">
      {[
        "Bachelor of Science",
        "Bachelor of Commerce",
        "Bachelor of Arts",
        "Engineering Degree",
        "Health/Medical Degree",
        "Other / Not sure"
      ].map((option) => (
        <Button
          key={option}
          color={formData.degree_interest?.includes(option) ? "blue" : "gray"}
          onClick={() => {
            const updated = formData.degree_interest?.includes(option)
              ? formData.degree_interest.filter((s) => s !== option)
              : [...(formData.degree_interest || []), option];
            handleChange("degree_interest", updated);
          }}
          className="w-full"
        >
          {option}
        </Button>
      ))}
    </div>
    <div className="flex justify-between">
      <Button onClick={handlePrev}>Back</Button>
      <Button onClick={handleSubmit} disabled={!formData.degree_interest || formData.degree_interest.length === 0}>
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </div>
    {message && <p className="mt-2 text-center">{message}</p>}
  </div>
)}

  {userType === "university" && step === 2 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What stage of study are you in?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {["Bachelor's Degree", "Master's Degree", "PhD or Doctoral Program", "Other"].map((option) => (
          <Button
            key={option}
            color={formData.degree_stage === option ? "blue" : "gray"}
            onClick={() => handleChange("degree_stage", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      {formData.degree_stage === "Other" && (
        <input
          type="text"
          placeholder="Please specify"
          className="border p-2 w-full mb-4"
          onChange={(e) => handleChange("degree_stage_other", e.target.value)}
        />
      )}
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.degree_stage || (formData.degree_stage === "Other" && !formData.degree_stage_other)}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 3 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What academic year of your degree are you in?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6 or later", "Other"].map((option) => (
          <Button
            key={option}
            color={formData.academic_year === option ? "blue" : "gray"}
            onClick={() => handleChange("academic_year", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      {formData.academic_year === "Other" && (
        <input
          type="text"
          placeholder="Please specify"
          className="border p-2 w-full mb-4"
          onChange={(e) => handleChange("academic_year_other", e.target.value)}
        />
      )}
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.academic_year || (formData.academic_year === "Other" && !formData.academic_year_other)}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 4 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">Which field is your current program in?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "Commerce & Business",
          "Science",
          "Engineering",
          "Computer Science & IT",
          "Arts & Humanities",
          "Law",
          "Health & Medicine",
          "Media & Communications",
          "Other"
        ].map((option) => (
          <Button
            key={option}
            color={formData.degree_field === option ? "blue" : "gray"}
            onClick={() => handleChange("degree_field", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      {formData.degree_field === "Other" && (
        <input
          type="text"
          placeholder="Please specify"
          className="border p-2 w-full mb-4"
          onChange={(e) => handleChange("degree_field_other", e.target.value)}
        />
      )}
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.degree_field || (formData.degree_field === "Other" && !formData.degree_field_other)}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 5 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">Do you know your WAM (Weighted Average Mark)?</h2>
      <div className="flex flex-col gap-3 mb-6">
        <Button
          color={formData.wam_status === "yes" ? "blue" : "gray"}
          onClick={() => handleChange("wam_status", "yes")}
          className="w-full"
        >
          Yes
        </Button>
        {formData.wam_status === "yes" && (
          <input
            placeholder="Enter your current WAM"
            className="border p-2 w-full mb-4 mt-2"
            onChange={(e) => handleChange("wam", e.target.value)}
          />
        )}
        <Button
          color={formData.wam_status === "no" ? "blue" : "gray"}
          onClick={() => handleChange("wam_status", "no")}
          className="w-full"
        >
          No, I don’t have a WAM yet
        </Button>
      </div>
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.wam_status || (formData.wam_status === "yes" && !formData.wam)}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 6 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">Are you considering switching your academic pathway?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "Yes, I’m thinking of switching my major",
          "No, I’m happy with my current path",
          "Not sure yet"
        ].map((option) => (
          <Button
            key={option}
            color={formData.switching_pathway === option ? "blue" : "gray"}
            onClick={() => handleChange("switching_pathway", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.switching_pathway}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 7 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">How do you feel about your current studies?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "It aligns with my career goals",
          "I’m unsure if it’s the right fit",
          "I feel lost and need help exploring options"
        ].map((option) => (
          <Button
            key={option}
            color={formData.study_feelings === option ? "blue" : "gray"}
            onClick={() => handleChange("study_feelings", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.study_feelings}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 8 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">Which areas of study and careers interest you the most?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "Business & Finance",
          "Tech & Software",
          "Science & Research",
          "Engineering & Design",
          "Health & Medicine",
          "Law & Policy",
          "Arts & Media",
          "Other",
          "I’m still exploring"
        ].map((option) => (
          <Button
            key={option}
            color={formData.interest_areas?.includes(option) ? "blue" : "gray"}
            onClick={() => {
              const updated = formData.interest_areas?.includes(option)
                ? formData.interest_areas.filter((s) => s !== option)
                : [...(formData.interest_areas || []), option];
              handleChange("interest_areas", updated);
            }}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      {formData.interest_areas?.includes("Other") && (
        <input
          type="text"
          placeholder="Please specify"
          className="border p-2 w-full mb-4"
          onChange={(e) => handleChange("interest_areas_other", e.target.value)}
        />
      )}
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.interest_areas || formData.interest_areas.length === 0}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 9 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">What are your hobbies or personal interests?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "Sports & Fitness",
          "Creative Arts (music, design, writing)",
          "Technology & Coding",
          "Volunteering & Community Projects",
          "Gaming & Entertainment",
          "Entrepreneurship",
          "Other",
          "Not sure yet"
        ].map((option) => (
          <Button
            key={option}
            color={formData.hobbies?.includes(option) ? "blue" : "gray"}
            onClick={() => {
              const updated = formData.hobbies?.includes(option)
                ? formData.hobbies.filter((s) => s !== option)
                : [...(formData.hobbies || []), option];
              handleChange("hobbies", updated);
            }}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      {formData.hobbies?.includes("Other") && (
        <input
          type="text"
          placeholder="Please specify"
          className="border p-2 w-full mb-4"
          onChange={(e) => handleChange("hobbies_other", e.target.value)}
        />
      )}
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.hobbies || formData.hobbies.length === 0}>Next</Button>
      </div>
    </div>
  )}

  {userType === "university" && step === 10 && (
    <div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">How confident are you about your future career path?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "Very confident — I know what I want",
          "Somewhat confident — I have ideas but unsure",
          "Not confident — I feel lost"
        ].map((option) => (
          <Button
            key={option}
            color={formData.confidence === option ? "blue" : "gray"}
            onClick={() => handleChange("confidence", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      <h2 className="text-4xl font-bold mb-6 text-center text-slate-800 font-poppins">Would you like help exploring how your courses, majors, and career options connect?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          "Yes, that would be helpful",
          "No, I already feel clear"
        ].map((option) => (
          <Button
            key={option}
            color={formData.want_help === option ? "blue" : "gray"}
            onClick={() => handleChange("want_help", option)}
            className="w-full"
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.confidence || !formData.want_help}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </div>
      {message && <p className="mt-2 text-center">{message}</p>}
    </div>
  )}
    </div>
  );
}

export default SurveyForm;
