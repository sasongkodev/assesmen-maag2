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
                    name: data.nama,
                    email: data.email,
                    phone: data.phone,
                    age: data.age,
                    gender: data.gender,
                    occupation: data.occupation,
                    answers: data.assessment,
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
            // Case insensitive check helper
            const check = (val) => val === 'Ya' || val === 'ya';

            // Section B: Main Symptoms
            if (check(answers.heartburn)) symptomScore += 20;
            if (check(answers.burning_sensation)) symptomScore += 20;
            if (check(answers.bloating)) symptomScore += 10;

            // Section C: Additional Symptoms
            if (answers.nausea !== 'Tidak' && answers.nausea !== 'tidak') symptomScore += 10;
            if (answers.vomiting !== 'Tidak' && answers.vomiting !== 'tidak') symptomScore += 15;
            if (check(answers.early_satiety)) symptomScore += 10;

            // Section D: Duration
            if (answers.duration === '> 3 hari') symptomScore += 10;

            score = Math.min(symptomScore, 90);

            if (score >= 40) {
                riskLevel = 'MODERATE';
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
                score = Math.max(score, 10);
                advice.push({
                    type: 'lifestyle',
                    title: __('Pencegahan', 'assesmen-maag2'),
                    content: __('Gejala Anda tergolong ringan. Fokus pada pencegahan dengan pola hidup sehat.', 'assesmen-maag2')
                });
            }
        }

        // 3. TRIGGER BASED ADVICE
        if (answers.trigger) {
            // Helper for contains check
            const hasTrigger = (t) => answers.trigger.includes(t);

            if (hasTrigger('Makan pedas') || hasTrigger('Makan pedas/asam/berlemak')) {
                advice.push({
                    type: 'diet',
                    title: __('Pantangan Makanan', 'assesmen-maag2'),
                    content: __('Hindari makanan pedas, asam, dan bersantan untuk sementara waktu hingga perut membaik.', 'assesmen-maag2')
                });
            }
            if (hasTrigger('Stres')) {
                advice.push({
                    type: 'mind',
                    title: __('Kelola Stres', 'assesmen-maag2'),
                    content: __('Stres memicu produksi asam lambung berlebih. Lakukan relaksasi atau istirahat cukup.', 'assesmen-maag2')
                });
            }
            if (hasTrigger('Telat makan')) {
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
                    // Container
                    cardBg: 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-200',
                    mainText: 'text-white',
                    // Icon
                    iconBg: 'bg-white/20 border-white/30',
                    iconColor: 'text-white',
                    // Labels
                    label: __('Risiko Tinggi', 'assesmen-maag2'),
                    labelClass: 'text-yellow-300',
                    subLabel: __('Perlu Penanganan Medis', 'assesmen-maag2'),
                    // Score Bar
                    scoreTrack: 'bg-black/20 border-white/10',
                    scoreFill: 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]',
                    // Path
                    iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                };
            case 'MODERATE':
                return {
                    cardBg: 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-orange-200',
                    mainText: 'text-white',
                    iconBg: 'bg-white/20 border-white/30',
                    iconColor: 'text-white',
                    label: __('Indikasi Gejala Maag', 'assesmen-maag2'),
                    labelClass: 'text-yellow-200',
                    subLabel: __('Boleh Swamedikasi (Hati-hati)', 'assesmen-maag2'),
                    scoreTrack: 'bg-black/20 border-white/10',
                    scoreFill: 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]',
                    iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                };
            default:
                // Low Risk - Pink Theme (Light Background, Dark Text)
                return {
                    cardBg: 'bg-pink-50 border border-pink-100 shadow-pink-100',
                    mainText: 'text-pink-900',
                    iconBg: 'bg-white border-pink-200 shadow-sm',
                    iconColor: 'text-pink-500',
                    label: __('Kondisi Stabil', 'assesmen-maag2'),
                    labelClass: 'text-pink-500',
                    subLabel: __('Gejala Ringan / Normal', 'assesmen-maag2'),
                    scoreTrack: 'bg-pink-200 border-pink-200',
                    scoreFill: 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]',
                    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                };
        }
    };

    const theme = getTheme();

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn print:max-w-none">

            {/* Header / Score Card */}
            <div className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl ${theme.cardBg} ${theme.mainText} mb-10 print:shadow-none print:rounded-none print:mb-6`}>
                {/* Background Patterns (Adjusted opacity for light theme compatibility) */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative p-10 md:p-14 text-center">
                    <div className={`inline-flex items-center justify-center p-4 rounded-2xl mb-6 shadow-inner border backdrop-blur-md ${theme.iconBg}`}>
                        <svg className={`w-12 h-12 drop-shadow-md ${theme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={theme.iconPath} />
                        </svg>
                    </div>

                    <h2 className={`text-lg font-bold uppercase tracking-[0.2em] mb-2 ${theme.labelClass}`}>{theme.label}</h2>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight drop-shadow-sm">{theme.subLabel}</h1>

                    {/* Score Bar */}
                    <div className="max-w-lg mx-auto">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
                            <span>Sehat</span>
                            <span>Kritis</span>
                        </div>
                        <div className={`h-4 rounded-full overflow-hidden backdrop-blur-sm border relative ${theme.scoreTrack}`}>
                            <div
                                className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${theme.scoreFill}`}
                                style={{ width: `${result.score}%`, borderRadius: '9999px' }}
                            />
                        </div>
                        <p className="mt-4 font-medium opacity-90">
                            {__('Tingkat Keparahan Gejala:', 'assesmen-maag2')} <strong className="text-2xl ml-1">{result.score}%</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">

                {/* Main Advice Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-[2rem] shadow-lg shadow-gray-100 border border-gray-100 p-6 md:p-10 print:shadow-none print:border-0 print:p-0">
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </span>
                            {__('Rekomendasi Medis', 'assesmen-maag2')}
                        </h3>

                        <div className="space-y-6">
                            {result.advice.map((item, index) => (
                                <div key={index} className={`flex gap-5 p-6 rounded-2xl transition-colors border
                                    ${item.type === 'urgent' ? 'bg-red-50/50 border-red-100' :
                                        item.type === 'medication' ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>

                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm
                                        ${item.type === 'urgent' ? 'bg-red-500 text-white' :
                                            item.type === 'medication' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'}`}>

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
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-lg mb-2 ${item.type === 'urgent' ? 'text-red-600' :
                                            item.type === 'medication' ? 'text-blue-600' : 'text-gray-900'
                                            }`}>{item.title}</h4>
                                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.content}</p>
                                        {item.list && (
                                            <ul className="mt-4 grid gap-2">
                                                {item.list.map((li, i) => (
                                                    <li key={i} className="flex items-center text-sm text-gray-700 bg-white/60 p-2 rounded border border-gray-100/50">
                                                        <span className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${item.type === 'urgent' ? 'bg-red-400' :
                                                            item.type === 'medication' ? 'bg-blue-400' : 'bg-pink-400'
                                                            }`}></span>
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
                <div className="lg:col-span-4 space-y-6 print:hidden">
                    {/* User Summary */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
                            {__('Data Pasien', 'assesmen-maag2')}
                        </h4>
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-2xl shadow-inner">
                                {data.nama.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-xl text-gray-900">{data.nama}</p>
                                <p className="text-sm text-gray-500 font-medium">{data.age} {__('Tahun', 'assesmen-maag2')}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3 pt-6 border-t border-gray-100">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Email</span>
                                <span className="font-medium">{data.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Telp</span>
                                <span className="font-medium">{data.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Pekeryaan</span>
                                <span className="font-medium">{data.occupation || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-pink-50/50 rounded-2xl p-6 border border-pink-100">
                        <h4 className="text-pink-700 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {__('Disclaimer', 'assesmen-maag2')}
                        </h4>
                        <p className="text-xs text-pink-600/80 leading-relaxed">
                            {__('Hasil ini merupakan deteksi dini berdasarkan algoritma dan bukan pengganti diagnosis medis dokter profesional. Jika gejala berlanjut, hubungi dokter.', 'assesmen-maag2')}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        <button
                            onClick={() => window.print()}
                            className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            {__('Cetak PDF', 'assesmen-maag2')}
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {__('Ulangi Tes', 'assesmen-maag2')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResult;
