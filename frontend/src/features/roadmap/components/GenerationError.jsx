function GenerationError({ title, message, onRetry, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary dark:bg-primary px-4 transition-colors duration-300">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold text-primary dark:text-secondary">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="button-primary inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onBack}
            className="button-secondary inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            Back to roadmaps
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerationError;
