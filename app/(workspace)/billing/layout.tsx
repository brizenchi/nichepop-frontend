import { createAppLayout } from '@/lib/i18n/app-layout'

const { generateMetadata, Layout } = createAppLayout((t) => t.billing)

export { generateMetadata }
export default Layout
