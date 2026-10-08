import type { Client } from '../../api/types.ts'
import { avatarColor, clientInitials } from '../../lib/format.ts'
import styles from './Avatar.module.css'

interface AvatarProps {
  client: Client
  size?: number
}

// Round avatar with initials. Clients have no photo in the database, so it is always letters.
export function Avatar({ client, size = 54 }: AvatarProps) {
  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        backgroundColor: avatarColor(client.id),
      }}
      aria-hidden="true"
    >
      {clientInitials(client)}
    </div>
  )
}
