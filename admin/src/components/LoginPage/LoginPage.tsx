import { useState, type FormEvent } from 'react'
import { signIn } from '../../api/auth.ts'
import styles from './LoginPage.module.css'

// Full-screen email + password form. App shows it whenever nobody is logged in;
// after a successful login App switches to the chats by itself.
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() // no page reload; supabase-js does the request
    setError(null)
    setPending(true)
    try {
      await signIn(email.trim(), password)
      // onAuthStateChange("SIGNED_IN") → App renders the chats instead of this page
    } catch (err) {
      // Supabase says "Invalid login credentials" for both a wrong email and a
      // wrong password, so the form does not reveal which accounts exist.
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Enter your email and password.</p>

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
