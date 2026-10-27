import { useState } from 'react'
import { signOut, useSession } from '../../api/auth.ts'
import styles from './UserBar.module.css'

// Top of the sidebar: who is logged in + "Sign out". The panel is only rendered
// for a logged-in user (see App), so there is no logged-out state here.
export function UserBar() {
  const session = useSession()
  const [signingOut, setSigningOut] = useState(false)

  if (!session) return null

  const email = session.user.email ?? 'Unknown user'

  const onSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut() // onAuthStateChange("SIGNED_OUT") → App shows the login form
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
