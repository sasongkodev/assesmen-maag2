import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const AssessmentResult = ({ data, onRetake }) => {
    const [result, setResult] = useState(null);
    const hasSubmitted = useRef(false);

    useEffect(() => {
        if (!result) {
            calculateResult();
        } else if (!hasSubmitted.current) {
            submitData(result);
            hasSubmitted.current = true;
        }
    }, [data, result]);

    const submitData = async (calcResult) => {
        try {
            await apiFetch({
                path: '/assesmen-maag2/v1/submit',
                method: 'POST',
                data: {
                    name: data.nama, // Map nama to name
                    email: data.email,
                    phone: data.phone,
                    age: data.age,
                    gender: data.gender,
                    occupation: data.occupation,
                    answers: data.assessment, // Map assessment to answers
                    risk_level: calcResult.riskLevel,
                    score: calcResult.score
                }
            });
            console.log('Assessment saved successfully.');
        } catch (error) {
            console.error('Failed to save assessment', error);
        }
    };

    const calculateResult = () => {
        const answers = data.assessment;
        let riskLevel = 'LOW';
        let score = 0;
        let advice = [];

        // 1. CHECK RED FLAGS (Critical)
        const hasRedFlags = answers.red_flags &&
            answers.red_flags.length > 0 &&
            !answers.red_flags.includes('Tidak mengalami semua di atas');

        if (hasRedFlags) {
            riskLevel = 'HIGH';
            score = 95;
            advice.push({
                type: 'urgent',
                title: __('BAHAYA: Segera ke Dokter', 'assesmen-maag2'),
                content: __('Anda mengalami tanda-tanda bahaya (Red Flags). Jangan melakukan swamedikasi. Segera kunjungi fasilitas kesehatan terdekat untuk pemeriksaan lebih lanjut.', 'assesmen-maag2')
            });
        } else {
            // 2. CHECK MAAG SYMPTOMS
            let symptomScore = 0;

            // Section B: Main Symptoms (High weight)
            if (answers.heartburn === 'Ya') symptomScore += 20;
            if (answers.burning_sensation === 'Ya') symptomScore += 20;
            if (answers.bloating === 'Ya') symptomScore += 10;

            // Section C: Additional Symptoms
            if (answers.nausea !== 'Tidak') symptomScore += 10;
            if (answers.vomiting !== 'Tidak') symptomScore += 15;
            if (answers.early_satiety === 'Ya') symptomScore += 10;

            // Section D: Duration
            if (answers.duration === '> 3 hari') symptomScore += 10;

            score = Math.min(symptomScore, 90); // Cap at 90 for non-red flags

            if (score >= 40) {
                riskLevel = 'MODERATE';

                // Add Medication Advice
                advice.push({
                    type: 'medication',
                    title: __('Saran Obat (Swamedikasi)', 'assesmen-maag2'),
                    content: __('Untuk gejala ini, Anda dapat mempertimbangkan obat bebas (OTC) seperti:', 'assesmen-maag2'),
                    list: [
                        __('Antasida (untuk menetralkan asam lambung)', 'assesmen-maag2'),
                        __('H2 Blocker (seperti Ranitidin - konsultasikan apoteker)', 'assesmen-maag2'),
                        __('Sukralfat (pelapis lambung)', 'assesmen-maag2')
                    ]
                });
            } else {
                riskLevel = 'LOW';
                score = Math.max(score, 10); // Min score 10
                advice.push({
                    type: 'lifestyle',
                    title: __('Pencegahan', 'assesmen-maag2'),
                    content: __('Gejala Anda tergolong ringan. Fokus pada pencegahan dengan pola hidup sehat.', 'assesmen-maag2')
                });
            }
        }

        // 3. TRIGGER BASED ADVICE (For all levels except critical if overwhelmed)
        // Add specific lifestyle advice based on triggers
        if (answers.trigger) {
            if (answers.trigger.includes('Makan pedas')) {
                advice.push({
                    type: 'diet',
                    title: __('Pantangan Makanan', 'assesmen-maag2'),
                    content: __('Hindari makanan pedas, asam, dan bersantan untuk sementara waktu hingga perut membaik.', 'assesmen-maag2')
                });
            }
            if (answers.trigger.includes('Stres')) {
                advice.push({
                    type: 'mind',
                    title: __('Kelola Stres', 'assesmen-maag2'),
                    content: __('Stres memicu produksi asam lambung berlebih. Lakukan relaksasi atau istirahat cukup.', 'assesmen-maag2')
                });
            }
            if (answers.trigger.includes('Telat makan')) {
                advice.push({
                    type: 'habit',
                    title: __('Pola Makan', 'assesmen-maag2'),
                    content: __('Makanlah dengan porsi kecil tapi sering (4-5 kali sehari). Jangan biarkan perut kosong terlalu lama.', 'assesmen-maag2')
                });
            }
        }

        setResult({
            riskLevel,
            score,
            advice
        });
    };

    if (!result) return null;

    const getTheme = () => {
        switch (result.riskLevel) {
            case 'HIGH':
                return {
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    gradient: 'from-red-500 to-red-600',
                    icon: (
                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    ),
                    label: __('Risiko Tinggi', 'assesmen-maag2'),
                    subLabel: __('Perlu Penanganan Medis', 'assesmen-maag2')
                };
            case 'MODERATE':
                return {
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    gradient: 'from-yellow-400 to-yellow-500',
                    icon: (
                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    label: __('Indikasi Gejala Maag', 'assesmen-maag2'),
                    subLabel: __('Boleh Swamedikasi (Hati-hati)', 'assesmen-maag2')
                };
            default:
                return {
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    gradient: 'from-green-400 to-green-500',
                    icon: (
                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    label: __('Kondisi Stabil', 'assesmen-maag2'),
                    subLabel: __('Gejala Ringan / Normal', 'assesmen-maag2')
                };
        }
    };

    const theme = getTheme();

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn">

            {/* Header / Score Card */}
            <div className={`relative overflow-hidden rounded-[32px] shadow-2xl ${theme.gradient} text-white mb-8`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-10 md:p-14 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                        {theme.icon}
                    </div>

                    <h2 className="text-2xl font-bold opacity-90 mb-2 uppercase tracking-wider">{theme.label}</h2>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">{theme.subLabel}</h1>

                    {/* Score Bar */}
                    <div className="max-w-md mx-auto bg-black/20 rounded-full h-4 relative overflow-hidden backdrop-blur-sm">
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-white transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${result.score}%` }}
                        />
                    </div>
                    <p className="mt-3 font-medium opacity-80">
                        {__('Tingkat Keparahan Gejala:', 'assesmen-maag2')} {result.score}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Main Advice Column */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 p-10">
                        <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                            <span className="w-1.5 h-8 bg-pink-500 rounded-full"></span>
                            {__('Rekomendasi Tindakan', 'assesmen-maag2')}
                        </h3>

                        <div className="space-y-6">
                            {result.advice.map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                                        ${item.type === 'urgent' ? 'bg-red-100 text-red-600' :
                                            item.type === 'medication' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>

                                        {item.type === 'urgent' && (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        )}
                                        {item.type === 'medication' && (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        )}
                                        {['diet', 'mind', 'habit', 'lifestyle'].includes(item.type) && (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h4>
                                        <p className="text-gray-600 leading-relaxed">{item.content}</p>
                                        {item.list && (
                                            <ul className="mt-3 space-y-2">
                                                {item.list.map((li, i) => (
                                                    <li key={i} className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                                        {li}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* User Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            {__('Data Pasien', 'assesmen-maag2')}
                        </h4>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl">
                                {data.nama.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{data.nama}</p>
                                <p className="text-sm text-gray-500">{data.age} {__('Tahun', 'assesmen-maag2')}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 border-t border-gray-100 pt-4">
                            <p>{__('Email:', 'assesmen-maag2')} {data.email}</p>
                            <p>{__('Telp:', 'assesmen-maag2')} {data.phone || '-'}</p>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">
                        <h4 className="text-pink-800 font-bold mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {__('Disclaimer Penting', 'assesmen-maag2')}
                        </h4>
                        <p className="text-sm text-pink-700 leading-relaxed">
                            {__('Hasil ini merupakan deteksi dini berdasarkan algoritma dan bukan pengganti diagnosis medis dokter profesional. Jika gejala berlanjut, hubungi dokter.', 'assesmen-maag2')}
                        </p>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                        {__('Ulangi Asesmen', 'assesmen-maag2')}
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-lg"
                    >
                        {__('Cetak Hasil (PDF)', 'assesmen-maag2')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResult;
