import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import {
  QUIZ_SCENARIO,
  QUIZ_TITLE,
  type QuizQuestion,
} from '../data/quizQuestions';

interface QuizPanelProps {
  nickname: string;
  score: number;
  question: QuizQuestion;
  totalQuestions: number;
  selectedOptionId: string | null;
  isSubmitted: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  awardedSpeedBonus: boolean;
  onSelectOption: (optionId: string) => void;
  onSubmitAnswer: () => Promise<void>;
  onNextQuestion: () => void;
}

export function QuizPanel({
  nickname,
  score,
  question,
  totalQuestions,
  selectedOptionId,
  isSubmitted,
  isSubmitting,
  submitError,
  awardedSpeedBonus,
  onSelectOption,
  onSubmitAnswer,
  onNextQuestion,
}: QuizPanelProps) {
  const isFinalQuestion = question.number === totalQuestions;
  const isUserCorrect = isSubmitted && selectedOptionId === question.correctOptionId;
  const progressPercentage = Math.round((question.number / totalQuestions) * 100);

  return (
    <main className="w-full lg:w-[70%] bg-white text-[#1a1a1a] px-6 py-8 sm:px-10 lg:px-12 lg:py-10 flex flex-col justify-between">
      <div className="max-w-3xl w-full mx-auto">
        <header className="pb-6 border-b border-stone-200">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-[#8c1f3d] [text-wrap:balance]">
            {QUIZ_TITLE}
          </h1>
          <h2 className="mt-2.5 text-sm sm:text-base font-semibold leading-relaxed text-[#0b4f36]">
            {QUIZ_SCENARIO}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#1a1a1a]/75">
            <span>
              Student: <strong className="font-semibold text-[#1a1a1a]">{nickname}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-medium text-[#1a1a1a]">
              Score: {score} {score === 1 ? 'pt' : 'pts'}
            </span>
          </div>
          <div
            className="mt-3 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="h-full bg-[#8c1f3d] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </header>

        <section className="mt-8" aria-labelledby="active-question-heading">
          <div className="text-xs font-semibold tracking-wide text-[#0b4f36] mb-2 font-mono tabular-nums">
            Question {question.number} of {totalQuestions}
          </div>

          <h3
            id="active-question-heading"
            className="text-xl sm:text-2xl font-semibold leading-snug text-[#1a1a1a]"
          >
            {question.prompt}
          </h3>

          <div
            role="radiogroup"
            aria-labelledby="active-question-heading"
            className="mt-6 space-y-3"
          >
            {question.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectOption = option.id === question.correctOptionId;

              let cardClasses =
                'bg-white border border-stone-300 hover:border-[#8c1f3d]/70 hover:bg-stone-50';
              let radioClasses = 'border-stone-400 bg-white';

              if (!isSubmitted && isSelected) {
                cardClasses = 'bg-[#8c1f3d]/[0.04] border-2 border-[#8c1f3d]';
                radioClasses = 'border-[#8c1f3d] bg-[#8c1f3d]';
              } else if (isSubmitted && isCorrectOption) {
                cardClasses = 'bg-emerald-50 border-2 border-emerald-600';
                radioClasses = 'border-emerald-600 bg-emerald-600';
              } else if (isSubmitted && !isCorrectOption) {
                cardClasses = 'bg-red-50 border-2 border-red-600';
                radioClasses = 'border-red-600 bg-red-600';
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isSubmitted || isSubmitting}
                  onClick={() => onSelectOption(option.id)}
                  data-testid={`option-${option.id}`}
                  className={`w-full text-left rounded-xl px-4 py-4 sm:px-5 sm:py-4 transition-colors flex items-center justify-between gap-4 min-h-[56px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c1f3d] ${
                    isSubmitted ? 'cursor-default' : 'cursor-pointer'
                  } ${cardClasses}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${radioClasses}`}
                      aria-hidden="true"
                    >
                      {(isSelected || (isSubmitted && isCorrectOption)) && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="text-base font-medium text-[#1a1a1a] leading-snug">
                      <span className="font-semibold mr-1.5">{option.id})</span>
                      {option.label}
                    </span>
                  </div>

                  {isSubmitted && (
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                      {isCorrectOption ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-800">
                          <XCircle className="w-4 h-4 text-red-700" aria-hidden="true" />
                          {isSelected ? 'Your choice · Incorrect' : 'Incorrect'}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {submitError && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            {!isSubmitted ? (
              <button
                type="button"
                disabled={!selectedOptionId || isSubmitting}
                onClick={() => void onSubmitAnswer()}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#8c1f3d] hover:bg-[#741832] disabled:bg-stone-300 disabled:text-stone-500 text-white font-semibold text-base transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c1f3d]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <>
                <div className="text-sm font-medium text-[#1a1a1a]">
                  {isUserCorrect ? (
                    <span className="text-emerald-800 font-semibold">
                      Correct answer (+1 pt).
                    </span>
                  ) : (
                    <span className="text-red-800 font-semibold">
                      Incorrect answer (+0 pts). Correct option: {question.correctOptionId}.
                    </span>
                  )}
                  {isFinalQuestion && awardedSpeedBonus && (
                    <span className="ml-2 text-[#0b4f36] font-semibold">
                      First Finisher Speed Bonus awarded (+3 pts)!
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onNextQuestion}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0b4f36] hover:bg-[#083b28] text-white font-semibold text-base transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b4f36]"
                >
                  <span>{isFinalQuestion ? 'View Final Results' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
