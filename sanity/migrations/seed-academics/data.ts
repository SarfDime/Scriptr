export type SeedPerson = {
  name: string
  title: string
  description?: string
  imageUrl?: string
}

export type SeedUniversity = {
  name: string
  description?: string
  streetAddress: string
  telephone?: string
  email?: string
  website: string
}

export type SeedFaculty = {
  name: string
  description?: string
  streetAddress: string
  telephone: string
  email: string
  website: string
}

export type SeedProfessor = {
  name: string
  title?: string
  bio?: string
  office?: string
  telephone?: string
  email?: string
  website: string
  imageUrl?: string
}

export type SeedSubject = {
  name: string
  code?: string
  description?: string
  credits?: number
  syllabus: string
  keywords?: Array<string>
  year: number
  semester?: number
  elective?: boolean
}

// --- Sample data — replace with the real seed set ---

export const persons: Array<SeedPerson> = []

export const universities: Array<SeedUniversity> = []

export const faculties: Array<SeedFaculty> = []

export const professors: Array<SeedProfessor> = []

export const subjects: Array<SeedSubject> = [
  // Semester 1 (Year 1)
  {
    name: 'Introduction to Laboratory biomedical engineering',
    code: 'FFLB01',
    description:
      'Overview of biomedical engineering principles, instrumentation, and clinical laboratory technologies.',
    credits: 2,
    syllabus: '',
    keywords: [
      'biomedical engineering',
      'laboratory equipment',
      'medical devices',
      'instrumentation',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'Basics of laboratory skills',
    code: 'FFLB02',
    description:
      'Fundamental practical skills for handling laboratory glassware, reagents, measurement devices, and basic protocols.',
    credits: 2,
    syllabus: '',
    keywords: [
      'laboratory skills',
      'pipetting',
      'glassware',
      'reagent preparation',
      'lab safety',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'General and Inorganic Chemistry',
    code: 'FFLB03',
    description:
      'Study of atomic structure, chemical bonding, chemical equilibria, stoichiometry, and main group elements.',
    credits: 7,
    syllabus: '',
    keywords: [
      'chemistry',
      'inorganic chemistry',
      'chemical bonding',
      'stoichiometry',
      'reactions',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'Mathematics and laboratory calculations',
    code: 'FFLB04',
    description:
      'Mathematical concepts, unit conversions, solution concentrations, and statistical error calculations in lab work.',
    credits: 4,
    syllabus: '',
    keywords: [
      'mathematics',
      'lab calculations',
      'molarity',
      'dilutions',
      'unit conversion',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'Basic and cell biology',
    code: 'FFLB05',
    description:
      'Exploration of cellular structures, organelles, membrane transport, cell cycle, and core biological processes.',
    credits: 5,
    syllabus: '',
    keywords: [
      'cell biology',
      'cytology',
      'cell structure',
      'organelles',
      'mitosis',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'Biophysics',
    code: 'FFLB06',
    description:
      'Physical principles governing biological systems, thermodynamics, membrane dynamics, and radiation biology.',
    credits: 5,
    syllabus: '',
    keywords: [
      'biophysics',
      'thermodynamics',
      'bioelectricity',
      'membrane transport',
      'biomechanics',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'Biostatistics and bioinformatics',
    code: 'FFLB07',
    description:
      'Statistical analysis of biological data and introduction to biological sequence analysis databases.',
    credits: 3,
    syllabus: '',
    keywords: [
      'biostatistics',
      'bioinformatics',
      'data analysis',
      'genomics',
      'statistics',
    ],
    year: 1,
    semester: 1,
  },
  {
    name: 'Conducting literature research',
    code: 'FFLB08',
    description:
      'Methodologies for searching, evaluating, and citing scientific literature and academic databases.',
    credits: 2,
    syllabus: '',
    keywords: [
      'literature research',
      'scientific writing',
      'database search',
      'citations',
      'methodology',
    ],
    year: 1,
    semester: 1,
  },

  // Semester 2 (Year 1)
  {
    name: 'Organic Chemistry – theoretical basics',
    code: 'FFLB09',
    description:
      'Fundamental concepts of organic functional groups, reaction mechanisms, stereochemistry, and nomenclature.',
    credits: 5,
    syllabus: '',
    keywords: [
      'organic chemistry',
      'functional groups',
      'reaction mechanisms',
      'stereochemistry',
    ],
    year: 1,
    semester: 2,
  },
  {
    name: 'Laboratory Techniques in Organic Chemistry',
    code: 'FFLB10',
    description:
      'Hands-on techniques for synthesis, purification, crystallization, distillation, and characterization of organic compounds.',
    credits: 4,
    syllabus: '',
    keywords: [
      'organic synthesis',
      'purification',
      'distillation',
      'chromatography',
      'crystallization',
    ],
    year: 1,
    semester: 2,
  },
  {
    name: 'Fundamentals of Physical Chemistry',
    code: 'FFLB11',
    description:
      'Thermodynamics, chemical kinetics, phase equilibria, and electrochemistry applied to chemical systems.',
    credits: 5,
    syllabus: '',
    keywords: [
      'physical chemistry',
      'thermodynamics',
      'kinetics',
      'electrochemistry',
      'phase equilibria',
    ],
    year: 1,
    semester: 2,
  },
  {
    name: 'Analytical Chemistry',
    code: 'FFLB12',
    description:
      'Principles of qualitative and quantitative chemical analysis, titrimetry, gravimetry, and solution equilibria.',
    credits: 7,
    syllabus: '',
    keywords: [
      'analytical chemistry',
      'titration',
      'quantitative analysis',
      'gravimetry',
      'chemical equilibrium',
    ],
    year: 1,
    semester: 2,
  },
  {
    name: 'Safety and precautions in laboratory',
    code: 'FFLB13',
    description:
      'Guidelines for biohazard handling, chemical hazard management, waste disposal, and emergency response in laboratories.',
    credits: 3,
    syllabus: '',
    keywords: [
      'lab safety',
      'hazard management',
      'waste disposal',
      'biosafety',
      'PPE',
    ],
    year: 1,
    semester: 2,
  },
  {
    name: 'Legislation and laboratory management',
    code: 'FFLB14',
    description:
      'Regulatory frameworks, quality management standards (ISO/GLP), and operational administration of laboratories.',
    credits: 4,
    syllabus: '',
    keywords: [
      'lab management',
      'ISO standards',
      'GLP',
      'quality control',
      'laboratory regulations',
    ],
    year: 1,
    semester: 2,
  },
  {
    name: 'Sport and health',
    code: 'FFLB15',
    description:
      'Principles of physical activity, exercise physiology, lifestyle health, and injury prevention.',
    credits: 2,
    syllabus: '',
    keywords: [
      'sport science',
      'physical health',
      'exercise physiology',
      'wellness',
      'lifestyle',
    ],
    year: 1,
    semester: 2,
  },

  // Semester 3 (Year 2)
  {
    name: 'Laboratory technics and Instrumental methods – 1',
    code: 'FFLB16',
    description:
      'Basic instrumental analysis including UV-Vis spectroscopy, atomic absorption, and fundamental chromatographic separations.',
    credits: 7,
    syllabus: '',
    keywords: [
      'instrumental analysis',
      'UV-Vis spectroscopy',
      'spectrophotometry',
      'chromatography',
    ],
    year: 2,
    semester: 3,
  },
  {
    name: 'Medical chemistry',
    code: 'FFLB17',
    description:
      'Chemical foundation of drug action, molecular structure-activity relationships, and biochemical drug interactions.',
    credits: 3,
    syllabus: '',
    keywords: [
      'medicinal chemistry',
      'drug design',
      'pharmacophores',
      'structure activity relationship',
    ],
    year: 2,
    semester: 3,
  },
  {
    name: 'Biochemistry fundamentals',
    code: 'FFLB18',
    description:
      'Structure and function of biomolecules including proteins, carbohydrates, lipids, nucleic acids, and enzymatic catalysis.',
    credits: 5,
    syllabus: '',
    keywords: [
      'biochemistry',
      'enzymes',
      'metabolism',
      'biomolecules',
      'proteins',
    ],
    year: 2,
    semester: 3,
  },
  {
    name: 'Molecular biology and genetics',
    code: 'FFLB19',
    description:
      'DNA replication, transcription, translation, gene regulation, and fundamental principles of inheritance.',
    credits: 5,
    syllabus: '',
    keywords: [
      'molecular biology',
      'genetics',
      'DNA',
      'RNA',
      'gene expression',
      'protein synthesis',
    ],
    year: 2,
    semester: 3,
  },
  {
    name: 'Fundamentals of physiology',
    code: 'FFLB20',
    description:
      'Physiological processes and homeostatic mechanisms of human organ systems.',
    credits: 4,
    syllabus: '',
    keywords: [
      'physiology',
      'human body',
      'organ systems',
      'homeostasis',
      'neurophysiology',
    ],
    year: 2,
    semester: 3,
  },

  // Semester 4 (Year 2)
  {
    name: 'Laboratory technics and Instrumental methods – 2',
    code: 'FFLB21',
    description:
      'Advanced instrumental analysis techniques such as HPLC, GC, mass spectrometry, and NMR spectroscopy.',
    credits: 7,
    syllabus: '',
    keywords: [
      'HPLC',
      'mass spectrometry',
      'NMR',
      'gas chromatography',
      'instrumental methods',
    ],
    year: 2,
    semester: 4,
  },
  {
    name: 'Pathophysiology with pathology',
    code: 'FFLB22',
    description:
      'Mechanisms of disease development, tissue injury, cellular adaptation, and physiological dysfunction.',
    credits: 4,
    syllabus: '',
    keywords: [
      'pathophysiology',
      'pathology',
      'disease mechanisms',
      'inflammation',
      'cellular adaptation',
    ],
    year: 2,
    semester: 4,
  },
  {
    name: 'Microbiology with immunology',
    code: 'FFLB23',
    description:
      'Study of microorganisms, microbial pathogenesis, immune responses, antibodies, and vaccination.',
    credits: 6,
    syllabus: '',
    keywords: [
      'microbiology',
      'immunology',
      'bacteriology',
      'immune system',
      'antibodies',
    ],
    year: 2,
    semester: 4,
  },
  {
    name: 'Fundamentals of Biotechnology',
    code: 'FFLB24',
    description:
      'Applications of biological organisms and biological systems in industrial, medical, and agricultural processes.',
    credits: 4,
    syllabus: '',
    keywords: [
      'biotechnology',
      'recombinant DNA',
      'bioprocessing',
      'fermentation',
      'genetics',
    ],
    year: 2,
    semester: 4,
  },
  {
    name: 'Nutritional products',
    code: 'FFLB25',
    description:
      'Chemical composition, functional properties, safety, and health impacts of nutritional substances and food components.',
    credits: 3,
    syllabus: '',
    keywords: [
      'nutrition',
      'food chemistry',
      'nutrients',
      'dietary supplements',
      'food safety',
    ],
    year: 2,
    semester: 4,
  },

  // Semester 5 (Year 3)
  {
    name: 'Cell and animal experimental models',
    code: 'FFLB26',
    description:
      'In vitro cell culture techniques and in vivo animal models used in biomedical and pharmaceutical research.',
    credits: 7,
    syllabus: '',
    keywords: [
      'cell culture',
      'animal models',
      'in vitro',
      'in vivo',
      'experimental models',
    ],
    year: 3,
    semester: 5,
  },
  {
    name: 'Analysis in Pharmaceutical Technology',
    code: 'FFLB27',
    description:
      'Analytical testing methods for dosage form evaluation, raw materials testing, and active pharmaceutical ingredient stability.',
    credits: 5,
    syllabus: '',
    keywords: [
      'pharmaceutical analysis',
      'drug quality control',
      'dosage forms',
      'stability testing',
    ],
    year: 3,
    semester: 5,
  },
  {
    name: 'Natural products and its analysis',
    code: 'FFLB28',
    description:
      'Isolation, structural characterization, and analytical evaluation of bioactive natural compounds.',
    credits: 5,
    syllabus: '',
    keywords: [
      'natural products',
      'phytochemistry',
      'bioactive compounds',
      'isolation',
      'characterization',
    ],
    year: 3,
    semester: 5,
  },
  {
    name: 'Molecular and immunological analysis – theoretical basics',
    code: 'FFLB29',
    description:
      'Theoretical principles of molecular diagnostics, PCR, ELISA, blotting, and flow cytometry techniques.',
    credits: 4,
    syllabus: '',
    keywords: [
      'molecular diagnostics',
      'ELISA',
      'PCR',
      'immunoassays',
      'blotting',
    ],
    year: 3,
    semester: 5,
  },

  // Semester 6 (Year 3)
  {
    name: 'Analysis of clinical biochemistry',
    code: 'FFLB30',
    description:
      'Diagnostic biochemical markers, blood and body fluid analysis, and clinical laboratory testing methods.',
    credits: 6,
    syllabus: '',
    keywords: [
      'clinical biochemistry',
      'biomarkers',
      'blood analysis',
      'diagnostic assays',
      'metabolites',
    ],
    year: 3,
    semester: 6,
  },
  {
    name: 'Toxicological and forensic analysis',
    code: 'FFLB31',
    description:
      'Analytical techniques for detecting poisons, drugs of abuse, toxins, and biological evidence in forensic contexts.',
    credits: 5,
    syllabus: '',
    keywords: [
      'toxicology',
      'forensic science',
      'poison analysis',
      'drug testing',
      'forensics',
    ],
    year: 3,
    semester: 6,
  },
  {
    name: 'Bachelor degree thesis',
    description:
      'Independent research project and academic dissertation defense under faculty supervision.',
    credits: 10,
    syllabus: '',
    keywords: [
      'thesis',
      'bachelor research',
      'dissertation',
      'academic writing',
      'defense',
    ],
    year: 3,
    semester: 6,
  },

  // Mandatory Elective Subjects
  {
    name: 'Computational chemistry',
    code: 'FFLB32',
    description:
      'Computer-aided molecular modeling, quantum chemical calculations, and drug docking simulations.',
    credits: 3,
    syllabus: '',
    keywords: [
      'computational chemistry',
      'molecular modeling',
      'docking',
      'quantum chemistry',
    ],
    year: 2,
    semester: 3,
    elective: true,
  },
  {
    name: 'Combinatorial chemistry',
    code: 'FFLB33',
    description:
      'Principles and high-throughput techniques for generating and screening chemical libraries in drug discovery.',
    credits: 3,
    syllabus: '',
    keywords: [
      'combinatorial chemistry',
      'chemical libraries',
      'high throughput screening',
      'drug discovery',
    ],
    year: 2,
    semester: 3,
    elective: true,
  },
  {
    name: 'Analysis and quality assurance of nutritional products',
    code: 'FFLB36',
    description:
      'Quality control frameworks, contamination screening, and nutritional composition testing of food items.',
    credits: 3,
    syllabus: '',
    keywords: [
      'food quality',
      'quality assurance',
      'nutritional testing',
      'food standards',
    ],
    year: 2,
    semester: 4,
    elective: true,
  },
  {
    name: 'Analysis and quality assurance of water',
    code: 'FFLB37',
    description:
      'Chemical, biological, and physical analysis methods for drinking water and wastewater quality assessment.',
    credits: 3,
    syllabus: '',
    keywords: [
      'water quality',
      'water testing',
      'environmental chemistry',
      'quality assurance',
    ],
    year: 2,
    semester: 4,
    elective: true,
  },
  {
    name: 'Identification and quantification of natural products',
    code: 'FFLB34',
    description:
      'Methods for identifying and measuring bioactive plant secondary metabolites using spectroscopic tools.',
    credits: 3,
    syllabus: '',
    keywords: [
      'natural products',
      'quantification',
      'spectroscopy',
      'phytochemicals',
    ],
    year: 3,
    semester: 5,
    elective: true,
  },
  {
    name: 'Extraction and isolation of natural products',
    code: 'FFLB35',
    description:
      'Techniques for solvent extraction, solid-phase extraction, and purification of active natural constituents.',
    credits: 3,
    syllabus: '',
    keywords: [
      'extraction',
      'isolation',
      'solvent extraction',
      'natural compounds',
    ],
    year: 3,
    semester: 5,
    elective: true,
  },
  {
    name: 'Molecular and immunological analysis 1',
    code: 'FFLB38',
    description:
      'Practical application of PCR techniques, nucleic acid extraction, and basic immunoassay methods.',
    credits: 3,
    syllabus: '',
    keywords: [
      'PCR',
      'nucleic acid extraction',
      'immunoassay',
      'molecular methods',
    ],
    year: 3,
    semester: 5,
    elective: true,
  },
  {
    name: 'Molecular and immunological analysis 2',
    code: 'FFLB39',
    description:
      'Advanced applications in real-time quantitative PCR, western blotting, and flow cytometry.',
    credits: 3,
    syllabus: '',
    keywords: [
      'qPCR',
      'western blot',
      'flow cytometry',
      'advanced molecular analysis',
    ],
    year: 3,
    semester: 5,
    elective: true,
  },

  // General Elective Subjects
  {
    name: 'Design and optimization of technological processes',
    code: 'FFLB40',
    description:
      'Methodologies for optimizing chemical and pharmaceutical manufacturing processes using statistical experimental design.',
    credits: 3,
    syllabus: '',
    keywords: [
      'process optimization',
      'design of experiments',
      'chemical engineering',
      'manufacturing',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Analysis of essential oils and aromatic compounds',
    code: 'FFLB41',
    description:
      'Gas chromatography and mass spectrometry characterization of volatile terpene mixtures and essential oils.',
    credits: 3,
    syllabus: '',
    keywords: [
      'essential oils',
      'aromatic compounds',
      'gas chromatography',
      'terpenes',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Immunological and microbiological methods in drug quality control',
    code: 'FFLB42',
    description:
      'Sterility testing, endotoxin assays, and microbiological safety evaluations for pharmaceutical products.',
    credits: 3,
    syllabus: '',
    keywords: [
      'drug quality control',
      'sterility testing',
      'endotoxin assay',
      'microbiology',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Molecular biotechnology',
    code: 'FFLB43',
    description:
      'Gene cloning, protein expression systems, and genetic engineering methods for industrial applications.',
    credits: 3,
    syllabus: '',
    keywords: [
      'molecular biotechnology',
      'gene cloning',
      'protein expression',
      'recombinant DNA',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Fundamentals of Medical biotechnology',
    code: 'FFLB44',
    description:
      'Biotechnological strategies in biopharmaceuticals, gene therapy, tissue engineering, and diagnostics.',
    credits: 3,
    syllabus: '',
    keywords: [
      'medical biotechnology',
      'biopharmaceuticals',
      'gene therapy',
      'tissue engineering',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Organic biomolecules',
    code: 'FFLB45',
    description:
      'Chemical synthesis, structures, and reactivity of amino acids, peptides, lipids, and carbohydrates.',
    credits: 3,
    syllabus: '',
    keywords: [
      'organic biomolecules',
      'peptides',
      'carbohydrates',
      'bioconjugation',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Sample preparation techniques for analysis',
    code: 'FFLB46',
    description:
      'Advanced techniques for sample clean-up, extraction, digestion, and derivatization prior to analysis.',
    credits: 3,
    syllabus: '',
    keywords: [
      'sample preparation',
      'solid phase extraction',
      'digestion',
      'derivatization',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Preparation and analysis of radiopharmaceuticals',
    code: 'FFLB47',
    description:
      'Radioisotope synthesis, radiolabeling techniques, quality control, and imaging applications in nuclear medicine.',
    credits: 3,
    syllabus: '',
    keywords: [
      'radiopharmaceuticals',
      'nuclear medicine',
      'radioisotopes',
      'radiolabeling',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Sterile techniques and their application',
    code: 'FFLB48',
    description:
      'Aseptic processing, cleanroom standards, sterilization techniques, and contamination control.',
    credits: 3,
    syllabus: '',
    keywords: [
      'sterile techniques',
      'aseptic processing',
      'cleanroom',
      'sterilization',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Professional toxicology',
    code: 'FFLB49',
    description:
      'Occupational exposure limits, chemical hazard risks in workplaces, and industrial toxicology principles.',
    credits: 3,
    syllabus: '',
    keywords: [
      'occupational toxicology',
      'industrial safety',
      'hazard assessment',
      'exposure limits',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Analytical toxicology',
    code: 'FFLB50',
    description:
      'Quantitative measurement of toxic substances and metabolites in biological fluids and tissues.',
    credits: 3,
    syllabus: '',
    keywords: [
      'analytical toxicology',
      'toxicant detection',
      'bioanalysis',
      'poisons',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Ecotoxicology',
    code: 'FFLB51',
    description:
      'Effects of toxic pollutants on ecosystems, environmental bioaccumulation, and ecological risk assessment.',
    credits: 3,
    syllabus: '',
    keywords: [
      'ecotoxicology',
      'environmental risk',
      'pollutants',
      'bioaccumulation',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Clinical enzymology',
    code: 'FFLB52',
    description:
      'Diagnostic application of enzyme activity assays in blood and tissue samples for disease detection.',
    credits: 3,
    syllabus: '',
    keywords: [
      'clinical enzymology',
      'enzyme assays',
      'biomarkers',
      'diagnostic enzymes',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Laboratory work in endocrinology',
    code: 'FFLB53',
    description:
      'Hormone quantification methods, immunoassay validation, and endocrine function diagnostic procedures.',
    credits: 3,
    syllabus: '',
    keywords: [
      'endocrinology',
      'hormone assay',
      'immunoassay',
      'endocrine system',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Quality control of cosmetical products',
    code: 'FFLB54',
    description:
      'Regulatory standards, safety testing, stability evaluation, and formulation analysis for cosmetics.',
    credits: 3,
    syllabus: '',
    keywords: [
      'cosmetic quality control',
      'cosmetology',
      'formulation testing',
      'dermatological safety',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Food toxicology – advanced level',
    code: 'FFLB55',
    description:
      'In-depth study of foodborne toxins, heavy metal contaminants, pesticide residues, and dietary risk assessment.',
    credits: 3,
    syllabus: '',
    keywords: [
      'food toxicology',
      'food contaminants',
      'pesticide residues',
      'mycotoxins',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Analysis and control of genetically modified food – advanced level',
    code: 'FFLB56',
    description:
      'Detection of GMO traits in food products using DNA-based PCR methods and immunoassay tools.',
    credits: 3,
    syllabus: '',
    keywords: [
      'GMO analysis',
      'genetically modified food',
      'PCR testing',
      'food regulation',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Qualification and calibration of measuring equipment and volumetric glassware in laboratory',
    code: 'FFLB57',
    description:
      'Metrology standards, equipment qualification protocols (IQ/OQ/PQ), and calibration procedures for lab tools.',
    credits: 3,
    syllabus: '',
    keywords: [
      'calibration',
      'metrology',
      'equipment qualification',
      'volumetric glassware',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Techniques for determining particle size',
    code: 'FFLB58',
    description:
      'Particle size analysis methods including dynamic light scattering, laser diffraction, and sieve analysis.',
    credits: 3,
    syllabus: '',
    keywords: [
      'particle size',
      'laser diffraction',
      'dynamic light scattering',
      'powder characterization',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Physicochemical and functional tests in drug quality control – advanced level',
    code: 'FFLB59',
    description:
      'Dissolution testing, disintegration, tablet hardness, and active drug release testing techniques.',
    credits: 3,
    syllabus: '',
    keywords: [
      'drug quality control',
      'dissolution testing',
      'tablet disintegration',
      'physicochemical testing',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Bioanalytical chemistry',
    code: 'FFLB60',
    description:
      'Analytical strategies for quantifying small molecule drugs and biologicals in complex biological matrices.',
    credits: 3,
    syllabus: '',
    keywords: [
      'bioanalytical chemistry',
      'pharmacokinetics',
      'bioanalysis',
      'matrix effects',
    ],
    year: 3,
    elective: true,
  },
  {
    name: 'Verification of cleaning processes for laboratory glassware and accessories',
    code: 'FFLB61',
    description:
      'Cleaning validation methodologies, residue limits, swab sampling techniques, and analytical verification protocols.',
    credits: 3,
    syllabus: '',
    keywords: [
      'cleaning validation',
      'swab sampling',
      'residue testing',
      'lab hygiene',
    ],
    year: 3,
    elective: true,
  },
]
