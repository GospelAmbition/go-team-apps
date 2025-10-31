export default defineAppConfig({
  ui: {
    primary: 'neutral',
    gray: 'neutral',
    card: {
      background: 'bg-white dark:bg-gray-900',
      ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
      rounded: 'rounded-lg',
      shadow: 'shadow',
      body: {
        base: 'bg-white dark:bg-gray-900',
        background: 'bg-white dark:bg-gray-900',
        padding: 'p-4 sm:p-6'
      },
      header: {
        base: '',
        background: 'bg-white dark:bg-gray-900',
        padding: 'px-4 py-5 sm:px-6'
      }
    }
  }
})
