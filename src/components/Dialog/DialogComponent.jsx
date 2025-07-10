import { Dialog } from "primereact/dialog";
import "./DialogComponent.css";

const CustomDialog = ({
  header,
  visible,
  style,
  onHide,
  children,
  className,
  contentClassName,
  headerClassName
}) => {
  return (
    <>
      <Dialog
        header={header}
        visible={visible}
        style={style}
        onHide={onHide}
      className={`${className} dialogHeader dialogContent`}
        contentClassName={contentClassName}
        headerClassName={headerClassName}
      >
        {children}
      </Dialog>
    </>
  );
};

export default CustomDialog;
