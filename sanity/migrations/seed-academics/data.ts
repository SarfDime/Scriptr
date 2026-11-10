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
  website?: string
  picture?: string
}

export type SeedSubject = {
  code?: {
    en: string
    mk: string
  }
  description?: {
    en: string
    mk: string
  }
  credits?: number
  syllabus?: string
  keywords?: {
    en: Array<string>
    mk: Array<string>
  }
  professors?: Array<string>
  year: number
  semester?: number
  elective?: boolean
  title?: {
    en: string
    mk: string
  }
}

// --- Sample data — replace with the real seed set ---

export const persons: Array<SeedPerson> = []

export const universities: Array<SeedUniversity> = []

export const faculties: Array<SeedFaculty> = []

export const professors: Array<SeedProfessor> = []

export const electiveSubjects: Array<SeedSubject> = [
  {
    code: {
      en: 'FFLB32',
      mk: 'ФФЛБ32',
    },
    description: {
      en: 'Procedures and principles for preparing samples from various media, sample storage, selection, development and validation of the preparation method, quality control during preparation and statistical treatment of results.',
      mk: 'Постапки и принципи за подготовка на примероци од различен медиум, чување на примерокот, избор, развој и валидација на методот за подготовка, контрола на квалитет во тек на подготовката и статистичка обработка на резултатите.',
    },
    credits: 4,
    keywords: {
      en: [
        'sample preparation',
        'extraction',
        'sample storage',
        'method validation',
        'quality control',
        'statistical treatment',
      ],
      mk: [
        'подготовка на примерок',
        'екстракција',
        'чување на примерок',
        'валидација на метод',
        'контрола на квалитет',
        'статистичка обработка',
      ],
    },
    professors: [
      'Проф. д-р Јасмина Тониќ Рибарска',
      'Проф. д-р Сузана Трајковиќ Јолевска',
      'Проф. д-р Наталија Наков',
    ],
    semester: 3,
    title: {
      en: 'Sample Preparation Techniques for Analysis',
      mk: 'Техники за подготовка на примероци за анализа',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB33',
      mk: 'ФФЛБ33',
    },
    description: {
      en: 'Structure and reactivity of biologically important molecules: classification and reactivity of monosaccharides, amino acids and peptides, lipids (triglycerides, phospholipids, steroids, prostaglandins, terpenes), nucleosides, nucleotides, nucleic acids and heterocyclic compounds.',
      mk: 'Структура и реактивност на биолошки значајни молекули: класификација и реактивност на моносахариди, аминокиселини и пептиди, липиди (триглицериди, фосфолипиди, стероиди, простагландини, терпени), нуклеозиди, нуклеотиди, нуклеински киселини и хетероциклични соединенија.',
    },
    credits: 4,
    keywords: {
      en: [
        'monosaccharides',
        'amino acids',
        'peptides',
        'lipids',
        'steroids',
        'terpenes',
        'nucleotides',
        'heterocycles',
      ],
      mk: [
        'моносахариди',
        'аминокиселини',
        'пептиди',
        'липиди',
        'стероиди',
        'терпени',
        'нуклеотиди',
        'хетероцикли',
      ],
    },
    professors: [
      'Проф. д-р Ана Поцева-Пановска',
      'Проф. д-р Јасмина Тониќ Рибарска',
    ],
    semester: 3,
    title: {
      en: 'Organic Biomolecules',
      mk: 'Органски биомолекули',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB34',
      mk: 'ФФЛБ34',
    },
    description: {
      en: 'National and international standards for qualification of measuring equipment and volumetric glassware, technical competence, selection of qualification parameters, measurement uncertainty and planning, execution and documentation of the qualification process.',
      mk: 'Национални и меѓународни стандарди за квалификација на мерна опрема и волуметриски прибор, техничка компетентност, избор на параметри при квалификација, мерна неодреденост и планирање, спроведување и документирање на процесот на квалификација.',
    },
    credits: 4,
    keywords: {
      en: [
        'qualification',
        'calibration',
        'volumetric glassware',
        'measurement uncertainty',
        'ISO/IEC 17025',
        'technical competence',
      ],
      mk: [
        'квалификација',
        'калибрација',
        'волуметриски прибор',
        'мерна неодреденост',
        'ISO/IEC 17025',
        'техничка компетентност',
      ],
    },
    professors: [
      'Проф. д-р Јелена Ацевска',
      'Проф. д-р Наталија Наков',
      'Проф. д-р Ана Поцева Пановска',
      'Проф. д-р Катерина Брезовска',
    ],
    semester: 3,
    title: {
      en: 'Qualification and Calibration of Measuring Equipment and Volumetric Laboratory Glassware',
      mk: 'Квалификација и калибрација на мерна опрема и волуметриски лабораториски прибор',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB35',
      mk: 'ФФЛБ35',
    },
    description: {
      en: 'Structure and organization of genes and the human genome, Mendelian inheritance and deviations, mutation types and repair, population genetics and genotype/allele frequencies, genetic diseases, pedigrees and somatic mutations in malignancies.',
      mk: 'Структура и организација на гените и човечкиот геном, Менделово наследување и отстапувања, типови мутации и поправка, популациска генетика и фреквенции на генотипови и алели, генетски болести, родословни стебла и соматски мутации кај малигни заболувања.',
    },
    credits: 4,
    keywords: {
      en: [
        'Mendelian inheritance',
        'mutations',
        'population genetics',
        'allele frequencies',
        'genetic diseases',
        'pedigree',
        'somatic mutations',
      ],
      mk: [
        'Менделово наследување',
        'мутации',
        'популациска генетика',
        'алелни фреквенции',
        'генетски болести',
        'родословно стебло',
        'соматски мутации',
      ],
    },
    professors: [
      'Проф. д-р Надица Матевска-Гешковска',
      'Доц. д-р Марија Станинова Стојовска',
    ],
    semester: 3,
    title: {
      en: 'Principles of Inheritance and Genetic Diseases',
      mk: 'Принципи на наследување и генетски болести',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB36',
      mk: 'ФФЛБ36',
    },
    description: {
      en: 'Genetic modifications of food products, genetically modified food and ingredients obtained by genetic engineering, health impact, methods for testing and control of GM food and relevant regulations.',
      mk: 'Генетски модификации на прехранбени производи, генетски модифицирана храна и состојки добиени со генетски инженеринг, влијание врз здравјето, методи за испитување и контрола на ГМ храна и соодветна регулатива.',
    },
    credits: 4,
    keywords: {
      en: [
        'GMO',
        'genetic modifications',
        'GM ingredients',
        'GMO detection',
        'food safety',
        'regulations',
      ],
      mk: [
        'ГМО',
        'генетски модификации',
        'ГМ состојки',
        'детекција на ГМО',
        'безбедност на храна',
        'регулатива',
      ],
    },
    professors: ['Доц. д-р Зоран Живиќ', 'Проф. д-р Тања Петреска Ивановска'],
    semester: 5,
    title: {
      en: 'Testing and Control of Genetically Modified Food – Advanced Level',
      mk: 'Испитување и контрола на генетски модифицирана храна – напредно ниво',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB37',
      mk: 'ФФЛБ37',
    },
    description: {
      en: 'Legislation on drinking water quality and safety, testing and control methods, monitoring of contaminants (faecal indicators, microbiological contaminants, heavy metals, radioactive substances) and development of new water analysis methods.',
      mk: 'Законска регулатива за квалитет и безбедност на вода за пиење, методи за испитување и контрола, следење на загадувачи (фекални индикатори, микробиолошки контаминенти, тешки метали, радиоактивни материи) и развој на нови методи за анализа на води.',
    },
    credits: 4,
    keywords: {
      en: [
        'drinking water',
        'water quality',
        'faecal indicators',
        'heavy metals',
        'radioactive substances',
        'legislation',
      ],
      mk: [
        'вода за пиење',
        'квалитет на вода',
        'фекални индикатори',
        'тешки метали',
        'радиоактивни материи',
        'законска регулатива',
      ],
    },
    professors: ['Проф. д-р Тања Петреска Ивановска', 'Доц. д-р Зоран Живиќ'],
    semester: 4,
    title: {
      en: 'Water Testing and Control',
      mk: 'Испитување и контрола на вода',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB38',
      mk: 'ФФЛБ38',
    },
    description: {
      en: 'Modern techniques in molecular diagnostics: DNA/RNA library preparation, next-generation sequencing technologies, bioinformatic processing of results, microarray technology and digital PCR, including prognosis and prediction of therapy effects.',
      mk: 'Современи техники во молекуларната дијагностика: изработка на ДНК/РНК библиотеки, секвенционирачки технологии од нова генерација, биоинформатичка обработка на резултати, микроерејна технологија и дигитална PCR, вклучително прогноза и предикција на ефекти од терапија.',
    },
    credits: 4,
    keywords: {
      en: [
        'NGS',
        'DNA/RNA libraries',
        'bioinformatics',
        'microarray technology',
        'digital PCR',
        'molecular diagnostics',
      ],
      mk: [
        'NGS',
        'ДНК/РНК библиотеки',
        'биоинформатика',
        'микроерејна технологија',
        'дигитална PCR',
        'молекуларна дијагностика',
      ],
    },
    professors: [
      'Проф. д-р Надица Матевска-Гешковска',
      'Доц. д-р Марија Станинова Стојовска',
    ],
    semester: 5,
    title: {
      en: 'Molecular Genetic Analyses – Advanced Level',
      mk: 'Молекуларни генетски анализи – напредно ниво',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB39',
      mk: 'ФФЛБ39',
    },
    description: {
      en: 'Significance and application of biochemical tests for enzyme activity determination in laboratory diagnostics: changes in serum enzyme activity, organ specificity, organ enzyme patterns and methods for determination and interpretation of results.',
      mk: 'Значење и примена на биохемиски тестови за определување на активност на ензими во лабораториската дијагностика: промени во серумската ензимска активност, органска специфичност, ензимска слика на органите и методи за определување и толкување на резултати.',
    },
    credits: 4,
    keywords: {
      en: [
        'serum enzymes',
        'enzyme activity',
        'isoenzymes',
        'organ specificity',
        'diagnostics',
        'result interpretation',
      ],
      mk: [
        'серумски ензими',
        'ензимска активност',
        'изоензими',
        'органска специфичност',
        'дијагностика',
        'толкување на резултати',
      ],
    },
    professors: ['Проф. д-р Татјана Кадифкова Пановска'],
    semester: 5,
    title: {
      en: 'Clinical Enzymology',
      mk: 'Клиничка ензимологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB40',
      mk: 'ФФЛБ40',
    },
    description: {
      en: 'Biochemical aspects of endocrinology and laboratory analysis in hormonal disorders: general rules of endocrine diagnostics, testing of pituitary, adrenal, thyroid and parathyroid gland function, pancreas and sex hormones.',
      mk: 'Биохемиски аспекти на ендокринологијата и лабораториска анализа при хормонски пореметувања: општи правила на ендокринолошка дијагностика, испитување на функцијата на хипофизата, надбубрежните жлезди, тироидната и паратироидната жлезда, панкреасот и половите хормони.',
    },
    credits: 4,
    keywords: {
      en: [
        'hormones',
        'pituitary',
        'thyroid gland',
        'adrenal gland',
        'pancreas',
        'sex hormones',
        'endocrine diagnostics',
      ],
      mk: [
        'хормони',
        'хипофиза',
        'тироидна жлезда',
        'надбубрежна жлезда',
        'панкреас',
        'полови хормони',
        'ендокринолошка дијагностика',
      ],
    },
    professors: ['Проф. д-р Марија Хиљадникова-Бајро'],
    semester: 5,
    title: {
      en: 'Laboratory Endocrinology',
      mk: 'Лабораториска ендокринологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB41',
      mk: 'ФФЛБ41',
    },
    description: {
      en: 'The 12 principles of green analytical chemistry, eco-friendly sample preparation, replacement of toxic reagents and solvents, application of GAC principles in instrumental methods and approaches for energy saving and waste reduction.',
      mk: '12-те начела на „зелената“ аналитичка хемија, еколошки подобна подготовка на примероци, замена на токсични реагенси и растворувачи, примена на GAC начелата во инструментални методи и пристапи за заштеда на енергија и намалување на отпад.',
    },
    credits: 4,
    keywords: {
      en: [
        'green analytical chemistry',
        'GAC',
        'eco-friendly solvents',
        'waste reduction',
        'energy saving',
        'green HPLC',
      ],
      mk: [
        'зелена аналитичка хемија',
        'GAC',
        'еколошки растворувачи',
        'намалување на отпад',
        'заштеда на енергија',
        'зелен HPLC',
      ],
    },
    professors: [
      'Проф. д-р Наталија Наков',
      'Проф. д-р Јелена Ацевска',
      'Проф. д-р Ана Поцева Пановска',
      'Проф. д-р Катерина Брезовска',
      'Проф. д-р Јасмина Тониќ Рибарска',
    ],
    semester: 5,
    title: {
      en: 'Basic Principles for Development of Environmentally Friendly Analytical Methods',
      mk: 'Основни начела за развој на еколошки подобни аналитички методи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB42',
      mk: 'ФФЛБ42',
    },
    description: {
      en: 'Analytical methods and procedures for analysis of biological samples, modern trends in bioanalysis, methods for analysis and stability monitoring of biomolecules as active components of biopharmaceuticals, development and validation of bioanalytical methods.',
      mk: 'Аналитички методи и постапки за анализа на примероци од биолошко потекло, современи трендови во биоаналитиката, методи за анализа и следење на стабилноста на биомолекули како активни компоненти на биофармацевтски препарати, развој и валидација на биоаналитички методи.',
    },
    credits: 4,
    keywords: {
      en: [
        'biological samples',
        'bioanalysis',
        'biomolecule stability',
        'biopharmaceuticals',
        'validation',
        'LC-MS',
      ],
      mk: [
        'биолошки примероци',
        'биоанализа',
        'стабилност на биомолекули',
        'биофармацевтски препарати',
        'валидација',
        'LC-MS',
      ],
    },
    professors: [
      'Проф. д-р Јасмина Тониќ Рибарска',
      'Проф. д-р Катерина Брезовска',
      'Проф. д-р Наталија Наков',
      'Проф. д-р Ана Поцева Пановска',
    ],
    semester: 5,
    title: {
      en: 'Bioanalytical Chemistry',
      mk: 'Биоаналитичка хемија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB43',
      mk: 'ФФЛБ43',
    },
    description: {
      en: 'Parameters for establishing the quality of active substances and finished pharmaceutical products: interpretation of European Pharmacopoeia monographs, physical and physicochemical methods, instrumental and separation techniques and pharmaceutical-technological functional tests.',
      mk: 'Параметри за утврдување на квалитетот на активна супстанција и готов фармацевтски производ: интерпретација на монографии од Европската фармакопеја, физички и физичко-хемиски методи, инструментални и сепаративни техники и фармацевтско-технолошки функционални тестови.',
    },
    credits: 4,
    keywords: {
      en: [
        'pharmacopoeia',
        'Ph. Eur.',
        'identification',
        'assay',
        'functional tests',
        'quality control',
      ],
      mk: [
        'фармакопеја',
        'Ph. Eur.',
        'идентификација',
        'квантитативно определување',
        'функционални тестови',
        'контрола на квалитет',
      ],
    },
    professors: [
      'Проф. д-р Катерина Брезовска',
      'Проф. д-р Анета Димитровска',
      'Проф. д-р Сузана Трајковиќ Јолевска',
      'Проф. д-р Јелена Ацевска',
    ],
    semester: 5,
    title: {
      en: 'Physicochemical Methods and Functional Tests in Drug Quality Control',
      mk: 'Физичко-хемиски методи и функционални тестови во контрола на квалитет на лекови',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB44',
      mk: 'ФФЛБ44',
    },
    description: {
      en: 'National and international cosmetics regulations, GMP principles, cosmetic product categories, active substances, excipients and restricted raw materials, quality control parameters and stability studies.',
      mk: 'Национални и меѓународни регулативи за козметички производи, начела на ДПП, категории козметички производи, активни супстанции, ексципиенси и суровини под рестрикција, параметри за контрола на квалитет и студии за стабилност.',
    },
    credits: 4,
    keywords: {
      en: [
        'cosmetics regulation',
        'cosmetics GMP',
        'product information file',
        'restricted substances',
        'stability',
        'safety',
      ],
      mk: [
        'козметичка регулатива',
        'ДПП за козметика',
        'досие на производ',
        'суровини под рестрикција',
        'стабилност',
        'безбедност',
      ],
    },
    professors: [
      'Проф. д-р Марија Главаш Додов',
      'Проф. д-р Катерина Горачинова',
      'Проф. д-р Рената Славеска Раички',
      'Проф. д-р Маја Симоноска Црцаревска',
      'Проф. д-р Никола Гешковски',
    ],
    semester: 5,
    title: {
      en: 'Quality Control of Cosmetic Products',
      mk: 'Контрола на квалитет на козметички производи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB45',
      mk: 'ФФЛБ45',
    },
    description: {
      en: 'Properties, composition and production of essential oils, factors affecting quality, general tests and determination of physicochemical constants, identification methods and gas chromatographic determination of chemical composition.',
      mk: 'Својства, состав и начини на добивање на етерични масла, фактори што влијаат на квалитетот, општи испитувања и определување на физичко-хемиски константи, методи за идентификација и гаснохроматографско определување на хемискиот состав.',
    },
    credits: 4,
    keywords: {
      en: [
        'essential oils',
        'monoterpenes',
        'sesquiterpenes',
        'gas chromatography',
        'physicochemical constants',
        'quality assessment',
      ],
      mk: [
        'етерични масла',
        'монотерпени',
        'сесквитерпени',
        'гасна хроматографија',
        'физичко-хемиски константи',
        'проценка на квалитет',
      ],
    },
    professors: [
      'Проф. д-р Марија Карапанцова',
      'Проф. д-р Ѓоше Стефков',
      'Доц. д-р Ивана Цветковиќ Каранфилова',
    ],
    semester: 5,
    title: {
      en: 'Testing of Essential Oils and Aromatic Raw Materials',
      mk: 'Испитување на етерични масла и ароматични суровини',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB46',
      mk: 'ФФЛБ46',
    },
    description: {
      en: 'Principles for optimal planning, development and improvement of technological operations and processes in industrial pharmaceutical and biopharmaceutical manufacturing, using design of experiments and multivariate analysis.',
      mk: 'Начела за оптимално планирање, развој и подобрување на технолошки операции и процеси во индустриското фармацевтско и биофармацевтско производство, со примена на дизајн на експерименти и мултиваријантна анализа.',
    },
    credits: 4,
    keywords: {
      en: [
        'design of experiments',
        'QbD',
        'multivariate analysis',
        'design space',
        'optimization',
        'industrial manufacturing',
      ],
      mk: [
        'дизајн на експерименти',
        'QbD',
        'мултиваријантна анализа',
        'design space',
        'оптимизација',
        'индустриско производство',
      ],
    },
    professors: [
      'Проф. д-р Рената Славеска Раички',
      'Проф. д-р Марија Главаш Додов',
      'Проф. д-р Маја Симоновска Црцаревска',
      'Доц. д-р Душко Шалабалија',
    ],
    semester: 5,
    title: {
      en: 'Design and Optimization of Technological Processes',
      mk: 'Дизајн и оптимизација на технолошки процеси',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB47',
      mk: 'ФФЛБ47',
    },
    description: {
      en: 'Principles of disinfection and sterilization (physical and chemical methods, heat and cold sterilization), aseptic work, factors affecting effectiveness, monitoring and validation parameters, and protocols for safe handling of sterile materials.',
      mk: 'Принципи на дезинфекција и стерилизација (физички и хемиски методи, топла и ладна стерилизација), асептична работа, фактори што влијаат на успешноста, параметри за мониторинг и валидација, како и протоколи за безбедна работа со стерилни материјали.',
    },
    credits: 4,
    keywords: {
      en: [
        'disinfection',
        'sterilization',
        'aseptic work',
        'validation',
        'process monitoring',
        'risk management',
      ],
      mk: [
        'дезинфекција',
        'стерилизација',
        'асептична работа',
        'валидација',
        'мониторинг на процесот',
        'управување со ризици',
      ],
    },
    professors: [
      'Проф. д-р Маја Симоновска Црцаревска',
      'Проф. д-р Катерина Горачинова',
      'Проф. д-р Рената Славеска Раички',
      'Проф. д-р Марија Главаш Додов',
      'Проф. д-р Никола Гешковски',
      'Доц. д-р Љубица Михаилова',
      'Доц. д-р Душко Шалабалија',
      'Асс. м-р Теодора Тасевска',
    ],
    semester: 5,
    title: {
      en: 'Sterile Techniques and Their Application',
      mk: 'Стерилни техники и нивна примена',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB48',
      mk: 'ФФЛБ48',
    },
    description: {
      en: 'Basic principles of food toxicology: toxicokinetics and toxicodynamics of contaminants, natural and synthetic chemicals, bacterial toxins, pesticide residues, additives, food allergies, testing of chemicals in food, HACCP and risk assessment.',
      mk: 'Основни принципи на токсикологијата на храната: токсикокинетика и токсикодинамика на контаминенти, природни и синтетски хемикалии, бактериски токсини, резидуи на пестициди, адитиви, алергии на храна, испитување на хемикалии во храна, HACCP и проценка на ризик.',
    },
    credits: 4,
    keywords: {
      en: [
        'contaminants',
        'additives',
        'bacterial toxins',
        'pesticides',
        'HACCP',
        'risk assessment',
        'food safety',
      ],
      mk: [
        'контаминенти',
        'адитиви',
        'бактериски токсини',
        'пестициди',
        'HACCP',
        'проценка на ризик',
        'безбедност на храна',
      ],
    },
    professors: [
      'Проф. д-р Татјана Кадифкова Пановска',
      'Проф. д-р Тања Петреска Ивановска',
    ],
    semester: 5,
    title: {
      en: 'Food Toxicology',
      mk: 'Токсикологија на прехранбените производи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB49',
      mk: 'ФФЛБ49',
    },
    description: {
      en: 'Ecotoxicology from ecological and biochemical perspectives: major contaminant groups and their movement in the ecosystem, biotransformation, bioaccumulation and biomagnification, mechanisms of toxicity and dose-response, environmental chemical analysis, biomarkers, monitoring and risk assessment.',
      mk: 'Екотоксикологија од еколошки и биохемиски аспект: главни групи контаминенти и нивно движење во екосистемот, биотрансформација, биоакумулација и биомагнификација, механизми на токсичност и доза-одговор, аналитика на хемикалии во животна средина, биомаркери, мониторинг и проценка на ризик.',
    },
    credits: 4,
    keywords: {
      en: [
        'contaminants',
        'bioaccumulation',
        'biomagnification',
        'biomarkers',
        'dose-response',
        'risk assessment',
        'monitoring',
      ],
      mk: [
        'контаминенти',
        'биоакумулација',
        'биомагнификација',
        'биомаркери',
        'доза-одговор',
        'проценка на ризик',
        'мониторинг',
      ],
    },
    professors: ['Проф. д-р Тања Петреска Ивановска', 'Доц. д-р Зоран Живиќ'],
    semester: 6,
    title: {
      en: 'Ecotoxicology',
      mk: 'Екотоксикологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB50',
      mk: 'ФФЛБ50',
    },
    description: {
      en: 'General and systemic toxicology of the working environment: mechanisms of action, acute and chronic effects, biomarkers, carcinogenicity, mutagenicity, neurotoxicity, toxicology of metals, pesticides and organic solvents, exposure assessment methods and biological monitoring.',
      mk: 'Општа и систематска токсикологија на работната средина: механизми на дејство, акутно и хронично дејство, биомаркери, карциногеност, мутагеност, невротоксичност, токсикологија на метали, пестициди и органски растворувачи, методи за проценка на експозиција и биолошки мониторинг.',
    },
    credits: 4,
    keywords: {
      en: [
        'workplace environment',
        'chemical exposure',
        'metals',
        'solvents',
        'pesticides',
        'biological monitoring',
        'maximum allowable concentration',
      ],
      mk: [
        'работна средина',
        'хемиска експозиција',
        'метали',
        'растворувачи',
        'пестициди',
        'биолошки мониторинг',
        'максимално дозволена концентрација',
      ],
    },
    professors: ['Проф. д-р Татјана Кадифкова Пановска'],
    semester: 6,
    title: {
      en: 'Occupational Toxicology',
      mk: 'Професионална токсикологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB51',
      mk: 'ФФЛБ51',
    },
    description: {
      en: 'Organization of an analytical toxicology laboratory, sample collection, transport and preparation, methods for detection and identification of toxic chemicals in biological material, quantitative methods for specific chemical groups (solvents, metals, pesticides, drugs, drugs of abuse) and interpretation of results.',
      mk: 'Организација на аналитичко-токсиколошка лабораторија, собирање, транспорт и подготовка на примероци, методи за детекција и идентификација на токсични хемикалии во биолошки материјал, квантитативни методи за специфични групи хемикалии (растворувачи, метали, пестициди, лекови, дроги) и толкување на резултатите.',
    },
    credits: 4,
    keywords: {
      en: [
        'toxicology laboratory',
        'sample preparation',
        'screening',
        'drugs of abuse',
        'psychotropic substances',
        'result interpretation',
      ],
      mk: [
        'токсиколошка лабораторија',
        'подготовка на примероци',
        'скрининг',
        'наркотични дроги',
        'психотропни хемикалии',
        'толкување на резултати',
      ],
    },
    professors: ['Проф. д-р Зоран Кавраковски'],
    semester: 6,
    title: {
      en: 'Analytical Toxicology',
      mk: 'Аналитичка токсикологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB52',
      mk: 'ФФЛБ52',
    },
    description: {
      en: 'Techniques for particle size and size distribution determination: sieve analysis, microscopic analysis and laser diffraction (wet and dry cell), critical factors in sample preparation, artefacts and method development and validation.',
      mk: 'Техники за определување на големина и дистрибуција по големина на честички: ситена анализа, микроскопска анализа и ласерска дифрактометрија (влажна и сува келија), критични фактори во подготовката на примероци, артефакти и развој и валидација на метода.',
    },
    credits: 4,
    keywords: {
      en: [
        'particle size',
        'size distribution',
        'sieve analysis',
        'microscopy',
        'laser diffraction',
        'method validation',
      ],
      mk: [
        'големина на честички',
        'дистрибуција по големина',
        'ситена анализа',
        'микроскопија',
        'ласерска дифрактометрија',
        'валидација на метод',
      ],
    },
    professors: [
      'Проф. д-р Никола Гешковски',
      'Проф. д-р Катерина Горачинова',
      'Проф. д-р Марија Главаш Додов',
      'Проф. д-р Маја Симоноска Црцаревска',
    ],
    semester: 6,
    title: {
      en: 'Particle Size Determination Techniques',
      mk: 'Техники за определување на големина на честички',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB53',
      mk: 'ФФЛБ53',
    },
    description: {
      en: 'Fundamentals of radiopharmacy: radioactive decay, types of radiopharmaceuticals, radioisotope production (cyclotron, generator), radiolabelling methods, quality control (physicochemical, radiochemical, sterility), GMP and regulatory requirements.',
      mk: 'Основи на радиофармацијата: радиоактивно распаѓање, видови радиофармацевтски препарати, производство на радиоизотопи (циклотрон, генератор), методи на радиомаркирање, контрола на квалитет (физичко-хемиски, радиохемиски, стерилност), ДПП и регулаторни барања.',
    },
    credits: 4,
    keywords: {
      en: [
        'radioactive decay',
        'radioisotopes',
        'radiolabelling',
        'quality control',
        'GMP',
        'radiation protection',
      ],
      mk: [
        'радиоактивно распаѓање',
        'радиоизотопи',
        'радиомаркирање',
        'контрола на квалитет',
        'ДПП',
        'радиолошка заштита',
      ],
    },
    professors: [
      'Проф. д-р Никола Гешковски',
      'Проф. д-р Катерина Горачинова',
      'Проф. д-р Рената Славеска Раички',
      'Проф. д-р Марија Главаш Додов',
      'Проф. д-р Маја Симоноска Црцаревска',
    ],
    semester: 6,
    title: {
      en: 'Preparation and Analysis of Radiopharmaceuticals',
      mk: 'Подготовка и анализа на радиофармацевтици',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB54',
      mk: 'ФФЛБ54',
    },
    description: {
      en: 'Modern biotechnological products with diagnostic and therapeutic value: recombinant therapeutic proteins and peptides, stem-cell regenerative medicine, gene therapy, immuno- and virotherapy, phage therapy, synthetic cells and organisms, modern diagnostic strategies and 3D printing in medicine.',
      mk: 'Современи биотехнолошки производи со дијагностичка и терапевтска вредност: рекомбинирани терапевтски протеини и пептиди, регенеративна медицина со матични клетки, генска терапија, имуно- и виротерапија, фаготерапија, синтетички клетки и организми, современи дијагностички стратегии и 3Д печатење во медицината.',
    },
    credits: 4,
    keywords: {
      en: [
        'recombinant proteins',
        'regenerative medicine',
        'gene therapy',
        'immunotherapy',
        'phage therapy',
        'synthetic cells',
        '3D printing',
      ],
      mk: [
        'рекомбинантни протеини',
        'регенеративна медицина',
        'генска терапија',
        'имунотерапија',
        'фаготерапија',
        'синтетички клетки',
        '3Д печатење',
      ],
    },
    professors: [
      'Проф. д-р Рената Славеска Раички',
      'Доц. д-р Душко Шалабалија',
    ],
    semester: 6,
    title: {
      en: 'Fundamentals of Medical Biotechnology',
      mk: 'Основи на медицинска биотехнологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB55',
      mk: 'ФФЛБ55',
    },
    description: {
      en: 'Molecular principles and technologies applied in biotechnology: model systems and experimental organisms, cell-free systems, applied molecular biotechnology in diagnostics, knock-out/knock-in models, protein engineering principles, vaccines, synthetic biology and ethical challenges.',
      mk: 'Молекуларни принципи и технологии применети во биотехнологијата: модел системи и експериментални организми, безклеточни системи, применета молекуларна биотехнологија во дијагностика, knock-out/knock-in модели, принципи на протеинско инженерство, вакцини, синтетичка биологија и етички предизвици.',
    },
    credits: 4,
    keywords: {
      en: [
        'model organisms',
        'cell-free systems',
        'knock-out/knock-in',
        'protein engineering',
        'vaccines',
        'synthetic biology',
        'ethics',
      ],
      mk: [
        'модел организми',
        'безклеточни системи',
        'knock-out/knock-in',
        'протеинско инженерство',
        'вакцини',
        'синтетичка биологија',
        'етика',
      ],
    },
    professors: [
      'Проф. д-р Рената Славеска Раички',
      'Доц. д-р Душко Шалабалија',
    ],
    semester: 6,
    title: {
      en: 'Molecular Biotechnology',
      mk: 'Молекуларна биотехнологија',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB56',
      mk: 'ФФЛБ56',
    },
    description: {
      en: 'Methods and procedures for extraction of natural active components, identification and confirmation of presence, fractionation and separation of compound classes, green extraction procedures, final isolation and purification, evaluation and standardization/quantification of isolated components.',
      mk: 'Методи и процедури за екстракција на природни активни компоненти, идентификација и докажување на присуство, фракционирање и сепарација на класи соединенија, зелени екстрактивни постапки, финална изолација и прочистување, вреднување и стандардизација/квантификација на изолираните компоненти.',
    },
    credits: 4,
    keywords: {
      en: [
        'extraction',
        'fractionation',
        'separation',
        'purification',
        'green extraction',
        'standardization',
      ],
      mk: [
        'екстракција',
        'фракционирање',
        'сепарација',
        'прочистување',
        'зелени екстрактивни постапки',
        'стандардизација',
      ],
    },
    professors: [
      'Доц. д-р Ивана Цветковиќ Каранфилова',
      'Проф. д-р Светлана Кулеванова',
      'Проф. д-р Ѓоше Стефков',
      'Проф. д-р Марија Карапанцова',
    ],
    semester: 5,
    title: {
      en: 'Extraction and Isolation of Natural Compounds',
      mk: 'Екстракција и изолација на природни состојки',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB57',
      mk: 'ФФЛБ57',
    },
    description: {
      en: 'Methods for identification and qualitative analysis of primary and secondary metabolites (macroscopic and microscopic identification, thin-layer chromatography), general tests for quality assessment (loss on drying, water, total ash, extractives) and quantification methods (HPLC, GC, spectrophotometry).',
      mk: 'Методи за идентификација и квалитативна анализа на примарни и секундарни метаболити (макроскопска и микроскопска идентификација, тенкослојна хроматографија), општи испитувања и тестови за проценка на квалитет (губиток при сушење, вода, вкупен пепел, екстрактивни материи) и методи на квантификација (HPLC, GC, спектрофотометрија).',
    },
    credits: 4,
    keywords: {
      en: [
        'macroscopic identification',
        'microscopic identification',
        'TLC',
        'HPLC',
        'gas chromatography',
        'spectrophotometry',
        'quality tests',
      ],
      mk: [
        'макроскопска идентификација',
        'микроскопска идентификација',
        'TLC',
        'HPLC',
        'гасна хроматографија',
        'спектрофотометрија',
        'тестови за квалитет',
      ],
    },
    professors: [
      'Проф. д-р Марија Карапанцова',
      'Проф. д-р Ѓоше Стефков',
      'Доц. д-р Ивана Цветковиќ Каранфилова',
    ],
    semester: 5,
    title: {
      en: 'Identification and Quantification of Natural Products',
      mk: 'Идентификација и квантификација на природни производи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB58',
      mk: 'ФФЛБ58',
    },
    description: {
      en: 'Overview of herbal product types and their dosage forms, collections of quality standards and regulations (Ph. Eur., EMA, WHO, ESCOP, Commission E, AHP, BHP), European, global and national legislation and regulatory requirements for marketing herbal and traditional herbal medicines.',
      mk: 'Преглед на видови хербални производи и нивни дозирани форми, збирки на стандарди и прописи за квалитет (Ph. Eur., EMA, WHO, ESCOP, Commission E, AHP, BHP), европска, светска и национална легислатива и регулаторни барања за ставање во промет на хербални и традиционални хербални лекови.',
    },
    credits: 4,
    keywords: {
      en: [
        'herbal products',
        'traditional herbal medicines',
        'EMA',
        'WHO monographs',
        'ESCOP',
        'marketing authorization',
        'harmonization',
      ],
      mk: [
        'хербални производи',
        'традиционални хербални лекови',
        'EMA',
        'WHO монографии',
        'ESCOP',
        'ставање во промет',
        'хармонизација',
      ],
    },
    professors: [
      'Проф. д-р Ѓоше Стефков',
      'Проф. д-р Марија Карапанцова',
      'Доц. д-р Ивана Цветковиќ Каранфилова',
    ],
    semester: 5,
    title: {
      en: 'Regulation of Herbal Products',
      mk: 'Регулатива за хербални производи',
    },
    year: 3,
  },
]

