/** `3.5MB`, `20MB`, `4.21MB`: sizes as the user reads them. */
const toMegabytes = (bytes: number) =>
  `${Number((bytes / (1024 * 1024)).toFixed(2))}MB`

export const UI_STRINGS = {
  general: {
    restrictedAction:
      "This action isn't available right now — your account is currently restricted.",
    actionUnavailable: 'Action unavailable',
    restrictedModalTitle: 'Not allowed',
    restrictedModalIntro:
      'You can’t do this because your account is restricted.',
    restrictedModalClose: 'Close',
    tryAgain: 'Please try again.',
    errors: {
      description:
        'This page could not be loaded. Try again, and if it keeps happening come back a little later.',
      retry: 'Try again',
      notFoundTitle: 'Page not found',
      notFoundDescription:
        'The page you’re looking for doesn’t exist, or it has moved.',
      backHome: 'Go to the homepage',
    },
    year: (year: number) => `Year ${year}`,
    unexpectedError: 'Something went wrong',
    apiUnavailable:
      'Scriptr is temporarily unavailable. Please try again in a moment.',
    signInRequired: 'Sign in to continue.',
    sessionExpired: 'Your session expired. Please sign in and try again.',
    couldNotUpdate: (label: string) => `Couldn’t update ${label}`,
    addVote: (label: string, noun: string, count: number) =>
      `${label} ${noun} (${count})`,
    removeVote: (label: string, noun: string, count: number) =>
      `Remove ${label.toLowerCase()} from ${noun} (${count})`,
    close: 'Close',
    closeDialog: 'Close dialog',
    /** Clears whatever a field holds; the icon-only button in `InputWrapper`. */
    clearInput: 'Clear input',
    colorTheme: 'Color theme',
    trophyIcon: 'Trophy Icon',
    confirm: 'Confirm',
    cancel: 'Cancel',
    openDialog: 'Open Dialog',
    selectPlaceholder: 'Select...',
    dataUnavailable: 'Data unavailable',
    loading: 'Loading',
    themeLight: 'Light',
    themeAuto: 'Auto',
    themeDark: 'Dark',
  },
  flags: {
    report: 'Report',
    submitError: 'Couldn’t submit report',
    reportSubmitted: 'Report submitted',
    alreadyReportedTitle: 'Already reported',
    alreadyReportedDescription:
      'You already have a pending report for this item.',
    checkStatusError: 'Couldn’t check report status',
    reportContent: 'Report content',
    submitted: 'Thanks — this has been reported for review.',
    description: (targetType: string) =>
      `Let us know what’s wrong with this ${targetType}. Reports are reviewed by admins.`,
    reasonPlaceholder: 'Describe the issue (min. 10 characters)',
    reasonLabel: 'Report reason',
    submit: 'Submit report',
    minimumReasonLength: 10,
  },
  home: {
    greeting: 'Welcome to Scriptr',
    metaDescription:
      'A platform for students to share and discover study materials.',
    title: 'Your study, all in one place.',
    subtitle:
      'Every university, faculty and study on Scriptr — with the scripts its students share, the subjects they take and the professors who teach them.',
    createAccount: 'Create account',
    setUpStudies: 'Set up studies',
    universitiesTitle: 'Universities',
    universitiesSubtitle: 'The institutions behind every faculty and study.',
    facultiesTitle: 'Faculties',
    facultiesSubtitle: 'The faculties that make up each university.',
    studiesTitle: 'Studies',
    studiesSubtitle:
      'Open a study to reach its subjects, professors and scripts.',
    facultyCount: (count: number) =>
      `${count} ${count === 1 ? 'faculty' : 'faculties'}`,
    facultySummary: (studies: number, professors: number) =>
      `${studies} ${studies === 1 ? 'Study' : 'Studies'} • ${professors} ${
        professors === 1 ? 'Professor' : 'Professors'
      }`,
    /** The path under a study's name: its faculty, then its university. */
    studyPath: (faculty: string, university: string) =>
      `${faculty} • ${university}`,
    noUniversities: 'No universities are listed yet.',
    noFaculties: 'No faculties are listed yet.',
    noStudies: 'No studies are open for enrolment yet.',
  },
  scripts: {
    sectionTitle: 'Subject Scripts',
    sectionSubtitle:
      'Notes and study material shared by this subject community.',
    authoredSectionTitle: 'Authored scripts',
    authoredSectionSubtitle: 'Scripts shared with the community.',
    favoritesSectionTitle: 'Favorite scripts',
    favoritesSectionSubtitle: 'Scripts saved for later.',
    searchLabel: 'Search scripts',
    searchPlaceholder: 'Search scripts by title, author, or tag...',
    emptyState: 'No scripts match these filters.',
    loadFailed:
      'These scripts could not be loaded right now. Try again in a moment.',
    browseAll: 'Browse all scripts',
    showAll: 'Show all',
    // The study overview's sidebar, under the professors.
    studySidebarTitle: 'Scripts',
    studySidebarSubtitle: 'The scripts this study’s students share.',
    studySidebarEmpty: 'This study has no scripts yet.',
    feed: {
      toggleLabel: 'Script feed',
      forYou: 'For you',
      all: 'All scripts',
      allTitle: 'All scripts',
      allSubtitle: 'Top scripts from every subject in this study.',
      // The feed is a page of its own beside the study's overview, so it titles
      // itself after its content instead of repeating the study's own title.
      metadataTitle: (studyName: string) => `${studyName} · Scripts`,
      metadataDescription: (studyName: string) =>
        `The scripts students of ${studyName} share, and the subjects they cover.`,
    },
    search: {
      // The global search is the catalog: universities, faculties, studies and
      // professors. Subjects and scripts belong to a study, and a study's site
      // searches its own content.
      pageTitle: 'Search the catalog',
      pageSubtitle: 'Find a university, faculty, study or professor.',
      formAriaLabel: 'Search the catalog',
      placeholder: 'Search universities, faculties, studies or professors...',
      submit: 'Search',
      resultsTitle: 'Results',
      resultsSubtitle: (query: string) =>
        `Catalog entries matching “${query}”.`,
      prompt:
        'Enter a search term to find a university, faculty, study or professor.',
      loadFailed:
        'Search is unavailable right now. Try again in a moment — your query is still in the box above.',
      noResults: (query: string) =>
        `No catalog entries match “${query}”. Try different keywords or check the spelling.`,
      searchAll: (query: string) => `Search the catalog for “${query}”`,
      quickSearchLabel: 'Quick search',
      closeSearch: 'Close search',
      invalidQuery: (maxLength: number) =>
        `Enter a search term (up to ${maxLength} characters).`,
    },
    filters: {
      allSubjects: 'All subjects',
      recentlyUpdated: 'Recently updated',
      titleAZ: 'Title A-Z',
      subjectLabel: 'Filter scripts by subject',
      sortLabel: 'Sort scripts',
    },
    actions: {
      download: 'Download',
      preview: 'Preview',
      noFilesAttached: 'No files attached to this script.',
      upvote: 'Upvote',
      voteNoun: 'script',
      openScript: (author: string) => `Open ${author}'s script`,
      viewComments: (title: string) => `View comments on ${title}`,
    },
    detail: {
      errorTitle: 'Something went wrong loading this script.',
      errorRetry: 'Try again',
      notFoundTitle: 'Script not found',
      notFoundDescription:
        'This script may have been removed, or the link is incorrect.',
      errorFallback: 'Please try again.',
    },

    uploadModal: {
      title: 'Upload a script',
      triggerLabel: 'New script',
      submitButtonLabel: 'Create Script',
      cancelButtonLabel: 'Clear',
      description: 'Add the details your classmates need. Files are optional.',
      formTitle: 'Script title',
      formTitleHelp:
        'Use a clear, distinctive name — it becomes the link to your script.',
      formDescription: 'Description',
      formDescriptionHelp:
        'Summarize the content, coverage, or useful context.',
      subjectLabel: 'Subject',
      professorLabel: 'Professor',
      examSessionLabel: 'Exam session',
      examSessionHelp: 'Select the session this material applies to.',
      examSessionPlaceholder: 'Select a session',
      generalSessionOption: 'General (All Sessions)',
      examYearLabel: 'Exam year',
      examYearHelp: 'Pick the session first; the years available depend on it.',
      examYearPlaceholder: 'Select a year',
      generalYearOption: 'General (All Years)',
      additionalReadingLabel: 'Additional reading',
      additionalReadingHelp:
        'Add URLs for related notes, articles, or resources.',
      dropzoneLabel: 'Drop files here or click to browse',
      filesLabel: 'Files',
      filesHelp:
        'Optionally add supported files by dragging them here or browsing your device.',
      removeButtonLabel: 'Remove',
      removeLinkAriaLabel: 'Remove link',
      removeFileAriaLabel: (name: string) => `Remove ${name}`,
      readingLinkPlaceholder: 'https://...',
      addLinkButtonLabel: 'Add link',
      progress: {
        title: 'Creating your script',
        addingFilesTitle: 'Adding files',
        hint: 'This can take a minute for large files. Please keep this window open.',
        qualityWarning:
          'Please be aware that uploaded files may lose some visual quality, because they are compressed to fit the size limit.',
        qualityAdvice:
          'If a file is still too big afterwards, shrink it before uploading: export images at a lower resolution, or split the document into smaller files.',
      },
      statuses: {
        uploading: 'Uploading files…',
        optimizing: 'Optimizing files…',
        creating: 'Creating script…',
        error: 'An error occurred while creating the script.',
        success: 'Script created successfully.',
        successDescription:
          'Your script is now available to the subject community.',
      },
      readingLinkErrors: {
        invalid: 'Enter a valid link, e.g. https://example.com/notes',
        protocol: 'Only http:// and https:// links are allowed',
        tooLong: 'This link is too long',
        duplicate: 'This link is already in the list',
      },
      fieldErrors: {
        titleRequired: 'Enter a title for your script',
        titleTooLong: 'Script title must be 2 KB or less',
        descriptionTooLong: 'Script description must be 50 KB or less',
        unsupportedScript:
          'Use Latin or Cyrillic letters only. Other languages are not supported yet.',
        noProfessors: 'No professors are available for this subject',
        professorsUnavailable:
          "This subject's professors are not linked yet, so none can be chosen",
        filesInvalid: 'Remove or replace the files with errors',
      },
      slug: {
        label: 'Link',
        path: (slug: string) => `/scripts/${slug}`,
        /** `stem` is what the title produces; the stored slug also carries a
         * short suffix the preview cannot know before the script exists. */
        previewPath: (stem: string) => `/scripts/${stem}-…`,
        previewNote:
          'Built from the title. The last characters are added when the script is created to keep it unique.',
        fixedNote:
          'Set when the script was created and cannot be changed. Editing the title will not change it.',
      },

      fileErrors: {
        noFiles: 'At least one file is required',
        tooMany: (max: number) => `You can upload at most ${max} files at once`,
        unsupportedType: (extension: string) =>
          `Unsupported file type (.${extension})`,
        tooLarge: (maxBytes: number) => `File exceeds ${toMegabytes(maxBytes)}`,
        unknownUpload: 'This upload is unknown or has expired',
        invalidContent: 'A file’s contents don’t match its file type',
        tooLargeAfterOptimizing: (maxBytes: number, sizeBytes?: number) =>
          sizeBytes === undefined
            ? `A file is still over ${toMegabytes(maxBytes)} after optimizing`
            : `A file is still ${toMegabytes(sizeBytes)} after optimizing (the limit is ${toMegabytes(maxBytes)})`,
        tooLargeAfterOptimizingNamed: (
          name: string,
          maxBytes: number,
          sizeBytes: number
        ) =>
          `${name} is still ${toMegabytes(sizeBytes)} after optimizing (the limit is ${toMegabytes(maxBytes)})`,
        retryTooLarge: (name: string, maxBytes: number) =>
          `${name} was already optimized and stayed too large, so it will not fit at this size. Make it ${toMegabytes(maxBytes)} or smaller first.`,
        processingFailed: 'Failed to process the uploaded file(s)',
        stagingFailed: 'Failed to upload file(s)',
        rateLimited:
          'Too many uploads. Please wait a few minutes and try again.',
        processingUnavailable:
          'File processing is temporarily unavailable. Please try again in a few minutes.',
        invalidRequest: 'Invalid upload request',
      },
    },
  },
  subjects: {
    title: 'Subjects',
    searchLabel: 'Search subjects',
    searchPlaceholder: 'Search subjects, codes, or professors',
    noSubjects: 'No subjects are available for this study yet.',
    noMatchingSubjects: 'No subjects match those filters.',
    sidebarTitle: 'Your subjects',
    sidebarSubtitle: 'Subjects from your selected studies.',
    emptyState: 'Complete your study setup to see your current subjects here.',
    electiveLabel: 'Elective',
    filters: {
      electives: 'Electives',
      sortByYear: 'Sort by year',
      sortBySubject: 'Sort by name',
      sortByProfessor: 'Sort by professor',
      filterByYear: 'Filter by year',
      sortSubjects: 'Sort subjects',
    },
  },
  academics: {
    studiesTitle: 'Studies',
    noStudies: 'No studies are available for this faculty yet.',
    noFaculties: 'No faculties are listed for this university yet.',
    noProfessorCourses: 'No courses are listed for this professor yet.',
    studyImageAlt: 'Study image',
    studyAbout: 'About the Study',
    studyOverview: 'Overview',
    visitWebsite: 'Visit website',
    location: 'Location',
    secretary: 'Secretary',
    administration: 'Administration',
    faculties: 'Faculties',
    noProfessorsAssigned: 'No professors assigned to this faculty.',
    contactAndLocation: 'Contact & Location',
    address: 'Address',
    dean: 'Dean',
    viceDeans: 'Vice Deans',
    semester: (semester: number) => `Semester ${semester}`,
    aboutFaculty: 'About the faculty',
    aboutUniversity: 'About the university',
    facultyImageAlt: 'Faculty image',
    universityImageAlt: 'University image',
    studySummary: (subjects: number, professors: number) =>
      `${subjects} Subjects • ${professors} Professors`,
    entity: {
      university: 'University',
      faculty: 'Faculty',
      study: 'Study',
      professor: 'Professor',
      subject: 'Subject',
    },
    professor: {
      contactDetails: 'About',
      office: 'Office',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      affiliatedFaculties: 'Affiliated faculties',
      biography: 'Biography',
      coursesTaught: 'Courses taught',
      courseCount: (count: number) =>
        `${count} ${count === 1 ? 'course' : 'courses'}`,
      year: (year: number) => `Year ${year}`,
      ects: (credits: number) => `${credits} ECTS`,
      academicStaff: 'Academic Staff',
      subjects: 'Subjects',
    },
    subject: {
      overview: 'Subject overview',
      curriculumDetails: 'Curriculum details',
      viewSyllabusDocument: 'View Syllabus Document',
      syllabusLabel: 'Syllabus',
      revisitPrompt:
        "Use this course's shared scripts and syllabus to revisit key material in your own time.",
    },
    metadata: {
      professorDescription: (name: string) =>
        `Academic profile, courses taught, and contact details for ${name}.`,
      universityDescription: (name: string) =>
        `Explore faculties, departments, and academic programs at ${name}.`,
      facultyDescription: (name: string) =>
        `Explore academic subjects, faculty administration, and professors at ${name}.`,
      studyDescription: (name: string) =>
        `Explore academic subjects, faculty administration, and professors at ${name}.`,
      subjectDescription: (name: string) =>
        `Syllabus, academic year, exam sessions, and course details for ${name}.`,
      notFoundTitle: (entityLabel: string, siteName: string) =>
        `${entityLabel} Not Found | ${siteName}`,
    },
  },
  editor: {
    alignText: (alignment: string) => `Align Text ${alignment}`,
    colorSwatch: (color: string) => `Color Swatch ${color}`,
  },
  onboarding: {
    title: 'Set up your studies',
    universityTitle: 'Which university do you attend?',
    facultyTitle: 'Which faculty?',
    studyTitle: 'Which study program?',
    selectUniversityFirst: 'Select a university first.',
    selectFacultyFirst: 'Select a faculty first.',
    selectStudyFirst: 'Select a study to see subjects.',
    noOptions: 'No options available yet.',
    noSubjects: 'No subjects found for this study yet.',
    subjectsTitle: 'Which years have you finished?',
    subjectsSubtitle:
      'Mark a whole year done at once, or check off individual subjects below — fine-tune this later from your profile too.',
    subjectCount: (completed: number, total: number) =>
      `${completed}/${total} subjects completed`,
    requiredSubjects: 'Required',
    electiveSubjects: 'Electives',
    yearCompleted: 'Year completed',
    markYearComplete: 'Mark year complete',
    continue: 'Continue',
    saving: 'Saving…',
    saveFailed: 'We could not save your academic profile. Please try again.',
    catalogLoading: 'Loading your studies…',
    catalogFailed: `We couldn't load your studies. Please try again.`,
    retry: 'Try again',
    resumeReminder: {
      title: 'Finish setting up your studies',
      body: 'Pick up where you left off any time.',
      action: 'Resume setup',
    },
    studySelection: {
      /** The line above the heading: what the page is for, in three words. */
      greeting: 'Let’s get you set up',
      title: 'Choose your study',
      subtitle:
        'Pick the university, faculty and study you attend. You can add another study later.',
      empty: 'No studies are open for enrolment yet.',
      /** Followed by the `alreadyAddedEdit` link. */
      alreadyAdded: 'Study already set up —',
      alreadyAddedEdit: 'edit it here',
    },
    academicSetup: {
      /** The line above the heading: three words on the effort, since the
       * heading already says what the page does. */
      greeting: 'Takes about a minute',
      title: 'Set up your academic profile',
      /** A signed-in reader who is already a member of this study is changing
       * the profile it holds, not creating one. */
      updateTitle: 'Update your academic profile',
      subtitle: (studyName: string) =>
        `Which years of ${studyName} have you finished? This only affects what you see here — you can change it later from your profile.`,
      submit: 'Save and continue',
      /** The same submit, when it is an update rather than a first setup. */
      saveChanges: 'Save changes',
      saved: 'Your academic profile is saved.',
      /** The way to the catalog picker, which is the only route to another
       * study's setup from inside one. */
      setupAnother: 'Set up another study',
      skip: 'Skip for now',
      resume: 'Finish setting up',
      resumeTitle: 'Your setup is not finished',
      resumeBody:
        'Mark the years you have finished to see what is left to take.',
      guestNote:
        'Without an account this lives only in this browser. Create an account to keep it on every device.',
      noSubjects: 'This study has no subjects synced to the database yet.',
      notSynced:
        'This study is not linked to the database yet, so setup is unavailable.',
    },
    account: {
      title: 'Save your progress',
      subtitle:
        'Without an account, this only lives in this browser. Create an account to keep it synced across your devices.',
      continueAsGuest: 'Continue as guest',
      createAccount: 'Create an account',
    },
  },
  profile: {
    universities: 'Universities',
    faculties: 'Faculties',
    studies: 'Studies',
    noAcademicAffiliations: 'No academic affiliations added.',
    loadingLabel: 'Loading your profile…',
    loadError: `We couldn't load your profile. Please try again.`,
    editProfileLabel: 'Edit profile',
    retryLabel: 'Try again',
    greeting: 'Profile',
    viewProfileAriaLabel: 'Go to your profile',
    subjects: {
      statusGroupLabel: 'Subject status',
      completed: 'Completed',
      currentlyTaking: 'Currently taking',
      completedSubtitle: 'Subjects completed so far.',
      currentlyTakingSubtitle: 'Subjects still in progress.',
      completedEmpty: 'No completed subjects yet.',
      currentlyTakingEmpty: 'No subjects in progress.',
      studyFilterLabel: 'Filter by study',
      allStudies: 'All studies',
    },
    academics: {
      editLabel: 'Edit academics',
      title: 'Edit academics',
      notPrepared:
        'Your academic selections could not be prepared. Please review them and try again.',
      saved: 'Academics updated',
      saveFailed: `We couldn't update your academics`,
    },
    edit: {
      title: 'Edit profile',
      fullNameLabel: 'Full name',
      usernameLabel: 'Username',
      cancel: 'Cancel',
      save: 'Save changes',
      saved: 'Profile updated',
      saveFailed: `We couldn't update your profile`,
      avatarLabel: 'Profile photo',
      avatarChange: 'Change photo',
      avatarInvalidType: 'Choose a JPEG, PNG, or WebP image.',
      avatarTooLarge: (maxMegabytes: number) =>
        `Choose an image under ${maxMegabytes} MB.`,
      avatarUploadUnavailable: 'Photo upload is not available yet.',
    },
  },
  footer: {
    copyright: (year: number) => `© ${year} All rights reserved.`,
  },
  navigation: {
    account: 'Account',
    home: 'Home',
    api: 'API',
    auth: 'Auth',
    subjects: 'Subjects',
    scripts: 'Scripts',
    studies: 'Your studies',
    professors: 'Professors',
    workspace: 'Workspace',
    favorites: 'Favorites',
    favoritesShowAll: 'Show all favorites',
    comments: 'Comments',
    newScript: 'New script',
    notifications: 'Notifications',
    signIn: 'Sign in',
    closeNavigation: 'Close navigation',
    simpleMode: 'Simple mode',
    simpleModeDescription:
      'Turns off transparency, animations and the animated background.',
    openNavigation: 'Open navigation',
    mainNavigation: 'Main navigation',
  },
  activity: {
    title: 'Your activity',
    subtitle: 'A quick view of the work you have been making.',
    view: 'View activity',
    savedScripts: 'Saved scripts',
    scriptsAuthored: 'Scripts authored',
    helpfulComments: 'Helpful comments',
  },
  auth: {
    subtitle:
      'Access your academic subjects, saved scripts, and study materials.',
    loadingLabel: 'Checking your session…',
    signedInTitle: "You're signed in",
    signedInLabel: 'Signed in as',
    continueLabel: 'Continue to Scriptr',
    continueAsGuestLabel: 'Continue as Guest',
    logoutButtonLabel: 'Log out',
    login: {
      title: 'Sign in to Scriptr',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitButtonLabel: 'Sign in',
      switchToRegister: "Don't have an account? Create one",
      statuses: {
        submitting: 'Signing in…',
        errorTitle: 'Sign-in failed',
        successTitle: 'Signed in',
        successDescription: 'Welcome back.',
      },
    },
    register: {
      title: 'Create your account',
      fullNameLabel: 'Full name',
      usernameLabel: 'Username',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitButtonLabel: 'Create account',
      switchToLogin: 'Already have an account? Sign in',
      fieldErrors: {
        usernameTaken: 'This username is already taken',
        emailTaken: 'An account with this email already exists',
      },
      statuses: {
        submitting: 'Creating your account…',
        errorTitle: 'Could not create account',
        successTitle: 'Account created',
        successDescription: 'Welcome to Scriptr.',
        incompleteForm: 'Please complete the form correctly.',
      },
    },
    callback: {
      processingLabel: 'Signing you in…',
      backToSignIn: 'Back to sign in',
      invalidLink: 'This link is missing or invalid.',
    },
  },
} as const
