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
    title: 'Make studying feel a little lighter.',
    subtitle:
      'Find the notes, scripts, and shared knowledge you need to move through this week with confidence.',
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
    browseAll: 'Browse all scripts',
    search: {
      pageTitle: 'Search scripts',
      pageSubtitle: 'Find notes and study material across every subject.',
      formAriaLabel: 'Search all scripts',
      placeholder: 'Search all scripts by title or description...',
      submit: 'Search',
      resultsTitle: 'Results',
      resultsSubtitle: (query: string) => `Scripts matching “${query}”.`,
      prompt: 'Enter a search term to find scripts.',
      noResults: (query: string) =>
        `No scripts match “${query}”. Try different keywords or check the spelling.`,
      searchAll: (query: string) => `Search all scripts for “${query}”`,
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
    },
    feed: {
      toggleLabel: 'Script feed',
      forYou: 'For you',
      all: 'All scripts',
      allTitle: 'All scripts',
      allSubtitle: 'Top scripts from every subject.',
    },

    uploadModal: {
      title: 'Upload a script',
      triggerLabel: 'New script',
      submitButtonLabel: 'Create Script',
      cancelButtonLabel: 'Clear',
      description: 'Add the details your classmates need. Files are optional.',
      formTitle: 'Script title',
      formTitleHelp: 'Use a clear, descriptive name.',
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
        noProfessors: 'No professors are available for this subject',
        filesInvalid: 'Remove or replace the files with errors',
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
    showAll: 'Show all',
    emptyState: 'Complete your study setup to see your current subjects here.',
    guestStudyPrompt:
      'Choose a study during onboarding to see your subjects here.',
    guestNoIncompleteSubjects:
      'All subjects in your selected study are marked complete.',
    electiveLabel: 'Elective',
  },
  academics: {
    studiesTitle: 'Studies',
    noStudies: 'No studies are available for this faculty yet.',
    noFaculties: 'No faculties are listed for this university yet.',
    noProfessorCourses: 'No courses are listed for this professor yet.',
    studyImageAlt: 'Study image',
    studyAbout: 'About the Study',
    visitWebsite: 'Visit website',
    location: 'Location',
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
    },
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
      `${completed}/${total} subjects`,
    yearCompleted: 'Year completed',
    markYearComplete: 'Mark year complete',
    continue: 'Continue',
    saving: 'Saving…',
    saveFailed: 'We could not save your academic profile. Please try again.',
    resumeReminder: {
      title: 'Finish setting up your studies',
      body: 'Pick up where you left off any time.',
      action: 'Resume setup',
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
      yearFilterLabel: 'Filter by year',
      allYears: 'All years',
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
    professors: 'Professors',
    workspace: 'Workspace',
    favorites: 'Favorites',
    favoritesShowAll: 'Show all favorites',
    comments: 'Comments',
    newScript: 'New script',
    notifications: 'Notifications',
    closeNavigation: 'Close navigation',
    simpleMode: 'Simple mode',
    simpleModeDescription:
      'Turns off blur, transparency, animations and the animated background.',
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
        academicProfileUnavailable:
          'Your academic selections could not be prepared. Please reopen onboarding and try again.',
      },
    },
    callback: {
      processingLabel: 'Signing you in…',
      backToSignIn: 'Back to sign in',
    },
  },
} as const
