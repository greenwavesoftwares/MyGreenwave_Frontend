import { Dialog } from "primereact/dialog";
import "./DialogComponent.css";

const CustomDialog = ({
  header,
  visible,
  style,
  onHide,
  children,
  className,
}) => {
  return (
    <>
      <Dialog
        header={header}
        visible={visible}
        style={style}
        onHide={onHide}
        className={className}
      >
        {children}
      </Dialog>
    </>
  );
};

export default CustomDialog;
