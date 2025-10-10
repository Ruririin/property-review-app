import { useState } from 'react';

export const useImageHandlerMinimal = () => {
  console.log('🔧 useImageHandlerMinimal called');
  const [test, setTest] = useState('working');
  console.log('🔧 useState worked, value:', test);
  
  return {
    test,
    setTest
  };
};
