import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const MagneticButton = ({ children, className = '', strength = 50 }) => {
  const buttonRef = useRef(null);
  const boundingRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const button = buttonRef.current;
    boundingRef.current = button.getBoundingClientRect();

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = boundingRef.current;
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      mousePosition.current = {
        x: (clientX - centerX) / strength,
        y: (clientY - centerY) / strength
      };

      gsap.to(button, {
        duration: 0.6,
        x: mousePosition.current.x,
        y: mousePosition.current.y,
        ease: "power3.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        duration: 0.6,
        x: 0,
        y: 0,
        ease: "elastic.out(1, 0.3)"
      });
    };

    const handleResize = () => {
      boundingRef.current = button.getBoundingClientRect();
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [strength]);

  return (
    <div ref={buttonRef} className={`magnetic ${className}`}>
      {children}
    </div>
  );
};

export default MagneticButton; 