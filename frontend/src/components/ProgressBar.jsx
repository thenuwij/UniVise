
const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
      <div
        className="bg-sky-500 h-2 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
