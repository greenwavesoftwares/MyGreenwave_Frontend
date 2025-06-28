
import { Calendar } from 'primereact/calendar';
        


export const CustomeCalender = ({maxDate,minDate,onChange,value,disabled=false,className}) => {
  return (
 
  
   <Calendar value={value} onChange={onChange} minDate={minDate} maxDate={maxDate} disabled={disabled} className={className}   showIcon     dateFormat="dd-mm-yy"  panelClassName="text-xs"/>
  )
}

