import type { collection as Collection } from '@/database/schemas/collection'

export type CollectionProps = typeof Collection.$inferSelect & {
  children: CollectionProps[]
}

export function makeCollectionsTree(
  collections: (typeof Collection.$inferSelect)[],
  parentId: string | null = null
): CollectionProps[] {
  return collections
  .filter((collection) => collection.parentId === parentId)
  .map((collection) => ({
    ...collection,
    children: makeCollectionsTree(collections, collection.id)
  }))
}