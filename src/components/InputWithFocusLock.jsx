import React, { useRef, useState, useEffect } from 'react';
import { TextField } from '@mui/material';

// Simplified TextField component with focus lock
const InputWithFocusLock = (props) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Improve focus handling
  useEffect(() => {
    // If the component is marked as focused, ensure it stays focused
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused, props.value]); // Re-apply focus when value changes

  // Simple direct handling of input
  const handleChange = (e) => {
    // Ensure we pass the change to parent
    if (props.onChange) props.onChange(e);
    
    // Set focus flag to true
    setIsFocused(true);
    
    // Make sure input stays focused when typing
    if (inputRef.current) {
      // Save cursor position
      const cursorPosition = e.target.selectionStart;
      
      // After the state update, restore cursor position and focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          try {
            // Try to restore cursor position
            if (cursorPosition !== null) {
              inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
          } catch (error) {
            console.log("Could not set selection range:", error);
          }
        }
      }, 0);
    }
  };
  
  return (
    <TextField
      {...props}
      inputRef={inputRef}
      onFocus={(e) => {
        // Mark as focused
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        // Only mark as unfocused if it's a genuine blur event (not caused by our component)
        // We'll add a small delay to make sure it's not a temporary loss of focus
        setTimeout(() => {
          if (document.activeElement !== inputRef.current) {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }
        }, 100);
      }}
      onChange={handleChange}
      onClick={(e) => {
        // Ensure focus on click
        setIsFocused(true);
        inputRef.current?.focus();
        if (props.onClick) props.onClick(e);
      }}
      InputProps={{
        ...props.InputProps,
        style: {
          ...props.InputProps?.style,
          zIndex: 100,
        }
      }}
      inputProps={{
        ...props.inputProps,
        // Disable autocomplete to avoid browser interference
        autoComplete: 'off',
        // Ensure no spellcheck or other features that might steal focus
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        style: {
          ...props.inputProps?.style,
        }
      }}
      sx={{
        '& .MuiInputBase-root': {
          position: 'relative',
          zIndex: 100,
        },
        '& .MuiInputBase-input': {
          position: 'relative',
          zIndex: 101,
        },
        ...props.sx
      }}
    />
  );
};

export default InputWithFocusLock; 