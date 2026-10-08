import type { ReactNode } from 'react'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  // a chat is open: on phones show the chat instead of the list
  mainActive: boolean
}

// Page frame only: decides where the columns go, not what is inside them.
export function AppLayout({ sidebar, main, mainActive }: AppLayoutProps) {
  return (
    <div className={mainActive ? `${styles.layout} ${styles.mainActive}` : styles.layout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.main}>{main}</main>
    </div>
  )
}
