import { defineMigration, del } from 'sanity/migrate'

export default defineMigration({
  title: 'Delete documents of specific type',
  documentTypes: ['subject'],

  migrate: {
    document(doc) {
      return del(doc._id)
    },
  },
})
