
// Define strict color parameters to prevent typo bugs in your code
interface StatusDotProps {
  color: 'green' | 'red' | 'blue';
  pulse?: boolean; // Optional parameter to add subtle animation
}

export default function StatusDot({ color, pulse = false }: StatusDotProps) {
  // Map our simple input keywords to their exact custom Tailwind design configurations
  const colorStyles = {
    green: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]",
    red: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]",
    blue: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]",
  };

  return (
    <span 
      className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorStyles[color]} ${
        pulse ? 'animate-pulse' : ''
      }`} 
    />
  );
}
