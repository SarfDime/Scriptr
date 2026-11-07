import type { AchievementMetric } from '../config/achievements'
import {
  type AdminProfileSortField,
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
} from '../config/shared-constants'
import type { FlagStatus } from '../types/flags.types'
import type { UserRole } from '../types/profile.types'
import type { SortDirection } from '../utils/array-utils/sort'

const ordinal = (number: number) => {
  let suffix = 'th'
  if (number % 100 < 11 || number % 100 > 13) {
    if (number % 10 === 1) suffix = 'st'
    else if (number % 10 === 2) suffix = 'nd'
    else if (number % 10 === 3) suffix = 'rd'
  }
  return `${number}${suffix}`
}

export const ADMIN_STRINGS = {
  nav: 'Admin',
  title: 'Administration',
  flagsTitle: 'Flag queue',
  restrictionsTitle: 'Restrictions',
  ratingTypesTitle: 'Rating types',
  achievementDefinitionsTitle: 'Achievements',
  usersTitle: 'Users',
  announcementsTitle: 'Announcements',
  accessTitle: 'Admin access',
  accessHint:
    'Admin actions are locked. Enter the six-digit code from your authenticator app to unlock them for 20 minutes.',
  accessCodeLabel: 'Access code',
  accessUnlock: 'Unlock',
  accessUnlocked: 'Admin actions are unlocked for 20 minutes.',
  accessExpired: 'Admin access expired. Enter a new code to continue.',
  accessRejected: 'That code was not accepted. Wait for the next one.',
  accessRateLimited: 'Too many attempts. Wait a few minutes and try again.',
  accessUnavailable: "Couldn't reach the API. Try again.",
  loadError: "Couldn't load this administration page.",
  updateError: "Couldn't complete that action.",
  retry: 'Try again',
  emptyFlags: 'No flags match this status.',
  emptyRestrictions: 'No restriction records.',
  emptyRatingTypes: 'No rating types have been created.',
  statusLabel: 'Status',
  statusNames: {
    pending: 'Pending',
    reviewed: 'Reviewed',
    dismissed: 'Dismissed',
  } satisfies Record<FlagStatus, string>,
  targetKindNames: {
    script: 'Script',
    comment: 'Comment',
    user: 'User',
  },
  reporter: 'Reporter',
  submittedBy: 'Submitted by',
  submittedAt: 'Submitted at',
  markReviewed: 'Mark reviewed',
  dismissFlag: 'Dismiss flag',
  markAllReviewed: 'Mark all reviewed',
  dismissAllFlags: 'Dismiss all',
  deleteTarget: 'Delete target',
  restrictUser: 'Restrict user',
  restrictAuthor: 'Restrict target author',
  confirmDeleteTargetTitle: 'Delete reported content?',
  confirmDeleteTarget: (target: string) =>
    `Delete ${target}? This action cannot be undone.`,
  restrictionReason: 'Reason',
  reasonValidation: 'Enter a reason between 3 and 500 characters.',
  username: 'Username',
  profileLookup: 'Restrict by username',
  lookupError: 'No matching user was found.',
  currentRestriction: 'This user is already actively restricted.',
  activeRestrictionReasonOnly:
    'Only the reason will change. The existing expiry will be preserved.',
  noTarget: 'Target is unavailable.',
  unknownUser: 'Unknown user',
  loadRestrictionsError: "Couldn't load restrictions.",
  applyRestriction: 'Apply restriction',
  updateRestrictionReason: 'Update reason',
  restrictionReasonLabel: (count: number) => {
    const number = count + 1
    let duration = 'permanent'
    if (number === 1) duration = '2 weeks'
    else if (number === 2) duration = '1 month'
    return `${ordinal(number)} restriction: ${duration}`
  },
  active: 'Active',
  lapsed: 'Lapsed',
  lifted: 'Lifted',
  liftedOn: 'Lifted',
  activeRestrictionsTitle: 'Active',
  lapsedRestrictionsTitle: 'Expired',
  liftedRestrictionsTitle: 'Lifted early',
  restrictedBy: 'Restricted by',
  expires: 'Until',
  permanent: 'Permanent',
  liftRestriction: 'Lift restriction',
  confirmLiftTitle: 'Lift this restriction?',
  confirmLift: (username: string) =>
    `Lift the active restriction for ${username}?`,
  createRatingType: 'Create rating type',
  ratingTypeId: 'ID (lowercase snake_case)',
  targetType: 'Target type',
  professor: 'Professor',
  professorRatingTypes: 'Professor ratings',
  subjectRatingTypes: 'Subject ratings',
  subject: 'Subject',
  label: 'Label',
  save: 'Save',
  cancel: 'Cancel',
  rename: 'Rename',
  delete: 'Delete',
  confirmDeleteRatingTypeTitle: 'Delete rating type?',
  confirmDeleteRatingType: (label: string) =>
    `Delete “${label}”? This action cannot be undone.`,
  ratingTypeIdValidation:
    'Use 2 to 40 lowercase letters, numbers or underscores.',
  labelValidation: 'Enter a label between 2 and 60 characters.',
  ratingTypeInUse:
    'This rating type cannot be deleted because existing ratings still reference it.',
  emptyAchievementDefinitions: 'No achievements have been created.',
  createAchievementDefinition: 'Create achievement',
  achievementNotice:
    'Users receive a new or lowered-threshold achievement the next time they take a qualifying action. Achievements are never revoked.',
  achievementId: 'ID (lowercase snake_case)',
  achievementIdValidation:
    'Use 2 to 60 lowercase letters, numbers or underscores.',
  achievementCopyField: 'Wording',
  achievementCopyManaged:
    'Titles and descriptions live in ACHIEVEMENT_COPY (shared/config/achievements.ts), so the badge, the admin list and notifications all change with the code.',
  achievementCopyMissing:
    'This id has no wording yet. Add it to ACHIEVEMENT_COPY in shared/config/achievements.ts first, otherwise it cannot be created.',
  achievementMetric: 'Metric',
  achievementMetricNames: {
    scripts_uploaded: 'Scripts uploaded',
    comments_posted: 'Comments posted',
    total_script_votes: 'Votes on your scripts',
    total_script_downloads: 'Downloads of your scripts',
  } satisfies Record<AchievementMetric, string>,
  achievementThreshold: 'Threshold',
  achievementThresholdValidation: 'Enter a whole number greater than 0.',
  achievementThresholdValue: (threshold: number) => `Threshold: ${threshold}`,
  achievementRarity: 'Rarity',
  achievementPreview: 'Badge preview',
  edit: 'Edit',
  confirmDeleteAchievementTitle: 'Delete achievement?',
  confirmDeleteAchievement: (title: string) =>
    `Delete “${title}”? This action cannot be undone.`,
  achievementInUse:
    'This achievement cannot be deleted because users have already earned it.',
  achievementIdTaken: 'An achievement with this ID already exists.',

  /** Admin user manager. */
  usersLoadError: "Couldn't load users.",
  usersEmpty: 'No users match these filters.',
  usersSearchLabel: 'Search users',
  usersSearchPlaceholder: 'Username or full name',
  usersSearchSubmit: 'Search',
  usersRoleFilter: 'Role',
  usersAllRoles: 'All roles',
  usersSortLabel: 'Sort by',
  usersSortNames: {
    created_at: 'Joined',
    updated_at: 'Last updated',
    username: 'Username',
    full_name: 'Name',
    role: 'Role',
  } satisfies Record<AdminProfileSortField, string>,
  usersOrderLabel: 'Direction',
  usersOrderNames: {
    asc: 'Ascending',
    desc: 'Descending',
  } satisfies Record<SortDirection, string>,
  usersRoleNames: {
    student: 'Student',
    moderator: 'Moderator',
    admin: 'Admin',
  } satisfies Record<UserRole, string>,
  usersPageRange: (from: number, to: number, total: number) =>
    `Showing ${from}–${to} of ${total}`,
  usersPreviousPage: 'Previous',
  usersNextPage: 'Next',
  usersJoined: 'Joined',
  usersUpdated: 'Updated',
  usersView: 'View details',
  usersDetailTitle: 'User details',
  usersDetailScripts: 'Scripts',
  usersDetailComments: 'Comments',
  usersDetailFaculties: 'Faculties',
  usersDetailStudies: 'Studies',
  usersDetailNone: 'None selected',
  usersEditTitle: 'Edit user',
  usersEditUsername: 'Username',
  usersEditFullName: 'Full name',
  usersEditRole: 'Role',
  usersEditSaved: 'User updated.',
  usersUsernameTaken: 'That username is already taken.',
  usersDeleteTitle: 'Delete this user?',
  usersDeleteConfirm: (username: string) =>
    `Delete @${username}? Their profile, avatar and login are removed. This cannot be undone.`,
  usersDeleted: 'User deleted.',
  usersDeleteLoginWarning:
    'The profile was removed, but its login could not be deleted. Remove it from Supabase Auth.',
  usersDeleteSelf: 'You cannot delete your own account.',
  /** Announcement broadcast. */
  announcementIntro:
    'Sends one notification to every account. It appears in each notification tray on its next refresh.',
  announcementTitleLabel: 'Title',
  announcementBodyLabel: 'Message (optional)',
  announcementSend: 'Send to everyone',
  announcementConfirmTitle: 'Send this to every user?',
  announcementConfirm: (title: string) =>
    `“${title}” is delivered to every account and cannot be recalled.`,
  announcementSent: (recipients: number) =>
    `Announcement sent to ${recipients} ${recipients === 1 ? 'user' : 'users'}.`,
  announcementTitleValidation: `Enter a title of at most ${ANNOUNCEMENT_TITLE_MAX_LENGTH} characters.`,
  announcementBodyValidation: `Keep the message under ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters.`,
} as const
