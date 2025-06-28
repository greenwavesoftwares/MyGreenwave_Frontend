import React from 'react'

export const Dropdown = ({claimOptions,claimType,setClaimType,placehonder,className}) => {
  return (
    <Dropdown
                claimOptions={claimOptions}
                claimType={claimType}
                setClaimType={setClaimType}
                placehonder={placehonder}
                className={className}
    />
  )
}

export const CustomDropDown =({inputId,placeholder,panelClassName,dropdownIcon,value,options,onChange,className})=>{
  return(
                         <Dropdown
                              inputId={inputId}
                               className={className}
                              panelClassName={panelClassName}
                              dropdownIcon={dropdownIcon}
                              value={value}
                              options={options}
                              onChange={onChange}
                              placeholder={placeholder}
                            />
  )
}