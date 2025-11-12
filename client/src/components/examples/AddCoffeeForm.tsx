import AddCoffeeForm from "../AddCoffeeForm";

export default function AddCoffeeFormExample() {
  return (
    <div className="max-w-2xl">
      <AddCoffeeForm
        onSubmit={(data) => console.log("Form submitted:", data)}
        onCancel={() => console.log("Form cancelled")}
      />
    </div>
  );
}
