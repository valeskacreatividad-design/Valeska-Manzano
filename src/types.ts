export type QuestionType = 'radio' | 'checkbox' | 'text' | 'textarea' | 'rating' | 'yesno';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  placeholder?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  adminKey: string;
  questions: Question[];
  active: boolean;
  responseCount: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  submittedAt: string;
  respondentName?: string;
  answers: Record<string, string | string[] | number>;
}

export interface SurveySummary {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questionsCount: number;
  responseCount: number;
  active: boolean;
}
