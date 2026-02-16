import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const CartCounter = ({ count,updateExtraMeal,checked }) => {
    const [counter, setCounter] = useState(count);
    const add = () => {
        console.log("Add Clicked");
        setCounter((prev) => prev + 1);
        updateExtraMeal(counter + 1);
    }
    const sub = () => {
        console.log("Sub Clicked");
        if (counter > 0) {
            setCounter((prev) => prev - 1);
            updateExtraMeal(counter - 1);
        }
    }
    

 
  
  return (
    <div className="flex items-center justify-center space-x-3">
      <button
        className="rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        onClick={add}
        style={{
          width: "1.5rem",
          height: "1.5rem",
        }}
        disabled={!checked}
      >
        <Plus size={16} />
      </button>
      <div
        className="border-2 border-slate-200 rounded-lg flex items-center justify-center"
        style={{
          width: "2.5rem",
          height: "2rem",
        }}
      >
        <span className="text-sm font-semibold text-slate-800">{counter}</span>
      </div>

      <button
        className="rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        onClick={sub}
        style={{
          width: "1.5rem",
          height: "1.5rem",
        }}
        disabled={!checked}
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

export default CartCounter;
