import { useContext } from "react";
import { SurveyContext } from "./surveyContext";

export const useSurvey = () => useContext(SurveyContext);
