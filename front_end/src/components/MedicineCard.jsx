import MedicineImage from "./MedicineImage.jsx";

function MedicineCard({ medicine, onAddToCart }) {
  return (
    <article className="medicine-card-item">
      <MedicineImage className="medicine-symbol" medicine={medicine} />
      <div className="medicine-detail">
        <h3>{medicine.name}</h3>
        <p>{medicine.shop?.name || "Local pharmacy"}</p>
        <span>{medicine.shop?.address || "Address not provided"}</span>
      </div>
      <div className="medicine-price">
        <strong>{new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "INR",
        }).format(medicine.price)}</strong>
        <span>{medicine.stock > 0 ? "In stock" : "Check availability"}</span>
      </div>
      <button
        aria-label={`Add ${medicine.name} to order`}
        className="add-to-order"
        disabled={medicine.stock < 1}
        onClick={() => onAddToCart(medicine)}
        type="button"
      >
        Add
      </button>
    </article>
  );
}

export default MedicineCard;
