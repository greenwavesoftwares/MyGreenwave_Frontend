import { format } from 'date-fns';
import { getDataOnLoad } from './LeaveManagementAPI';

const getCurrentDate=()=>{
    const currentDate=new Date();
    return currentDate;
}

const onLoad=async()=>{
    getDataOnLoad();
}

export {getCurrentDate,onLoad}