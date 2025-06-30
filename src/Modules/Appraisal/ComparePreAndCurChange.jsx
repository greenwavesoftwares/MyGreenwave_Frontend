import React, { useEffect, useState } from 'react';
export default function ComparePreAndCurChange({ data }) {

   
  

const [history,setHistory]=useState({prevCount:null,finalCount:null,hasChanged:false});

useEffect(()=>
{
    if(data.length>=0 && history.prevCount===0)
    {
        console.log('No rows');
        setHistory({...history,prevCount:data.length+1,hasChanged:false});
    }
   else
   {
    setHistory({...history,finalCount:data.length,hasChanged:true});
   }
    

},[data])
  // Compare current data to initialData
  const hasChanged = history.finalCount> history.prevCount
//   debugger;
 console.log("initialData",data);

  return (
    <>
      {hasChanged ? <div>Change Value</div> : 'No Change Value'}
    </>
  );
}

