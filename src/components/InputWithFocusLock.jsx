import React, { useRef, useState, useEffect } from 'react';
import { TextField } from '@mui/material';

// Custom TextField component that maintains focus during typing
const InputWithFocusLock = (props) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const focusTimeoutRef = useRef(null);
  
  // Handle focus event
  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
    
    // Clear any existing timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
  };
  
  // Handle blur event with delay
  const handleBlur = (e) => {
    // Don't let the input blur immediately
    e.preventDefault();
    
    // Set a timeout to actually blur after 4 seconds of inactivity
    focusTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      if (props.onBlur) props.onBlur(e);
    }, 4000);
  };
  
  // Intercept change event to maintain focus
  const handleChange = (e) => {
    // Reset the blur timeout on each keystroke
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Set new timeout - will blur after 4 seconds of no typing
    focusTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 4000);
    
    // Ensure input stays focused
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
    
    // Pass the change event to parent handler
    if (props.onChange) props.onChange(e);
  };
  
  // Keep focus when value changes programmatically
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [props.value, isFocused]);
  
  // Handle keyup to reset focus timer
  const handleKeyUp = (e) => {
    // Reset the timer on keyup too
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Set new timeout
    focusTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 4000);
    
    if (props.onKeyUp) props.onKeyUp(e);
  };
  
  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <TextField
      {...props}
      inputRef={inputRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyUp={handleKeyUp}
      InputProps={{
        ...props.InputProps,
        // Add special styles to prevent focus loss
        style: {
          ...props.InputProps?.style,
          willChange: 'auto',
        }
      }}
      inputProps={{
        ...props.inputProps,
        // Prevent input from losing focus
        autoComplete: 'off',
        onMouseDown: (e) => {
          // Prevent losing focus when clicking within the input
          if (isFocused) {
            e.preventDefault();
            inputRef.current.focus();
          }
          if (props.inputProps?.onMouseDown) props.inputProps.onMouseDown(e);
        }
      }}
    />
  );
};

export default InputWithFocusLock; 