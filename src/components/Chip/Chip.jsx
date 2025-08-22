import { Chip } from '@mui/material'
import './Chip.scss'
export default function CustomChip({label, size, style , className,color,variant}) {
  return (
    <Chip label={label} size={size} style={style} className={`chip-info ${className}`} color={color} variant={variant}/>
  )
}