export const regularSubjects: Array<SeedSubject> = [
  {
    code: {
      en: 'FFLB01',
      mk: 'ФФЛБ01',
    },
    description: {
      en: 'Fundamental chemical laws, atomic structure, periodic properties of elements, chemical bonding, kinetics and equilibria in aqueous solutions, and properties of elements and inorganic compounds relevant to biological processes.',
      mk: 'Основни законитости во хемијата, структура на атомите, периодични својства на елементите, хемиски врски, кинетика и хемиски рамнотежи во воден раствор, како и својства на елементите и неорганските соединенија значајни за биолошките процеси.',
    },
    credits: 7,
    keywords: {
      en: [
        'atomic structure',
        'periodic system',
        'chemical bonding',
        'stoichiometry',
        'chemical equilibrium',
        'pH',
        'buffers',
        'redox',
      ],
      mk: [
        'атомска структура',
        'периоден систем',
        'хемиски врски',
        'стехиометрија',
        'хемиска рамнотежа',
        'pH',
        'пуфери',
        'редокс',
      ],
    },
    professors: [
      'Проф. д-р Руменка Петковска',
      'Проф. д-р Ленче Велкоска Марковска',
      'Проф. д-р Лилјана Анастасова',
    ],
    semester: 1,
    title: {
      en: 'General and Inorganic Chemistry',
      mk: 'Општа и неорганска хемија',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB02',
      mk: 'ФФЛБ02',
    },
    description: {
      en: 'Physical principles applied in medicine: biomechanics, fluid mechanics and respiration, bioacoustics, optics and optical instruments, quantum and X-ray optics, nuclear physics, thermodynamics, electrical phenomena, biopotentials and electromagnetism.',
      mk: 'Физички законитости применети во медицината: биомеханика, механика на флуиди и дишење, биоакустика, оптика и оптички инструменти, квантна и рендгенска оптика, нуклеарна физика, термодинамика, електрични појави, биопотенцијали и електромагнетизам.',
    },
    credits: 5,
    keywords: {
      en: [
        'biomechanics',
        'fluids',
        'bioacoustics',
        'optics',
        'lasers',
        'X-ray radiation',
        'nuclear medicine',
        'electromagnetism',
      ],
      mk: [
        'биомеханика',
        'флуиди',
        'биоакустика',
        'оптика',
        'ласери',
        'рендгенско зрачење',
        'нуклеарна медицина',
        'електромагнетизам',
      ],
    },
    professors: ['Доц. д-р Душко Лукарски', 'Проф. д-р Томислав Станковски'],
    semester: 1,
    title: {
      en: 'Biophysics',
      mk: 'Биофизика',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB03',
      mk: 'ФФЛБ03',
    },
    description: {
      en: 'Introduction to basic laboratory skills: handling glassware and equipment, preparing and storing reagents, core operations (weighing, filtration, centrifugation, buffers) and internationally accepted laboratory safety and protection standards.',
      mk: 'Воведување во основните лабораториски вештини: ракување со садови и опрема, подготовка и чување реагенси, основни операции (одмерување, филтрација, центрифугирање, пуфери) и меѓународно прифатени стандарди за безбедност и заштита во лабораторија.',
    },
    credits: 5,
    keywords: {
      en: [
        'laboratory equipment',
        'reagents',
        'weighing',
        'filtration',
        'centrifugation',
        'buffer solutions',
        'safety',
        'laboratory notebook',
      ],
      mk: [
        'лабораториска опрема',
        'реагенси',
        'одмерување',
        'филтрација',
        'центрифугирање',
        'пуферски раствори',
        'безбедност',
        'лабораториски дневник',
      ],
    },
    professors: [
      'Проф. д-р Наталија Наков',
      'Проф. д-р Билјана Бауер',
      'Проф. д-р Руменка Петковска',
      'Проф. д-р Јасмина Тониќ Рибарска',
      'Асс. м-р Благој Ачевски',
    ],
    semester: 1,
    title: {
      en: 'Fundamentals and Safety in Laboratory Work',
      mk: 'Основи и безбедност во лабораториско работење',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB04',
      mk: 'ФФЛБ04',
    },
    description: {
      en: 'Organization of living systems, prokaryotic and eukaryotic cells, structure and function of cell membranes, wall and organelles, plus basics of histology and embryology of animal and plant tissues.',
      mk: 'Организација на живите системи, прокариотски и еукариотски клетки, структура и функција на клеточните мембрани, ѕид и органели, како и основи на хистологија и ембриологија на животински и растителни ткива.',
    },
    credits: 5,
    keywords: {
      en: [
        'cytology',
        'prokaryotes',
        'eukaryotes',
        'cell membranes',
        'organelles',
        'histology',
        'embryology',
      ],
      mk: [
        'цитологија',
        'прокариоти',
        'еукариоти',
        'клеточни мембрани',
        'органели',
        'хистологија',
        'ембриологија',
      ],
    },
    professors: [
      'Проф. д-р Билјана Бауер',
      'Проф. д-р Александар Димовски',
      'Доц. д-р Ивана Цветковиќ Каранфилова',
    ],
    semester: 1,
    title: {
      en: 'General and Cell Biology',
      mk: 'Општа и клеточна биологија',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB05',
      mk: 'ФФЛБ05',
    },
    description: {
      en: 'Real mathematical analysis (sets, sequences, functions, derivatives, integrals) and laboratory calculations: proportions, concentrations, dilution, SI units, molar and percent solutions, isotonic solutions, pH and buffer calculations.',
      mk: 'Реална математичка анализа (множества, низи, функции, изводи, интеграли) и лабораториски пресметки: пропорции, концентрации, разредување, SI единици, моларни и процентни раствори, изотонични раствори, pH и пуферски пресметки.',
    },
    credits: 4,
    keywords: {
      en: [
        'sets',
        'functions',
        'derivative',
        'integral',
        'sequences',
        'concentration',
        'dilution',
        'SI units',
        'molarity',
        'pH calculations',
      ],
      mk: [
        'множества',
        'функции',
        'извод',
        'интеграл',
        'низи',
        'концентрација',
        'разредување',
        'SI единици',
        'моларност',
        'pH пресметки',
      ],
    },
    professors: [
      'Проф. д-р Слаѓана Брсакоска',
      'Проф. д-р Никола Гешковски',
      'Проф. д-р Маја Симоноска Црцаревска',
      'Проф. д-р Лилјана Анастасова',
    ],
    semester: 1,
    title: {
      en: 'Mathematics and Laboratory Calculations',
      mk: 'Математика и лабораториски пресметки',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB06',
      mk: 'ФФЛБ06',
    },
    description: {
      en: 'Introduction to the curriculum and biomedical laboratory organization, personal safety measures, first aid in accidents, data recording and ethics in laboratory work.',
      mk: 'Вовед во наставниот план и организација на биомедицинска лабораторија, мерки за лична безбедност, прва помош при хаварии, евидентирање на податоци и етика во лабораториската дејност.',
    },
    credits: 2,
    keywords: {
      en: [
        'biomedical laboratory',
        'personal safety',
        'first aid',
        'laboratory notebook',
        'ethics',
      ],
      mk: [
        'биомедицинска лабораторија',
        'лична безбедност',
        'прва помош',
        'лабораториски дневник',
        'етика',
      ],
    },
    professors: ['Доц. д-р Ивана Цветковиќ Каранфилова'],
    semester: 1,
    title: {
      en: 'Introduction to Laboratory Biomedical Engineering',
      mk: 'Вовед во лабораториско биомедицинско инженерство',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB07',
      mk: 'ФФЛБ07',
    },
    description: {
      en: 'Acquiring and refining motor skills, improving motor, morphological and functional abilities with the aim of promoting health and quality of life.',
      mk: 'Усвојување и усовршување на моторни знаења и вештини, подобрување на моторните, морфолошките и функционалните способности, со цел унапредување на здравјето и квалитетот на животот.',
    },
    credits: 2,
    keywords: {
      en: [
        'physical activity',
        'motor abilities',
        'training process',
        'fitness',
        'health',
      ],
      mk: [
        'физичка активност',
        'моторни способности',
        'тренажен процес',
        'фитнес',
        'здравје',
      ],
    },
    professors: ['Доц. д-р Јана Каршаковска Димитриоска'],
    semester: 1,
    title: {
      en: 'Sport and Health',
      mk: 'Спорт и здравје',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB08',
      mk: 'ФФЛБ08',
    },
    description: {
      en: 'Fundamentals of qualitative and quantitative chemical analysis: chemical equilibrium, reaction types, ion qualitative analysis, titrimetric and gravimetric methods, separation principles and application in various matrices.',
      mk: 'Основи на квалитативната и квантитативната хемиска анализа: хемиска рамнотежа, видови реакции, квалитативна анализа на јони, титриметриски и гравиметриски методи, принципи на разделување и примена во различни матрикси.',
    },
    credits: 7,
    keywords: {
      en: [
        'qualitative analysis',
        'quantitative analysis',
        'titration',
        'gravimetry',
        'chemical equilibrium',
        'complexes',
        'redox',
        'separation',
      ],
      mk: [
        'квалитативна анализа',
        'квантитативна анализа',
        'титрација',
        'гравиметрија',
        'хемиска рамнотежа',
        'комплекси',
        'редокс',
        'разделување',
      ],
    },
    professors: [
      'Проф. д-р Сузана Трајковиќ-Јолевска',
      'Проф. д-р Јасмина Тониќ-Рибарска',
      'Асс. м-р Благој Ачевски',
    ],
    semester: 2,
    title: {
      en: 'Analytical Chemistry',
      mk: 'Аналитичка хемија',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB09',
      mk: 'ФФЛБ09',
    },
    description: {
      en: 'Main classes of organic compounds, their structure, reactivity and mechanisms: alkanes, alkenes, alkynes, dienes, stereochemistry, alkyl halides, aromaticity, alcohols, phenols, ethers and epoxides, with laboratory synthesis and identification techniques.',
      mk: 'Основни класи органски соединенија, нивна структура, реактивност и механизми: алкани, алкени, алкини, диени, стереохемија, алкил халогениди, ароматичност, алкохоли, феноли, етери и епоксиди, со лабораториски техники за синтеза и идентификација.',
    },
    credits: 7,
    keywords: {
      en: [
        'alkanes',
        'alkenes',
        'alkynes',
        'stereochemistry',
        'aromaticity',
        'nucleophilic substitution',
        'alcohols',
        'ethers',
        'synthesis',
      ],
      mk: [
        'алкани',
        'алкени',
        'алкини',
        'стереохемија',
        'ароматичност',
        'нуклеофилна супституција',
        'алкохоли',
        'етерa',
        'синтеза',
      ],
    },
    professors: [
      'Проф. д-р Ана П. Пановска',
      'Проф. д-р Мирјана С. Јанкуловска',
      'Проф. д-р Јелена Ацевска',
      'Проф. Катерина Брезовска',
    ],
    semester: 2,
    title: {
      en: 'Fundamentals of Organic Chemistry',
      mk: 'Основи на органска хемија',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB10',
      mk: 'ФФЛБ10',
    },
    description: {
      en: 'Basic principles of physical chemistry: Gibbs phase rule, states of matter, laws of thermodynamics, thermochemistry, non-electrolyte solutions and colligative properties, solubility and distribution.',
      mk: 'Основни принципи на физичката хемија: Гибсово правило на фази, состојби на материјата, I–III принцип на термодинамика, термохемија, раствори на неелектролити и колигативни својства, растворливост и распределба.',
    },
    credits: 6,
    keywords: {
      en: [
        'thermodynamics',
        'thermochemistry',
        'states of matter',
        'solutions',
        'colligative properties',
        'phase equilibrium',
        'kinetics',
      ],
      mk: [
        'термодинамика',
        'термохемија',
        'состојби на материјата',
        'раствори',
        'колигативни својства',
        'фазна рамнотежа',
        'кинетика',
      ],
    },
    professors: [
      'Проф. д-р Руменка Петковска',
      'Проф. д-р Зоран Кавраковски',
      'Проф. д-р Наталија Наков',
      'Асс. м-р Благој Ачевски',
    ],
    semester: 2,
    title: {
      en: 'Fundamentals of Physical Chemistry',
      mk: 'Основи на физичка хемија',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB11',
      mk: 'ФФЛБ11',
    },
    description: {
      en: 'Molecular structure of cells and molecular basis of cellular processes: macromolecules, membranes and transport, organelles and vesicular transport, genome and chromosomes, replication, cell cycle and gene expression.',
      mk: 'Молекуларна градба на клетките и молекуларни основи на клеточните процеси: макромолекули, мембрани и транспорт, органели и везикуларен транспорт, геном и хромозоми, репликација, клеточен циклус и експресија на гени.',
    },
    credits: 5,
    keywords: {
      en: [
        'macromolecules',
        'cell membrane',
        'cytoskeleton',
        'genome',
        'replication',
        'transcription',
        'translation',
        'cell cycle',
      ],
      mk: [
        'макромолекули',
        'клеточна мембрана',
        'цитоскелет',
        'геном',
        'репликација',
        'транскрипција',
        'транслација',
        'клеточен циклус',
      ],
    },
    professors: [
      'Проф. д-р Надица Матевска-Гешковска',
      'Доц. д-р Марија Станинова Стојовска',
    ],
    semester: 2,
    title: {
      en: 'Molecular Biology and Genetics',
      mk: 'Молекуларна биологија и генетика',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB12',
      mk: 'ФФЛБ12',
    },
    description: {
      en: 'Probability and combinatorics, random variables and distributions, descriptive statistics, estimators and confidence intervals, hypothesis testing, non-parametric tests and regression analysis applied in Excel.',
      mk: 'Веројатност и комбинаторика, случајни променливи и распределби, дескриптивна статистика, оценки и интервали на доверба, тестирање на статистички хипотези, непараметарски критериуми и регресиона анализа со примена во Excel.',
    },
    credits: 3,
    keywords: {
      en: [
        'probability',
        'distributions',
        'descriptive statistics',
        'confidence intervals',
        'hypothesis testing',
        'regression',
        'Excel',
      ],
      mk: [
        'веројатност',
        'распределби',
        'дескриптивна статистика',
        'интервали на доверба',
        'хипотези',
        'регресија',
        'Excel',
      ],
    },
    professors: ['Проф. д-р Слаѓана Брсакоска'],
    semester: 2,
    title: {
      en: 'Biostatistics and Bioinformatics',
      mk: 'Биостатистика и биоинформатика',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB13',
      mk: 'ФФЛБ13',
    },
    description: {
      en: 'Techniques and strategies for efficient searching of scientific-chemistry information, quality criteria, use of databases (Medline/PubMed, CAS/SciFinder, Web of Science), reference management and citation.',
      mk: 'Техники и стратегии за ефикасно пребарување на научно-хемиски информации, критериуми за квалитет, користење на бази (Medline/PubMed, CAS/SciFinder, Web of Science), менаџирање на референци и цитирање.',
    },
    credits: 2,
    keywords: {
      en: [
        'search',
        'information evaluation',
        'PubMed',
        'SciFinder',
        'Web of Science',
        'citation',
        'reference management',
      ],
      mk: [
        'пребарување',
        'евалуација на информации',
        'PubMed',
        'SciFinder',
        'Web of Science',
        'цитирање',
        'менаџирање референци',
      ],
    },
    professors: [
      'Проф. д-р Александра Капедановска Несторовска',
      'Проф. д-р Зоран Стерјев',
    ],
    semester: 2,
    title: {
      en: 'Searching and Using Information Sources',
      mk: 'Пребарување и користење на извори на информации',
    },
    year: 1,
  },
  {
    code: {
      en: 'FFLB14',
      mk: 'ФФЛБ14',
    },
    description: {
      en: 'Fundamentals and principles of spectroscopic and optical methods: atomic spectroscopy (AAS, AES, ICP, AFS), molecular spectroscopy (UV/Vis, MFS, IR, MS), refractometry and polarimetry, with qualitative and quantitative analysis and statistical treatment.',
      mk: 'Основи и принципи на спектроскопски и оптички методи: атомска спектроскопија (AAS, AES, ICP, AFS), молекуларна спектроскопија (UV/Vis, MFS, IR, MS), рефрактометрија и полариметрија, со квалитативна и квантитативна анализа и статистичка обработка.',
    },
    credits: 7,
    keywords: {
      en: [
        'spectroscopy',
        'AAS',
        'ICP',
        'UV/Vis',
        'IR',
        'mass spectrometry',
        'refractometry',
        'polarimetry',
      ],
      mk: [
        'спектроскопија',
        'AAS',
        'ICP',
        'UV/Vis',
        'IR',
        'масена спектрометрија',
        'рефрактометрија',
        'полариметрија',
      ],
    },
    professors: [
      'Проф. д-р Анета Димитровска',
      'Проф. д-р Зоран Кавраковски',
      'Проф. д-р Катерина Брезовска',
      'Проф. д-р Јелена Ацевска',
      'Проф. д-р Наталија Наков',
      'Асс. м-р Благој Ачевски',
    ],
    semester: 3,
    title: {
      en: 'Laboratory Techniques and Instrumental Methods - 1',
      mk: 'Лабораториски техники и инструментални методи - 1',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB15',
      mk: 'ФФЛБ15',
    },
    description: {
      en: 'Fundamentals of medicinal chemistry: stereochemical and physicochemical properties of drugs, drug design and discovery, molecular modelling, xenobiotic metabolic transformation and in vitro/in vivo methods for metabolism evaluation.',
      mk: 'Основи на медицинската хемија: стереохемиски и физичко-хемиски својства на лековите, дизајн и откривање лекови, молекуларно моделирање, метаболна трансформација на ксенобиотици и in vitro/in vivo техники за евалуација на метаболизмот.',
    },
    credits: 6,
    keywords: {
      en: [
        'drug design',
        'QSAR',
        'metabolism',
        'xenobiotics',
        'biopharmaceutics',
        'receptors',
        'in silico',
        'LC/MS',
      ],
      mk: [
        'дизајн на лекови',
        'QSAR',
        'метаболизaм',
        'ксенобиотици',
        'биофармација',
        'рецептори',
        'in silico',
        'LC/MS',
      ],
    },
    professors: [
      'Проф. д-р Зорица Наумовска',
      'Проф. д-р Александра Капедановска Несторовска',
      'Проф. д-р Ана Поцева Пановска',
    ],
    semester: 3,
    title: {
      en: 'Medicinal Chemistry',
      mk: 'Медицинска хемија',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB16',
      mk: 'ФФЛБ16',
    },
    description: {
      en: 'Structure and function of proteins and enzymes, metabolism of amino acids, lipids and carbohydrates, pentose phosphate and Krebs cycles, electron transport and oxidative phosphorylation, water, electrolyte and hormone metabolism.',
      mk: 'Структура и функција на протеините и ензимите, метаболизам на аминокиселини, липиди и јаглехидрати, пентозо-фосфатен циклус и Krebs-ов циклус, транспорт на електрони и оксидативна фосфорилација, метаболизам на вода, електролити и хормони.',
    },
    credits: 5,
    keywords: {
      en: [
        'proteins',
        'enzymes',
        'lipids',
        'carbohydrates',
        'glycolysis',
        'oxidative phosphorylation',
        'nucleic acids',
        'hormones',
      ],
      mk: [
        'протеини',
        'ензими',
        'липиди',
        'јаглехидрати',
        'гликолиза',
        'оксидативна фосфорилација',
        'нуклеински киселини',
        'хормони',
      ],
    },
    professors: [
      'Проф. д-р Марија Хиљадникова-Бајро',
      'Проф. д-р Татјана Кадифкова Пановска',
    ],
    semester: 3,
    title: {
      en: 'Fundamentals of Biochemistry',
      mk: 'Основи на биохемија',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB17',
      mk: 'ФФЛБ17',
    },
    description: {
      en: 'Fundamentals of human anatomy and physiology: blood, muscles, cardiovascular, respiratory, digestive and urinary systems, metabolism, skin and thermoregulation, nervous system, endocrinology and reproduction.',
      mk: 'Основи на анатомија и физиологија на човекот: крв, мускули, кардиоваскуларен, респираторен, дигестивен и уринарен систем, метаболизам, кожа и терморегулација, нервен систем, ендокринологија и репродукција.',
    },
    credits: 4,
    keywords: {
      en: [
        'anatomy',
        'cardiovascular system',
        'respiratory system',
        'digestive system',
        'kidneys',
        'nervous system',
        'endocrinology',
      ],
      mk: [
        'анатомија',
        'кардиоваскуларен систем',
        'респираторен систем',
        'дигестивен систем',
        'бубрези',
        'нервен систем',
        'ендокринологија',
      ],
    },
    professors: [
      'Проф. д-р Бети Дејанова',
      'Проф. д-р Весела Малеска Ивановска',
      'Проф. д-р Сунчица Петровска',
      'Проф. д-р Лидија Тодоровска',
      'Проф. д-р Људмила Ефремовска',
      'Проф. д-р Сања Манчевска',
      'Проф. д-р Јасмина Плунцевиќ Глигороска',
    ],
    semester: 3,
    title: {
      en: 'Introduction to Physiology',
      mk: 'Вовед во физиологија',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB18',
      mk: 'ФФЛБ18',
    },
    description: {
      en: 'National and international regulations, standards and guidelines for laboratory work, laboratory validation and qualification, technical competence, quality system assurance and accreditation.',
      mk: 'Национални и меѓународни регулативи, стандарди и водичи за лабораториско работење, валидација и квалификација на лабораторија, техничка компетентност, обезбедување на систем за квалитет и акредитација.',
    },
    credits: 4,
    keywords: {
      en: [
        'quality system',
        'accreditation',
        'validation',
        'ISO standards',
        'good laboratory practice',
        'measurement traceability',
      ],
      mk: [
        'систем за квалитет',
        'акредитација',
        'валидација',
        'ISO стандарди',
        'добра лабораториска практика',
        'следивост на мерења',
      ],
    },
    professors: [
      'Проф. д-р Анета Димитровска',
      'Проф. д-р Сузана Трајковиќ Јолевска',
      'Проф. д-р Катерина Брезовска',
      'Проф. д-р Јелена Ацевска',
      'Проф. д-р Катерина Анчевска Нетковска',
    ],
    semester: 3,
    title: {
      en: 'Legislation and Laboratory Management',
      mk: 'Легислатива и лабораториски менаџмент',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB19',
      mk: 'ФФЛБ19',
    },
    description: {
      en: 'Fundamentals of separation techniques and chromatography (TLC, HPTLC, HPLC, GC), electrochemistry and electroanalytical techniques (potentiometry, voltammetry, polarography, coulometry, conductometry), with qualitative and quantitative analysis.',
      mk: 'Основи на сепаративни техники и хроматографија (TLC, HPTLC, HPLC, GC), електрохемија и електроаналитички техники (потенциометрија, волтаметрија, поларографија, кулометрија, кондуктометрија), со квалитативна и квантитативна анализа.',
    },
    credits: 7,
    keywords: {
      en: [
        'chromatography',
        'TLC',
        'HPLC',
        'GC',
        'electrochemistry',
        'potentiometry',
        'voltammetry',
        'coulometry',
      ],
      mk: [
        'хроматографија',
        'TLC',
        'HPLC',
        'GC',
        'електрохемија',
        'потенциометрија',
        'волтаметрија',
        'кулометрија',
      ],
    },
    professors: [
      'Проф. д-р Зоран Кавраковски',
      'Проф. д-р Анета Димитровска',
      'Проф. д-р Катерина Брезовска',
      'Проф. д-р Јелена Ацевска',
      'Проф. д-р Наталија Наков',
      'Асс. м-р Хрисанта Гоцо',
    ],
    semester: 4,
    title: {
      en: 'Laboratory Techniques and Instrumental Methods - 2',
      mk: 'Лабораториски техники и инструментални методи - 2',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB20',
      mk: 'ФФЛБ20',
    },
    description: {
      en: 'Morphology and physiology of bacteria, viruses and fungi, growth and inhibition, sterilization and disinfection, pathogenesis and virulence, plus fundamentals of the immune system (innate and acquired immunity) and basic immunodiagnostic methods.',
      mk: 'Морфологија и физиологија на бактерии, вируси и габи, раст и инхибиција, стерилизација и дезинфекција, патогенеза и вирулентност, како и основи на имунолошкиот систем (вроден и стекнат имунитет) и основни имунодијагностички методи.',
    },
    credits: 6,
    keywords: {
      en: [
        'bacteria',
        'viruses',
        'fungi',
        'sterilization',
        'antibiotics',
        'immunity',
        'immunodiagnostics',
        'pathogenesis',
      ],
      mk: [
        'бактерии',
        'вируси',
        'габи',
        'стерилизација',
        'антибиотици',
        'имунитет',
        'имунодијагностика',
        'патогенеза',
      ],
    },
    professors: [
      'Проф. д-р Александра Грозданова',
      'Проф. д-р Елена Трајковска Докиќ',
      'Проф. д-р Гордана Јанкоска',
      'Асс. д-р Радомир Јовчевски',
      'Асс. д-р Марко Костовски',
    ],
    semester: 4,
    title: {
      en: 'Microbiology with Immunology',
      mk: 'Микробиологија со имунологија',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB21',
      mk: 'ФФЛБ21',
    },
    description: {
      en: 'Composition and characteristics of food groups (milk, eggs, meat, cereals, fruits and vegetables), permitted additives and contaminants, methods and techniques for quality and safety control, and legal regulations.',
      mk: 'Состав и карактеристики на групи прехранбени производи (млеко, јајца, месо, житарки, овошје и зеленчук), дозволени адитиви и загадувачи, методи и техники за контрола на квалитетот и здравствената безбедност, како и законски прописи.',
    },
    credits: 5,
    keywords: {
      en: [
        'food composition',
        'nutrients',
        'additives',
        'milk',
        'meat',
        'cereals',
        'quality',
        'food safety',
      ],
      mk: [
        'состав на храна',
        'нутриенти',
        'адитиви',
        'млеко',
        'месо',
        'житарки',
        'квалитет',
        'безбедност на храна',
      ],
    },
    professors: ['Доц. д-р Зоран Живиќ', 'Проф. д-р Тања Петреска Ивановска'],
    semester: 4,
    title: {
      en: 'Food Analysis',
      mk: 'Анализа на прехранбени производи',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB22',
      mk: 'ФФЛБ22',
    },
    description: {
      en: 'Nucleic acid isolation and quantification techniques, PCR (allele-specific, multiplex, nested, real-time), gene expression analysis, fragment analysis, RFLP-PCR, sequencing and HGVS nomenclature.',
      mk: 'Техники за изолација и квантификација на нуклеински киселини, PCR (алел-специфична, мултиплекс, вгнездена, real-time), анализа на експресија на гени, фрагмент анализи, RFLP-PCR, секвенционирање и HGVS номенклатура.',
    },
    credits: 4,
    keywords: {
      en: [
        'DNA/RNA isolation',
        'PCR',
        'real-time PCR',
        'primers',
        'electrophoresis',
        'sequencing',
        'RFLP',
        'HGVS',
      ],
      mk: [
        'изолација на ДНК/РНК',
        'PCR',
        'real-time PCR',
        'прајмери',
        'електрофореза',
        'секвенционирање',
        'RFLP',
        'HGVS',
      ],
    },
    professors: [
      'Проф. д-р Надица Матевска-Гешковска',
      'Доц. д-р Марија Станинова Стојовска',
    ],
    semester: 4,
    title: {
      en: 'Molecular Genetic Analyses',
      mk: 'Молекуларни генетски анализи',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB23',
      mk: 'ФФЛБ23',
    },
    description: {
      en: 'Mechanisms of the most common organ and system diseases (immune, hematopoietic, cardiovascular, gastrointestinal, hepatobiliary, urinary, endocrine), plus general pathology of inflammation and neoplasms with diagnostic techniques.',
      mk: 'Механизми на настанување на најчестите заболувања на органи и системи (имунолошки, хематопоетски, кардиоваскуларни, гастроинтестинални, хепатобилијарни, уринарни, ендокрини), како и општа патологија на воспаленија и неоплазми со дијагностички техники.',
    },
    credits: 4,
    keywords: {
      en: [
        'inflammation',
        'neoplasms',
        'immune disorders',
        'hemostasis',
        'hepatobiliary system',
        'acid-base balance',
        'histopathology',
      ],
      mk: [
        'воспаление',
        'неоплазми',
        'имунолошки нарушувања',
        'хемостаза',
        'хепатобилијарен систем',
        'ацидо-базна рамнотежа',
        'хистопатологија',
      ],
    },
    professors: [
      'Проф. д-р Даниела Поп Ѓорчева',
      'Проф. д-р Оливија Васкова',
      'Проф. д-р Даниела Миладинова',
      'Доц. д-р Венјамин Мајсторов',
      'Доц. д-р Ана Угринска',
      'Доц. д-р Синиша Стојановски',
      'Проф. д-р Магдалена Богдановска Тодоровска',
      'Проф. д-р Гордана Петрушевска',
    ],
    semester: 4,
    title: {
      en: 'Pathophysiology with Pathology',
      mk: 'Патофизиологија со патологија',
    },
    year: 2,
  },
  {
    code: {
      en: 'FFLB24',
      mk: 'ФФЛБ24',
    },
    description: {
      en: 'Primary and secondary metabolites, sources and classification of natural products, biosynthetic pathways, extraction and isolation, qualitative and quantitative analysis methods, biological activity, quality control and adulterant detection.',
      mk: 'Примарни и секундарни метаболити, извори и класификација на природните производи, биосинтетски патеки, екстракција и изолација, квалитативни и квантитативни методи на анализа, биолошка активност, контрола на квалитет и определување фалсификати.',
    },
    credits: 7,
    keywords: {
      en: [
        'secondary metabolites',
        'phenolics',
        'terpenes',
        'alkaloids',
        'extraction',
        'qualitative analysis',
        'quantitative analysis',
        'adulterants',
      ],
      mk: [
        'секундарни метаболити',
        'феноли',
        'терпени',
        'алкалоиди',
        'екстракција',
        'квалитативна анализа',
        'квантитативна анализа',
        'фалсификати',
      ],
    },
    professors: [
      'Доц. д-р Ивана Цветковиќ Каранфилова',
      'Проф. д-р Светлана Кулеванова',
      'Проф. д-р Гоше Стефков',
      'Проф. д-р Марија Карапанцова',
    ],
    semester: 5,
    title: {
      en: 'Natural Products and Their Analysis',
      mk: 'Природни производи и нивна анализа',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB25',
      mk: 'ФФЛБ25',
    },
    description: {
      en: 'Application of biochemical knowledge in medical diagnosis and treatment: quality control, sample collection and analysis, biochemical manifestations of disorders in protein, carbohydrate, lipid, water and electrolyte metabolism, acid-base balance, enzymes and iron.',
      mk: 'Примена на биохемиските знаења во медицинската дијагноза и третман: контрола на квалитет, собирање и анализа на примероци, биохемиски манифестации на нарушувања во метаболизмот на протеини, јаглехидрати, липиди, вода и електролити, ацидо-базна рамнотежа, ензими и железо.',
    },
    credits: 6,
    keywords: {
      en: [
        'quality control',
        'protein metabolism',
        'carbohydrates',
        'lipids',
        'electrolytes',
        'acid-base balance',
        'enzymes',
        'hemoglobin',
      ],
      mk: [
        'контрола на квалитет',
        'метаболизам на протеини',
        'јаглехидрати',
        'липиди',
        'електролити',
        'ацидо-базна рамнотежа',
        'ензими',
        'хемоглобин',
      ],
    },
    professors: [
      'Проф. д-р Татјана Кадифкова Пановска',
      'Проф. д-р Марија Хиљадникова-Бајро',
    ],
    semester: 5,
    title: {
      en: 'Clinical Biochemical Analyses',
      mk: 'Клинички биохемиски анализи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB26',
      mk: 'ФФЛБ26',
    },
    description: {
      en: 'Basic pharmaceutical technology operations (mechanical, thermal, diffusion, sterilization), dosage form stability, Good Manufacturing Practice (GMP) principles, types of pharmaceutical dosage forms and methods for their characterization and quality control.',
      mk: 'Основни фармацевтско-технолошки операции (механички, топлински, дифузиски, стерилизација), стабилност на дозирани форми, начела на Добра производна практика (ДПП), видови фармацевтски дозирани форми и методи за нивна карактеризација и контрола на квалитет.',
    },
    credits: 6,
    keywords: {
      en: [
        'dosage forms',
        'GMP',
        'stability',
        'mechanical operations',
        'sterilization',
        'biopharmaceutics',
        'quality control',
      ],
      mk: [
        'дозирани форми',
        'ДПП',
        'стабилност',
        'механички операции',
        'стерилизација',
        'биофармација',
        'контрола на квалитет',
      ],
    },
    professors: [
      'Проф. д-р Маја Симоноска Црцаревска',
      'Проф. д-р Катерина Горачинова',
      'Проф. д-р Рената Славеска Раички',
      'Проф. д-р Марија Главаш Додов',
      'Проф. д-р Никола Гешковски',
      'Доц. д-р Љубица Михаилова',
      'Доц. д-р Душко Шалабалија',
      'Асс. м-р Теодора Тасевска',
    ],
    semester: 5,
    title: {
      en: 'Pharmaceutical Technology Procedures',
      mk: 'Фармацевтско технолошки процедури',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB27',
      mk: 'ФФЛБ27',
    },
    description: {
      en: 'Principles of immunological tests: isolation of immunocompetent cells and proteins, production of monoclonal and polyclonal antibodies, detection and characterization of antigens/antibodies (immunodiffusion, immunoprecipitation, immunoelectrophoresis, 2D/3D electrophoresis, immunoblotting, ELISA, RDT).',
      mk: 'Принципи на имунолошките тестови: изолација на имунокомпетентни клетки и протеини, продукција на моноклонални и поликлонални антитела, детекција и карактеризација на антигени/антитела (имунодифузија, имунопреципитација, имуноелектрофореза, 2D/3D електрофореза, имуноблотинг, ELISA, RDT).',
    },
    credits: 3,
    keywords: {
      en: [
        'antibodies',
        'antigens',
        'immunodiffusion',
        'immunoelectrophoresis',
        'Western blot',
        'ELISA',
        'rapid tests',
      ],
      mk: [
        'антитела',
        'антигени',
        'имунодифузија',
        'имуноелектрофореза',
        'Western blot',
        'ELISA',
        'брзи тестови',
      ],
    },
    professors: [
      'Проф. д-р Надица Матевска-Гешковска',
      'Проф. д-р Ана Поцева Пановска',
      'Доц. д-р Марија Станинова Стојовска',
    ],
    semester: 5,
    title: {
      en: 'Immunological Analyses',
      mk: 'Имунолошки анализи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB28',
      mk: 'ФФЛБ28',
    },
    description: {
      en: 'Cell culture models, animal disease models and in silico models in biomedical research: cell cultivation and cryopreservation, development and validation of animal models, regulatory and ethical aspects, GLP.',
      mk: 'Модели на клеточни култури, животински модели на заболувања и in silico модели во биомедицинските истражувања: одгледување и криопрезервација на клетки, развој и валидација на животински модели, регулаторни и етички аспекти, GLP.',
    },
    credits: 6,
    keywords: {
      en: [
        'cell cultures',
        'animal models',
        'in silico models',
        'cryopreservation',
        'ethics',
        'GLP',
        'allometry',
      ],
      mk: [
        'клеточни култури',
        'животински модели',
        'in silico модели',
        'криопрезервација',
        'етика',
        'GLP',
        'алометрија',
      ],
    },
    professors: [
      'Проф. д-р Кристина Младеновска',
      'Проф. д-р Никола Гешковски',
      'Доц. д-р Љубица Михаилова',
    ],
    semester: 6,
    title: {
      en: 'Experimental Models in Biomedical Research',
      mk: 'Експериментални модели во биомедицинските истражувања',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB29',
      mk: 'ФФЛБ29',
    },
    description: {
      en: 'General and forensic toxicology: toxicity criteria and factors, toxicokinetics and toxicodynamics, drug and medicine abuse, alcohol, postmortem toxicology, instrumental methods, quality control and legal regulations.',
      mk: 'Општа и форензична токсикологија: критериуми и фактори на токсичност, токсикокинетика и токсикодинамика, злоупотреба на дроги и лекови, алкохол, токсикологија на лешен материјал, инструментални методи, контрола на квалитет и законски прописи.',
    },
    credits: 5,
    keywords: {
      en: [
        'toxicokinetics',
        'toxicodynamics',
        'drugs of abuse',
        'alcohol',
        'postmortem material',
        'instrumental methods',
        'result interpretation',
      ],
      mk: [
        'токсикокинетика',
        'токсикодинамика',
        'дроги',
        'алкохол',
        'лешен материјал',
        'инструментални методи',
        'толкување резултати',
      ],
    },
    professors: [
      'Проф. д-р Татјана Кадифкова Пановска',
      'Проф. д-р Тања Петреска Ивановска',
      'Проф. д-р Зоран Кавраковски',
      'Доц. д-р Зоран Живиќ',
    ],
    semester: 6,
    title: {
      en: 'Toxicological Forensic Analyses',
      mk: 'Токсиколошки форензични анализи',
    },
    year: 3,
  },
  {
    code: {
      en: 'FFLB30',
      mk: 'ФФЛБ30',
    },
    description: {
      en: 'Integration of theoretical principles and experimental techniques in industrial use of modified organisms: DNA editing technologies, biotechnological processes, bioreactor engineering and application in medicine and pharmacy.',
      mk: 'Интегрираност на теоретски принципи и експериментални техники во индустриска експлоатација на модифицирани организми: технологии за уредување на ДНК, биотехнолошки процеси, биореакторска техника и примена во медицината и фармацијата.',
    },
    credits: 4,
    keywords: {
      en: [
        'recombinant DNA',
        'bioreactors',
        'biotransformation',
        'genetic engineering',
        'bioactive molecules',
        'biotechnology industry',
      ],
      mk: [
        'рекомбинантна ДНК',
        'биореактори',
        'биотрансформација',
        'генетски инженеринг',
        'биоактивни молекули',
        'биотехнолошка индустрија',
      ],
    },
    professors: ['Проф. д-р Рената Славеска Раички'],
    semester: 6,
    title: {
      en: 'Fundamentals of Biotechnology',
      mk: 'Основи на биотехнологија',
    },
    year: 3,
  },
]
