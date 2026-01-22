import { useState, useEffect } from '@wordpress/element';
import {
    ChakraProvider, Box, Heading, Text, Tabs, TabList, TabPanels, Tab, TabPanel,
    Table, Thead, Tbody, Tr, Th, Td, Tag, Button, IconButton, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter, useDisclosure,
    FormControl, FormLabel, Flex, Spinner,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
    Input, Stack, InputGroup, InputRightElement, Wrap, WrapItem, Alert, AlertIcon
} from '@chakra-ui/react';
import apiFetch from '@wordpress/api-fetch';
import { DeleteIcon, ViewIcon, AddIcon, DownloadIcon } from '@chakra-ui/icons';

const VisualEditor = ({ questions, onChange, onSave }) => {
    // Helper to update a section
    const updateSection = (idx, field, value) => {
        const newQuestions = [...questions];
        newQuestions[idx] = { ...newQuestions[idx], [field]: value };
        onChange(newQuestions);
    };

    // Helper to update a question in a section
    const updateQuestion = (sectionIdx, qIdx, field, value) => {
        const newQuestions = [...questions];
        const newSectionQuestions = [...newQuestions[sectionIdx].questions];
        newSectionQuestions[qIdx] = { ...newSectionQuestions[qIdx], [field]: value };
        newQuestions[sectionIdx] = { ...newQuestions[sectionIdx], questions: newSectionQuestions };
        onChange(newQuestions);
    };

    // Helper to update an option
    const updateOption = (sectionIdx, qIdx, optIdx, value) => {
        const newQuestions = [...questions];
        const newSectionQuestions = [...newQuestions[sectionIdx].questions];
        const newOptions = [...newSectionQuestions[qIdx].options];
        newOptions[optIdx] = value;
        newSectionQuestions[qIdx] = { ...newSectionQuestions[qIdx], options: newOptions };
        newQuestions[sectionIdx] = { ...newQuestions[sectionIdx], questions: newSectionQuestions };
        onChange(newQuestions);
    };

    // Helper to remove option
    const removeOption = (sectionIdx, qIdx, optIdx) => {
        const newQuestions = [...questions];
        const newSectionQuestions = [...newQuestions[sectionIdx].questions];
        const newOptions = [...newSectionQuestions[qIdx].options];
        newOptions.splice(optIdx, 1);
        newSectionQuestions[qIdx] = { ...newSectionQuestions[qIdx], options: newOptions };
        newQuestions[sectionIdx] = { ...newQuestions[sectionIdx], questions: newSectionQuestions };
        onChange(newQuestions);
    };

    // Helper to add option
    const addOption = (sectionIdx, qIdx) => {
        const newQuestions = [...questions];
        const newSectionQuestions = [...newQuestions[sectionIdx].questions];
        const newOptions = [...(newSectionQuestions[qIdx].options || []), 'New Option'];
        newSectionQuestions[qIdx] = { ...newSectionQuestions[qIdx], options: newOptions };
        newQuestions[sectionIdx] = { ...newQuestions[sectionIdx], questions: newSectionQuestions };
        onChange(newQuestions);
    };

    return (
        <Box>
            <Accordion allowToggle>
                {questions.map((section, sIdx) => (
                    <AccordionItem key={sIdx} border="1px solid" borderColor="gray.200" borderRadius="md" mb={4}>
                        <h2>
                            <AccordionButton _expanded={{ bg: 'pink.50', color: 'pink.600' }}>
                                <Box flex="1" textAlign="left" fontWeight="bold">
                                    {section.id}. {section.title}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <FormControl mb={4}>
                                <FormLabel fontSize="sm" color="gray.500">Judul Bagian</FormLabel>
                                <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(sIdx, 'title', e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={6}>
                                <FormLabel fontSize="sm" color="gray.500">Deskripsi</FormLabel>
                                <Input
                                    value={section.description}
                                    onChange={(e) => updateSection(sIdx, 'description', e.target.value)}
                                />
                            </FormControl>

                            <Heading size="sm" mb={4}>Daftar Pertanyaan</Heading>
                            <Stack spacing={4}>
                                {section.questions.map((q, qIdx) => (
                                    <Box key={qIdx} p={4} bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="xs" color="gray.500">Pertanyaan Ke-{qIdx + 1}</FormLabel>
                                            <Input
                                                value={q.text}
                                                onChange={(e) => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                                                bg="white"
                                            />
                                        </FormControl>

                                        <Text fontSize="xs" fontWeight="bold" mb={2}>Opsi Jawaban:</Text>
                                        <Wrap spacing={2} mb={2}>
                                            {q.options.map((opt, oIdx) => (
                                                <WrapItem key={oIdx}>
                                                    <InputGroup size="sm">
                                                        <Input
                                                            value={opt}
                                                            onChange={(e) => updateOption(sIdx, qIdx, oIdx, e.target.value)}
                                                            bg="white"
                                                            width="150px"
                                                        />
                                                        <InputRightElement>
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                size="xs"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => removeOption(sIdx, qIdx, oIdx)}
                                                            />
                                                        </InputRightElement>
                                                    </InputGroup>
                                                </WrapItem>
                                            ))}
                                            <WrapItem>
                                                <Button size="sm" leftIcon={<AddIcon />} onClick={() => addOption(sIdx, qIdx)}>
                                                    Tambah
                                                </Button>
                                            </WrapItem>
                                        </Wrap>
                                    </Box>
                                ))}
                            </Stack>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
            <Button mt={4} colorScheme="pink" onClick={onSave} size="lg" width="full">
                Simpan Perubahan
            </Button>
        </Box>
    );
};

const AdminDashboard = () => {
    return (
        <ChakraProvider resetCSS={false}>
            <DashboardContent />
        </ChakraProvider>
    );
};

// Separate content to use Toast hook
const DashboardContent = () => {
    const [submissions, setSubmissions] = useState([]);
    const [questions, setQuestions] = useState([]); // Array of sections
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Load Data
    useEffect(() => {
        fetchSubmissions();
        fetchQuestions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch({ path: '/assesmen-maag2/v1/submissions' });
            setSubmissions(data);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error loading submissions', status: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestions = async () => {
        try {
            const data = await apiFetch({ path: '/assesmen-maag2/v1/questions' });
            if (data && Array.isArray(data)) {
                setQuestions(data);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error loading questions', status: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus data ini?')) return;

        try {
            await apiFetch({
                path: `/assesmen-maag2/v1/submissions/${id}`,
                method: 'DELETE'
            });
            toast({ title: 'Data deleted', status: 'success' });
            fetchSubmissions();
        } catch (error) {
            toast({ title: 'Delete failed', status: 'error' });
        }
    };

    const handleSaveQuestions = async () => {
        try {
            await apiFetch({
                path: '/assesmen-maag2/v1/questions',
                method: 'POST',
                data: questions
            });
            toast({ title: 'Pengaturan tersimpan!', status: 'success' });
        } catch (error) {
            toast({ title: 'Gagal menyimpan', description: error.message, status: 'error' });
        }
    };

    const handleExport = () => {
        if (!submissions || submissions.length === 0) {
            toast({ title: 'Tidak ada data untuk diexport', status: 'warning' });
            return;
        }

        // 1. Define Headers (Human Readable)
        const headers = [
            'Tanggal',
            'Nama Lengkap',
            'Email',
            'Nomor Telepon',
            'Usia',
            'Jenis Kelamin',
            'Pekerjaan',
            'Skor (%)',
            'Level Risiko'
        ];

        // 2. Format Data Rows
        const rows = submissions.map(sub => [
            new Date(sub.created_at).toLocaleDateString('id-ID'), // Localized Date
            `"${sub.name || ''}"`, // Quote to handle commas
            sub.email || '',
            `'${sub.phone || ''}`, // Force text format for phone numbers in Excel
            sub.age || '',
            sub.gender === 'male' ? 'Laki-laki' : sub.gender === 'female' ? 'Perempuan' : sub.gender,
            sub.occupation || '',
            sub.score || '0',
            sub.risk_level === 'HIGH' ? 'Tinggi (Berbahaya)' :
                sub.risk_level === 'MODERATE' ? 'Sedang (Waspada)' : 'Rendah (Stabil)'
        ]);

        // 3. Combine to CSV String
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // 4. Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Data_Asesmen_Maag_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openDetail = (sub) => {
        setSelectedSubmission(sub);
        onOpen();
    };

    return (
        <Box bg="white" p={8} borderRadius="lg" boxShadow="sm">
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading size="lg" color="pink.600">Assesmen Maag Dashboard</Heading>
                <Box>
                    <Button onClick={handleExport} leftIcon={<DownloadIcon />} colorScheme="green" size="sm" mr={2}>
                        Export Excel
                    </Button>
                    <Button onClick={fetchSubmissions} size="sm" variant="outline" colorScheme="pink">
                        Refresh Data
                    </Button>
                </Box>
            </Flex>

            <Tabs colorScheme="pink" variant="enclosed">
                <TabList>
                    <Tab fontWeight="bold">Data Submisi</Tab>
                    <Tab fontWeight="bold">Pengaturan Visual</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        {isLoading ? (
                            <Flex justify="center" p={10}><Spinner color="pink.500" /></Flex>
                        ) : (
                            <Box overflowX="auto">
                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.50">
                                        <Tr>
                                            <Th>Tanggal</Th>
                                            <Th>Nama</Th>
                                            <Th>Score</Th>
                                            <Th>Status</Th>
                                            <Th>Aksi</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {submissions.map(sub => (
                                            <Tr key={sub.id} _hover={{ bg: 'gray.50' }}>
                                                <Td>{new Date(sub.created_at).toLocaleDateString()}</Td>
                                                <Td>
                                                    <Text fontWeight="bold">{sub.name}</Text>
                                                    <Text fontSize="xs" color="gray.500">{sub.email}</Text>
                                                </Td>
                                                <Td fontWeight="bold">{sub.score}</Td>
                                                <Td>
                                                    <Tag colorScheme={
                                                        sub.risk_level === 'HIGH' ? 'red' :
                                                            sub.risk_level === 'MODERATE' ? 'yellow' : 'green'
                                                    }>
                                                        {sub.risk_level}
                                                    </Tag>
                                                </Td>
                                                <Td>
                                                    <IconButton
                                                        icon={<ViewIcon />}
                                                        size="xs"
                                                        mr={2}
                                                        colorScheme="blue"
                                                        onClick={() => openDetail(sub)}
                                                        aria-label="View"
                                                    />
                                                    <IconButton
                                                        icon={<DeleteIcon />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        onClick={() => handleDelete(sub.id)}
                                                        aria-label="Delete"
                                                    />
                                                </Td>
                                            </Tr>
                                        ))}
                                        {submissions.length === 0 && (
                                            <Tr><Td colSpan={5} textAlign="center" py={4}>Belum ada data</Td></Tr>
                                        )}
                                    </Tbody>
                                </Table>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel>
                        <Box mb={4}>
                            <Alert status="info" mb={4} borderRadius="md">
                                <AlertIcon />
                                Mode Visual Editor. Anda dapat mengubah teks dan opsi jawaban dengan mudah.
                            </Alert>
                            {questions.length > 0 ? (
                                <VisualEditor
                                    questions={questions}
                                    onChange={setQuestions}
                                    onSave={handleSaveQuestions}
                                />
                            ) : (
                                <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
                                    <Text color="gray.500">
                                        Data pertanyaan belum dimuat. Jika ini pertama kali, jalankan asesmen di frontend sekali untuk inisialisasi, atau klik "Muat Default".
                                    </Text>
                                    {/* Optional: Add a button to seed defaults if API allows */}
                                </Box>
                            )}
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* Detail Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Detail Asesmen</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedSubmission && (
                            <Box>
                                <Table size="sm" variant="striped">
                                    <Tbody>
                                        <Tr><Td fontWeight="bold">Nama</Td><Td>{selectedSubmission.name}</Td></Tr>
                                        <Tr><Td fontWeight="bold">Email</Td><Td>{selectedSubmission.email}</Td></Tr>
                                        <Tr><Td fontWeight="bold">Telp</Td><Td>{selectedSubmission.phone}</Td></Tr>
                                        <Tr><Td fontWeight="bold">Usia</Td><Td>{selectedSubmission.age}</Td></Tr>
                                        <Tr><Td fontWeight="bold">Pekerjaan</Td><Td>{selectedSubmission.occupation}</Td></Tr>
                                        <Tr><Td fontWeight="bold">Risk</Td><Td>{selectedSubmission.risk_level}</Td></Tr>
                                        <Tr><Td fontWeight="bold">Score</Td><Td>{selectedSubmission.score}</Td></Tr>
                                    </Tbody>
                                </Table>
                                <Heading size="sm" mt={4} mb={2}>Jawaban Detail</Heading>
                                <Box bg="gray.100" p={3} borderRadius="md" fontSize="xs">
                                    <pre>{JSON.stringify(JSON.parse(selectedSubmission.answers || '{}'), null, 2)}</pre>
                                </Box>
                            </Box>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AdminDashboard;
