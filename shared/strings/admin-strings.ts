import type { AchievementMetric } from '../config/achievements'
import type { FlagStatus } from '../types/flags.types'

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
  accessTitle: 'Admin access',
  accessHint:
    'Admin actions are locked. Enter the six-digit code from your authenticator app to unlock them for ten minutes.',
  accessCodeLabel: 'Access code',
  accessUnlock: 'Unlock',
  accessUnlocked: 'Admin actions are unlocked for ten minutes.',
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
} as const
