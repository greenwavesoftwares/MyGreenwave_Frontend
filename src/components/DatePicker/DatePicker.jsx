import React, { useState } from "react";
import { Calendar } from 'primereact/calendar';
import './DatePicker.css'; // Import your custom CSS file

const DatePicker = () => {
    const [date, setDate] = useState(null);

    return (
        <div className="date-picker-container">
            <div className="calendar-wrapper">
                <Calendar 
                    value={date} 
                    onChange={(e) => setDate(e.value)} 
                    className="calendar"
                    placeholder="Select a date" // Hint text here
                />
            </div>
        </div>
    )
}

export default DatePicker;
