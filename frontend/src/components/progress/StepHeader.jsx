function StepHeader({ title, subtitle }) {
  return (
    <div className="mt-8 mb-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h2>
      <p className="text-base text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>
    </div>
  );
}

export default StepHeader;
