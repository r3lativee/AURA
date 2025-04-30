import React, { useRef, useState } from 'react';
import { TextField } from '@mui/material';

// Simplified TextField component with focus lock
const InputWithFocusLock = (props) => {
  const inputRef = useRef(null);
  
  // Simple direct handling of input
  const handleChange = (e) => {
    // Make sure input stays focused when typing
    if (inputRef.current) {
      // Reset cursor position after React rerender
      const cursorPosition = e.target.selectionStart;
      
      // Ensure we pass the change to parent
      if (props.onChange) props.onChange(e);
      
      // After the state update, restore cursor position and focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          try {
            // Try to restore cursor position
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
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
        // Basic focus handler
        if (props.onFocus) props.onFocus(e);
      }}
      onChange={handleChange}
      InputProps={{
        ...props.InputProps,
        // Simple focus styles
        style: {
          ...props.InputProps?.style,
          zIndex: 100,
        }
      }}
      inputProps={{
        ...props.inputProps,
        // Disable autocomplete to avoid browser interference
        autoComplete: 'off',
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