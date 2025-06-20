

import { FileUpload } from "primereact/fileupload";
export const CustomeFileUpload = ({ref,name,customUpload,uploadHandler,mode,chooseLabel,accept,maxFileSize,className}) => {
  return (
     <FileUpload
                    ref={ref}
                    name={name}
                    customUpload={customUpload}
                    uploadHandler={uploadHandler}
                    mode={mode}
                    chooseLabel={chooseLabel}
                    accept={accept}
                    maxFileSize={maxFileSize}
                    className={className}
                  />
  )
}

