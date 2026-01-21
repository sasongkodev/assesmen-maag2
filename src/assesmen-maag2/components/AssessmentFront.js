import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import AssessmentQuiz from './AssessmentQuiz';
import AssessmentResult from './AssessmentResult';

export default function AssessmentFront() {
    const [isFocused, setIsFocused] = useState(null);
    const [step, setStep] = useState('registration'); // registration, transition, quiz, results
    const [formData, setFormData] = useState({
        nama: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        occupation: '',
        consent: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const validateField = (name, value) => {
        switch (name) {
            case 'nama':
                return value.length >= 2 ? '' : __('Nama harus minimal 2 karakter', 'assesmen-maag2');
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : __('Format email tidak valid', 'assesmen-maag2');
            case 'phone':
                if (!value) return '';
                return /^[0-9+\-\s]{10,15}$/.test(value) ? '' : __('Format nomor telepon tidak valid', 'assesmen-maag2');
            case 'age':
                const ageNum = parseInt(value);
                return ageNum >= 12 && ageNum <= 100 ? '' : __('Usia harus antara 12-100 tahun', 'assesmen-maag2');
            case 'gender':
                return value ? '' : __('Pilih jenis kelamin', 'assesmen-maag2');
            case 'occupation':
                return value ? '' : __('Pilih pekerjaan', 'assesmen-maag2');
            case 'consent':
                return value ? '' : __('Anda harus menyetujui persyaratan', 'assesmen-maag2');
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            const error = validateField(name, fieldValue);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to first error
            const firstError = Object.keys(newErrors)[0];
            document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show transition state
            setStep('transition');

            // Proceed to assessment questions after short delay
            setTimeout(() => {
                setStep('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 2000);

        } catch (error) {
            console.error('Submission error:', error);
            alert(__('Terjadi kesalahan. Silakan coba lagi.', 'assesmen-maag2'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuizComplete = (answers) => {
        // Combine registration data and answers
        setFormData(prev => ({
            ...prev,
            assessment: answers
        }));
        setStep('results');
    };

    const occupationOptions = [
        { value: '', label: __('Pilih pekerjaan...', 'assesmen-maag2') },
        { value: 'student', label: __('Pelajar/Mahasiswa', 'assesmen-maag2') },
        { value: 'employee', label: __('Karyawan Swasta', 'assesmen-maag2') },
        { value: 'government', label: __('PNS/TNI/Polri', 'assesmen-maag2') },
        { value: 'entrepreneur', label: __('Wiraswasta/Pengusaha', 'assesmen-maag2') },
        { value: 'professional', label: __('Profesional (Dokter, Pengacara, dll)', 'assesmen-maag2') },
        { value: 'healthcare', label: __('Tenaga Kesehatan', 'assesmen-maag2') },
        { value: 'teacher', label: __('Guru/Dosen', 'assesmen-maag2') },
        { value: 'housewife', label: __('Ibu Rumah Tangga', 'assesmen-maag2') },
        { value: 'retired', label: __('Pensiunan', 'assesmen-maag2') },
        { value: 'other', label: __('Lainnya', 'assesmen-maag2') }
    ];

    if (step === 'quiz') {
        return (
            <div className="assesmen-maag-front font-poppins min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center px-4 py-8">
                <AssessmentQuiz userData={formData} onComplete={handleQuizComplete} />
            </div>
        );
    }

    if (step === 'transition') {
        return (
            <div className="assesmen-maag-front font-poppins min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center px-4">
                <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-[0_20px_60px_rgba(236,72,153,0.25)] overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-30" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-400 rounded-full blur-3xl opacity-20" />

                    <div className="relative p-12 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg mb-8 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {__('Pendaftaran Berhasil!', 'assesmen-maag2')}
                        </h2>

                        <p className="text-gray-600 text-lg mb-8">
                            {__('Terima kasih', 'assesmen-maag2')} <span className="font-semibold text-pink-600">{formData.nama}</span>,
                            {__(' data Anda telah tersimpan.', 'assesmen-maag2')}
                        </p>

                        <div className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-pink-50 text-pink-600 font-semibold animate-pulse">
                            <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {__('Mengalihkan ke halaman asesmen...', 'assesmen-maag2')}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'results') {
        return (
            <div className="assesmen-maag-front font-poppins min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center px-4 py-8">
                <AssessmentResult data={formData} onRetake={() => window.location.reload()} />
            </div>
        );
    }

    return (
        <div className="assesmen-maag-front font-poppins min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center px-4 py-8">
            <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-[0_20px_60px_rgba(236,72,153,0.25)] overflow-hidden">

                {/* Decorative Gradient */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-30" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-400 rounded-full blur-3xl opacity-20" />

                {/* Header */}
                <div className="relative p-8 md:p-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>

                    <h2 className="text-3xl md:text-[32px] font-extrabold text-gray-900 mb-3 tracking-tight">
                        {__('Form Pendaftaran Asesmen Maag', 'assesmen-maag2')}
                    </h2>
                    <p className="text-gray-500 text-[17px] leading-relaxed">
                        {__('Isi data diri Anda dengan lengkap untuk memulai asesmen kesehatan lambung yang personal.', 'assesmen-maag2')}
                    </p>
                </div>

                {/* Form */}
                <form className="relative px-6 md:px-10 pb-10" onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Nama Lengkap */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {__('Nama Lengkap', 'assesmen-maag2')}
                                <span className="text-pink-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="nama"
                                    value={formData.nama}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('nama')}
                                    onBlur={handleBlur}
                                    placeholder={__('Contoh: Ahmad Pratama', 'assesmen-maag2')}
                                    className={`w-full px-5 py-4 rounded-2xl border-2
                                        outline-none transition-all duration-300 text-gray-800 placeholder-gray-400
                                        ${errors.nama ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}
                                        ${isFocused === 'nama' ? 'scale-[1.01] border-pink-500 ring-4 ring-pink-100' : ''}`}
                                    required
                                />
                                {errors.nama && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        {errors.nama}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {__('Alamat Email', 'assesmen-maag2')}
                                <span className="text-pink-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('email')}
                                    onBlur={handleBlur}
                                    placeholder={__('contoh@email.com', 'assesmen-maag2')}
                                    className={`w-full px-5 py-4 rounded-2xl border-2
                                        outline-none transition-all duration-300 text-gray-800 placeholder-gray-400
                                        ${errors.email ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}
                                        ${isFocused === 'email' ? 'scale-[1.01] border-pink-500 ring-4 ring-pink-100' : ''}`}
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Nomor Telepon */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {__('Nomor WhatsApp', 'assesmen-maag2')}
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('phone')}
                                    onBlur={handleBlur}
                                    placeholder={__('0812-3456-7890', 'assesmen-maag2')}
                                    className={`w-full px-5 py-4 rounded-2xl border-2
                                        outline-none transition-all duration-300 text-gray-800 placeholder-gray-400
                                        ${errors.phone ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}
                                        ${isFocused === 'phone' ? 'scale-[1.01] border-pink-500 ring-4 ring-pink-100' : ''}`}
                                />
                                {errors.phone && (
                                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    {__('Opsional. Untuk notifikasi hasil asesmen.', 'assesmen-maag2')}
                                </p>
                            </div>
                        </div>

                        {/* Usia */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {__('Usia', 'assesmen-maag2')}
                                <span className="text-pink-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('age')}
                                    onBlur={handleBlur}
                                    min="12"
                                    max="100"
                                    placeholder={__('Contoh: 28', 'assesmen-maag2')}
                                    className={`w-full px-5 py-4 rounded-2xl border-2
                                        outline-none transition-all duration-300 text-gray-800 placeholder-gray-400
                                        ${errors.age ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}
                                        ${isFocused === 'age' ? 'scale-[1.01] border-pink-500 ring-4 ring-pink-100' : ''}`}
                                    required
                                />
                                {errors.age && (
                                    <p className="mt-2 text-sm text-red-600">{errors.age}</p>
                                )}
                            </div>
                        </div>

                        {/* Jenis Kelamin */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {__('Jenis Kelamin', 'assesmen-maag2')}
                                <span className="text-pink-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('gender')}
                                    onBlur={handleBlur}
                                    className={`w-full px-5 py-4 rounded-2xl border-2 appearance-none
                                        outline-none transition-all duration-300 text-gray-800
                                        ${errors.gender ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}
                                        ${isFocused === 'gender' ? 'border-pink-500 ring-4 ring-pink-100' : ''}
                                        cursor-pointer`}
                                    required
                                >
                                    <option value="">{__('Pilih jenis kelamin...', 'assesmen-maag2')}</option>
                                    <option value="male">{__('Laki-laki', 'assesmen-maag2')}</option>
                                    <option value="female">{__('Perempuan', 'assesmen-maag2')}</option>
                                    <option value="other">{__('Lainnya', 'assesmen-maag2')}</option>
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {errors.gender && (
                                    <p className="mt-2 text-sm text-red-600">{errors.gender}</p>
                                )}
                            </div>
                        </div>

                        {/* Pekerjaan */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {__('Pekerjaan', 'assesmen-maag2')}
                                <span className="text-pink-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    name="occupation"
                                    value={formData.occupation}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('occupation')}
                                    onBlur={handleBlur}
                                    className={`w-full px-5 py-4 rounded-2xl border-2 appearance-none
                                        outline-none transition-all duration-300 text-gray-800
                                        ${errors.occupation ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200'}
                                        ${isFocused === 'occupation' ? 'border-pink-500 ring-4 ring-pink-100' : ''}
                                        cursor-pointer`}
                                    required
                                >
                                    {occupationOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {errors.occupation && (
                                    <p className="mt-2 text-sm text-red-600">{errors.occupation}</p>
                                )}
                            </div>
                        </div>

                        {/* Persetujuan */}
                        <div className="md:col-span-2 mt-6">
                            <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-pink-300 transition-colors cursor-pointer bg-gray-50/50">
                                <input
                                    type="checkbox"
                                    name="consent"
                                    checked={formData.consent}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused('consent')}
                                    onBlur={handleBlur}
                                    className="mt-1 w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                                />
                                <div className="flex-1">
                                    <span className={`font-medium ${errors.consent ? 'text-red-600' : 'text-gray-700'}`}>
                                        {__('Saya menyetujui:', 'assesmen-maag2')}
                                    </span>
                                    <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc pl-5">
                                        <li>{__('Data saya akan digunakan untuk keperluan asesmen medis', 'assesmen-maag2')}</li>
                                        <li>{__('Informasi bersifat rahasia dan aman', 'assesmen-maag2')}</li>
                                        <li>{__('Hasil asesmen bukan diagnosis medis resmi', 'assesmen-maag2')}</li>
                                        <li>{__('Saya dapat menghubungi dokter untuk konsultasi lanjutan', 'assesmen-maag2')}</li>
                                    </ul>
                                    {errors.consent && (
                                        <p className="mt-2 text-sm text-red-600">{errors.consent}</p>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-10 pt-8 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold py-4 text-[17px]
                            shadow-lg shadow-pink-300/40
                            transition-all duration-300
                            hover:shadow-xl hover:shadow-pink-400/50
                            disabled:opacity-70 disabled:cursor-not-allowed
                            active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {__('Memproses...', 'assesmen-maag2')}
                                    </>
                                ) : (
                                    <>
                                        {__('Daftar & Mulai Asesmen', 'assesmen-maag2')}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </span>
                            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            {__('Dengan mendaftar, Anda menyetujui ', 'assesmen-maag2')}
                            <a href="#" className="text-pink-600 hover:text-pink-700 font-medium">
                                {__('Syarat & Ketentuan', 'assesmen-maag2')}
                            </a>
                            {__(' dan ', 'assesmen-maag2')}
                            <a href="#" className="text-pink-600 hover:text-pink-700 font-medium">
                                {__('Kebijakan Privasi', 'assesmen-maag2')}
                            </a>
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-8 py-4 text-center border-t border-pink-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-pink-600 text-sm font-semibold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {__('ISO 27001 Certified', 'assesmen-maag2')}
                        </div>

                        <p className="text-pink-600 text-sm font-semibold tracking-wide">
                            {__('© 2024 Asesmen Maag. Hak Cipta Dilindungi.', 'assesmen-maag2')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}