import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const AssessmentQuiz = ({ userData, onComplete }) => {
    const [currentSection, setCurrentSection] = useState(0);
    const [sections, setSections] = useState([]); // Initialize empty, fetch from API
    const [answers, setAnswers] = useState({}); // Answers state

    useEffect(() => {
        // Fetch dynamic questions
        apiFetch({ path: '/assesmen-maag2/v1/questions' })
            .then(data => {
                if (data && Array.isArray(data)) {
                    setSections(data);
                }
            })
            .catch(err => console.error('Failed to load questions, using defaults', err));
    }, []);

    if (sections.length === 0) {
        return <p className="text-center py-10">Loading assessment...</p>;
    }

    const handleAnswer = (sectionId, questionId, value) => {
        setAnswers(prev => {
            // Flatten logic or nested logic depending on structure
            // For simplicity, we can store by question ID or strictly by section
            // Let's store loosely for now, or map to the state structure

            // Actually, let's keep it simple: Just update the specific key
            return {
                ...prev,
                [questionId]: value
            };
        });
    };

    const handleRedFlagChange = (option) => {
        setAnswers(prev => {
            const currentFlags = prev.red_flags || [];
            const isExclusive = option === 'Tidak mengalami semua di atas';

            if (isExclusive) {
                return { ...prev, red_flags: [option] };
            } else {
                // If checking a normal option, remove detailed exclusive option if present
                let newFlags = currentFlags.filter(f => f !== 'Tidak mengalami semua di atas');

                if (newFlags.includes(option)) {
                    newFlags = newFlags.filter(f => f !== option);
                } else {
                    newFlags.push(option);
                }

                // If no flags left, maybe don't default to exclusive, just leave empty?
                // Or force user to pick one. We'll validate before 'Next'.
                return { ...prev, red_flags: newFlags };
            }
        });
    };

    // Validation
    const isCurrentSectionComplete = () => {
        const section = sections[currentSection];
        if (section.id === 'F') {
            return answers.red_flags && answers.red_flags.length > 0;
        }

        return section.questions.every(q => {
            return answers[q.id] !== undefined && answers[q.id] !== '';
        });
    };

    const handleNext = () => {
        if (currentSection < sections.length - 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentSection(prev => prev + 1);
        } else {
            onComplete(answers);
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentSection(prev => prev - 1);
        }
    };



    const totalSteps = sections.length;
    const currentSectionData = sections[currentSection];
    const progress = ((currentSection + 1) / sections.length) * 100;

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                    <span>{__('Langkah', 'assesmen-maag2')} {currentSection + 1} {__('dari', 'assesmen-maag2')} {sections.length}</span>
                    <span>{Math.round(progress)}% {__('Selesai', 'assesmen-maag2')}</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Section Header */}
            <div className="text-center mb-10">
                <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-pink-600 text-sm font-bold mb-3">
                    {__('BAGIAN', 'assesmen-maag2')} {currentSectionData.id}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {currentSectionData.title}
                </h2>
                <p className="text-gray-500 text-lg">
                    {currentSectionData.description}
                </p>
            </div>

            {/* Questions Card */}
            <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(236,72,153,0.15)] p-8 md:p-12 border border-pink-50 relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 space-y-10">
                    {currentSectionData.questions.map((question, index) => (
                        <div key={question.id} className="animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs flex items-center justify-center mt-0.5">
                                    {index + 1}
                                </span>
                                {question.text}
                            </h3>

                            {currentSectionData.id === 'F' ? (
                                // Special handling for Red Flags (Checklist)
                                <div className="grid gap-3">
                                    {question.options.map(option => (
                                        <label
                                            key={option}
                                            className={`
                                                relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                                ${answers.red_flags?.includes(option)
                                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                                                    : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/50 text-gray-600'}
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={answers.red_flags?.includes(option) || false}
                                                onChange={() => handleRedFlagChange(option)}
                                            />
                                            <div className={`
                                                w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                                                ${answers.red_flags?.includes(option)
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'border-gray-300 bg-white'}
                                            `}>
                                                {answers.red_flags?.includes(option) && (
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="font-medium">{option}</span>
                                        </label>
                                    ))}

                                    <div className="my-2 border-t border-gray-100" />

                                    <label
                                        className={`
                                            relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                            ${answers.red_flags?.includes(question.exclusiveOption)
                                                ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                                : 'border-gray-100 hover:border-green-200 hover:bg-green-50/50 text-gray-600'}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={answers.red_flags?.includes(question.exclusiveOption) || false}
                                            onChange={() => handleRedFlagChange(question.exclusiveOption)}
                                        />
                                        <div className={`
                                            w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-colors
                                            ${answers.red_flags?.includes(question.exclusiveOption)
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 bg-white'}
                                        `}>
                                            {answers.red_flags?.includes(question.exclusiveOption) && (
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="font-medium">{question.exclusiveOption}</span>
                                    </label>
                                </div>
                            ) : (
                                // Standard Options (Radio)
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {question.options.map(option => (
                                        <label
                                            key={option}
                                            className={`
                                                relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center
                                                ${answers[question.id] === option
                                                    ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md transform scale-[1.02]'
                                                    : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 text-gray-600'}
                                            `}
                                        >
                                            <input
                                                type="radio"
                                                name={question.id}
                                                value={option}
                                                checked={answers[question.id] === option}
                                                onChange={(e) => handleAnswer(currentSectionData.id, question.id, e.target.value)}
                                                className="hidden"
                                            />
                                            <span className="font-medium">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 px-2">
                <button
                    onClick={handleBack}
                    disabled={currentSection === 0}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                        ${currentSection === 0
                            ? 'opacity-0 pointer-events-none'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}
                    `}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    {__('Kembali', 'assesmen-maag2')}
                </button>

                <button
                    onClick={handleNext}
                    disabled={!isCurrentSectionComplete()}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                        ${!isCurrentSectionComplete()
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-pink-300/50 hover:scale-105 active:scale-95'}
                    `}
                >
                    {currentSection === sections.length - 1 ? (
                        <>
                            {__('Lihat Hasil', 'assesmen-maag2')}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </>
                    ) : (
                        <>
                            {__('Selanjutnya', 'assesmen-maag2')}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AssessmentQuiz;
