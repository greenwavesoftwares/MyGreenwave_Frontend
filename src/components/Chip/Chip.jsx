import { Chip } from '@mui/material'
import './Chip.scss'
export default function CustomChip({label, size, style , className}) {
  return (
    <Chip label={label} size={size} style={style} className={`chip-info ${className}`}/>
  )
}
