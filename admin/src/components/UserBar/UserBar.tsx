import { useState } from 'react'
import { signOut, useSession } from '../../api/auth.ts'
import { LOGIN_HASH } from '../../lib/hashRoute.ts'
import styles from './UserBar.module.css'

// Top of the sidebar: who is logged in + "Sign out", or a "Log in" link.
export function UserBar() {
  const session = useSession()
  const [signingOut, setSigningOut] = useState(false)

  // Session not known yet (reading localStorage / refreshing the token): keep the
  // bar's height but show nothing, so a logged-in user never sees "Log in" flash.
  if (session === undefined) return <div className={styles.bar} />

  if (session === null) {
    return (
      <div className={styles.bar}>
        <span className={styles.guest}>Not signed in</span>
        {/* a real link: the hash route opens the login page (useIsLoginRoute) */}
        <a className={styles.action} href={LOGIN_HASH}>
          Log in
        </a>
      </div>
    )
  }

  const email = session.user.email ?? 'Unknown user'

  const onSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut() // onAuthStateChange("SIGNED_OUT") re-renders this bar
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.avatar} aria-hidden="true">
        {email[0].toUpperCase()}
      </div>
      <span className={styles.email} title={email}>
        {email}
      </span>
      <button type="button" className={styles.action} onClick={onSignOut} disabled={signingOut}>
        Sign out
      </button>
    </div>
  )
}
