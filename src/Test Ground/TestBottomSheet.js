import { useState } from "react";
import BottomSheet from "./shared/BottomSheet";

function TestBottomSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Sheet</button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Test Sheet">
        <div style={{ padding: 20 }}>Hello mobile world!</div>
      </BottomSheet>
    </>
  );
}