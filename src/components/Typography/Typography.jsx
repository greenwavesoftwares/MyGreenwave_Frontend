import { Typography } from '@mui/material'

export default function Text({children,className,style}) {
  return (
    <Typography style={style} className={`${className} text`} >{children}</Typography>
  )
}
