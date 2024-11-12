'use client'
import { useState } from 'react';

export default function IncrementCounter() {
  // State for the counter
  const [counter, setCounter] = useState<number>(0);
  
  // State for the input field
  const [incrementValue, setIncrementValue] = useState<number>(1);

  // Function to increment the counter by the input value
  const handleIncrement = () => {
    setCounter(counter + incrementValue);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setIncrementValue(isNaN(value) ? 0 : value);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      
      <input
        type="number"
        value={incrementValue}
        onChange={handleInputChange}
        placeholder="Enter number"
        style={{ marginRight: '10px', padding: '5px' }}
        />
      
      <button onClick={handleIncrement} style={{ padding: '5px 10px' }}>
        Increment
      </button>
        <p>Count: {counter}</p>
    </div>
  );
}
