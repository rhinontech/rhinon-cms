import React from "react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Loader;
