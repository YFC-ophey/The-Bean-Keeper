import { useState } from "react";
import RatingModal from "../RatingModal";
import { Button } from "@/components/ui/button";

export default function RatingModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Rating Modal</Button>
      <RatingModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(rating, notes) => {
          console.log("Rating saved:", rating, notes);
          setOpen(false);
        }}
        roasterName="Blue Bottle Coffee"
      />
    </div>
  );
}
