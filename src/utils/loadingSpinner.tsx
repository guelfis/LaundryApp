export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      {/* Animated Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-500 font-medium tracking-wide">
        Loading...
      </p>
    </div>
  );
}