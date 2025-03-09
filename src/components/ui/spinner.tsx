import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Spinner = ({ className, size = "md" }: SpinnerProps) => {
  const sizeClass = 
    size === "sm" ? "h-4 w-4" : 
    size === "lg" ? "h-8 w-8" : 
    "h-6 w-6";
  
  return (
    <div 
      className={cn("animate-spin rounded-full border-t-2 border-primary", sizeClass, className)}
      aria-label="Loading"
    ></div>
  );
};

export default Spinner; 