const Spinner = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

export default Spinner; 