import { Typography } from '@mui/material'
import './Typography.css'
export default function Text({children,className,style}) {
  return (
    <Typography style={style} className={`text ${className}`} >{children}</Typography>
  )
}
