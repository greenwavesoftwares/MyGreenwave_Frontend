import { useState } from "react";
import { FileUpload } from "primereact/fileupload";
import CustomButton from "../../components/Button/Button";
import CameraCapture from "./CameraCapture";
import { bundleFiles } from "./claimFileUtils";

/**
 * Upload picker (multi-file) + full-screen camera.
 *  - "Upload": pick one or many files (several are bundled into one ZIP).
 *  - Camera: opens the full-screen CameraCapture. Photos are only collected
 *    there; onSelect(file) is called ONCE when the user confirms, so nothing
 *    uploads or refreshes while photos are being taken.
 */
const ClaimFileInput = ({
  onSelect,
  onReject,
  prefix = "claim",
  chooseLabel = "Upload",
  className,
  maxFileSize = 1000000000,
}) => {
  const [cameraVisible, setCameraVisible] = useState(false);

  const submit = async (files) => {
    if (!files.length) return;
    if (files.some((f) => f.type?.startsWith("video/"))) {
      onReject?.("Videos are not allowed.");
      return;
    }
    const file = await bundleFiles(files, prefix);
    await onSelect(file);
  };

  return (
    <div className="flex items-center gap-2">
      <FileUpload
        mode="basic"
        name="file"
        accept="*/*"
        multiple
        auto
        customUpload
        uploadHandler={(e) => {
          const files = [...(e.files || [])];
          e.options?.clear?.(); // lets the same file be chosen again
          submit(files);
        }}
        maxFileSize={maxFileSize}
        chooseLabel={chooseLabel}
        className={className}
      />

      <CustomButton
        icon="pi pi-camera"
        className="p-button-sm p-button-outlined"
        tooltip="Capture using camera"
        tooltipOptions={{ position: "top" }}
        onClick={() => setCameraVisible(true)}
      />

      <CameraCapture
        visible={cameraVisible}
        onHide={() => setCameraVisible(false)}
        fileNamePrefix={prefix}
        onCapture={(file) => onSelect(file)}
        onReject={(msg) => onReject?.(msg)}
      />
    </div>
  );
};

export default ClaimFileInput;
