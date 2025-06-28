import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../context/SurveyContext";

function SurveyForm() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { hasCompletedSurvey } = useSurvey();

  useEffect(() => {
    // if (!session) {
    //     navigate("/signin");
    // } else if (hasCompletedSurvey) {
    //     navigate("/dashboard");
    // }
  }, [session, hasCompletedSurvey, navigate]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

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
        } else {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ student_type: "high_school" })
                .eq("id", session?.user?.id);

            if (profileError) {
                console.error(profileError);
                setMessage("Survey submitted, but failed to update student type.");
            } else {
                setMessage("Survey submitted successfully!");
                setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
            }
        }
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl sm:max-w-xl mx-auto p-6 sm:p-4">
    {step === 1 && (
        <div>
            <h2 className="text-4xl font-bold mb-6 text-center">Which describes you best?</h2>

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
        <h2 className="text-4xl font-bold mb-6 text-center">What year are you currently in?</h2>

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
    <h2 className="text-4xl font-bold mb-6 text-center">What are your favourite subjects or academic strengths?</h2>

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
          <h2 className="text-4xl font-bold mb-6 text-center">What are your hobbies/personal interests?</h2>
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
        <h2 className="text-4xl font-bold mb-6 text-center">What career field(s) interest you the most?</h2>
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
          <h2 className="text-4xl font-bold mb-6 text-center">What’s your ATAR status?</h2>
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
          <h2 className="text-4xl font-bold mb-6 text-center">How confident are you about your future study path?</h2>
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
    <h2 className="text-4xl font-bold mb-6 text-center">
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
      <Button onClick={handleSubmit} disabled={!formData.degree_interest || formData.degree_interest.length === 0} isProcessing={loading}>
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </div>
    {message && <p className="mt-2 text-center">{message}</p>}
  </div>
)}


    {/* University Flow */}
    {userType === "university" && step === 2 && (
        <div>
            <h2 className="text-4xl font-bold mb-6 text-center">Which academic year are you in?</h2>
            <select
            className="border p-2 w-full mb-4"
            value={formData.academic_year || ""}
            onChange={(e) => handleChange("academic_year", e.target.value)}
            >
            <option value="" disabled>Select your year</option>
            <option value="Year 1">Year 1</option>
            <option value="Year 2">Year 2</option>
            <option value="Year 3">Year 3</option>
            <option value="Year 4">Year 4</option>
            <option value="Year 5">Year 5</option>
            <option value="Year 6 or above">Year 6 or above</option>
            </select>

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
            <Button onClick={handleNext} disabled={!formData.academic_year}>Next</Button>
            </div>
        </div>
    )}

    {userType === "university" && step === 3 && (
        <div>
            <h2 className="text-4xl font-bold mb-6 text-center">What degree are you currently enrolled in?</h2>
            <div className="flex flex-col gap-3 mb-6">
            {[
                "Bachelor of Commerce",
                "Bachelor of Science",
                "Bachelor of Engineering (Hons)",
                "Bachelor of Computer Science",
                "Bachelor of Arts",
                "Bachelor of Law",
                "Bachelor of Health Sciences",
                "Bachelor of Media",
                "Other"
            ].map((option) => (
                <Button
                key={option}
                color={formData.degree_program === option ? "blue" : "gray"}
                onClick={() => handleChange("degree_program", option)}
                className="w-full"
                >
                {option}
                </Button>
            ))}
            </div>
            {formData.degree_program === "Other" && (
            <input
                type="text"
                placeholder="Please specify your degree"
                className="border p-2 w-full mb-4"
                onChange={(e) => handleChange("degree_program_other", e.target.value)}
            />
            )}
            <div className="flex justify-between">
            <Button onClick={handlePrev}>Back</Button>
            <Button onClick={handleNext} disabled={!formData.degree_program}>Next</Button>
            </div>
        </div>
    )}

    {userType === "university" && step === 4 && (
    <div>
        <h2 className="text-4xl font-bold mb-6 text-center">Do you know your WAM (Weighted Average Mark)?</h2>
        <div className="flex flex-col gap-3 mb-6">
        <Button color={formData.wam_status === "yes" ? "blue" : "gray"} onClick={() => handleChange("wam_status", "yes")} className="w-full">Yes</Button>
        {formData.wam_status === "yes" && (
            <input
            placeholder="Enter your current WAM"
            className="border p-2 w-full mb-4 mt-2"
            onChange={(e) => handleChange("wam", e.target.value)}
            />
        )}
        <Button color={formData.wam_status === "no" ? "blue" : "gray"} onClick={() => handleChange("wam_status", "no")} className="w-full">No, I don’t have a WAM yet</Button>
        </div>
        <div className="flex justify-between">
        <Button onClick={handlePrev}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.wam_status || (formData.wam_status === "yes" && !formData.wam)}>Next</Button>
        </div>
    </div>
    )}

    {userType === "university" && step === 5 && (
    <div>
        <h2 className="text-4xl font-bold mb-6 text-center">How confident are you about your future career path?</h2>
        
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

        <h2 className="text-4xl font-bold mb-6 text-center">Would you be open to uploading your transcript later for tailored suggestions?</h2>

        <div className="flex flex-col gap-3 mb-6">
        {["Yes, I might upload it later", "No, I prefer not to share"].map((option) => (
            <Button
            key={option}
            color={formData.transcript_willingness === option ? "blue" : "gray"}
            onClick={() => handleChange("transcript_willingness", option)}
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
            disabled={!formData.confidence || !formData.transcript_willingness}
            isProcessing={loading}
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
