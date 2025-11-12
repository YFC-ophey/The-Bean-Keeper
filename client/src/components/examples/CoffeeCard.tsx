import CoffeeCard from "../CoffeeCard";
import coffeeImage from "@assets/generated_images/Craft_coffee_bag_minimal_a5d94523.png";

export default function CoffeeCardExample() {
  const mockEntry = {
    id: "1",
    photoUrl: coffeeImage,
    roasterName: "Blue Bottle Coffee",
    roasterLocation: "Oakland, CA",
    roasterAddress: null,
    roasterWebsite: null,
    farm: "Finca El Puente",
    origin: "Ethiopia",
    variety: "Heirloom",
    processMethod: "Washed",
    roastDate: "2024-01-15",
    flavorNotes: ["Blueberry", "Jasmine", "Citrus"],
    rating: 5,
    tastingNotes: "Bright and complex with amazing floral notes",
    createdAt: new Date("2024-01-20"),
  };

  return (
    <div className="max-w-sm">
      <CoffeeCard entry={mockEntry} onClick={() => console.log("Card clicked")} />
    </div>
  );
}
