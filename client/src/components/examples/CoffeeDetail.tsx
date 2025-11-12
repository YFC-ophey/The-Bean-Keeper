import { useState } from "react";
import CoffeeDetail from "../CoffeeDetail";
import { Button } from "@/components/ui/button";
import coffeeImage from "@assets/generated_images/Specialty_coffee_bag_brown_70802fba.png";

export default function CoffeeDetailExample() {
  const [open, setOpen] = useState(false);

  const mockEntry = {
    id: "1",
    photoUrl: coffeeImage,
    roasterName: "Stumptown Coffee Roasters",
    roasterLocation: "Portland, OR",
    roasterAddress: "128 SW 3rd Ave, Portland, OR 97204",
    roasterWebsite: "https://www.stumptowncoffee.com",
    farm: "Finca El Puente",
    origin: "Colombia",
    variety: "Bourbon",
    processMethod: "Washed",
    roastDate: "2024-01-10",
    flavorNotes: ["Dark Chocolate", "Caramel", "Orange"],
    rating: 4,
    tastingNotes: "Rich and balanced with notes of dark chocolate and a hint of citrus. Perfect for morning brewing.",
    createdAt: new Date("2024-01-15"),
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>View Coffee Details</Button>
      <CoffeeDetail entry={mockEntry} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
