import { formatDayLabel } from '../../lib/format.ts'
import styles from './DateSeparator.module.css'

// "Today" / "Yesterday" / "September 21" pill shown above the first message of each day
export function DateSeparator({ date }: { date: Date }) {
  return (
    <div className={styles.separator}>
      <span className={styles.pill}>{formatDayLabel(date)}</span>
    </div>
  )
}
