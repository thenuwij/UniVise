
function GenerateButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-12 py-4 text-xl font-semibold rounded-2xl shadow-lg ${
        !disabled ? "page-button" : "page-button-disabled"
      }`}
    >
      {children}
    </button>
  );
}

export default GenerateButton;
