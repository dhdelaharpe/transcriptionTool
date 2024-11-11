import { useEffect, useCallback, useRef } from "react";

interface HIDFootPedalConfig {
  onLeftPedal?: (isPressed: boolean) => void;
  onRightPedal?: (isPressed: boolean) => void;
  onMiddlePedal?: (isPressed: boolean) => void;
  enabled?: boolean;
}

// Create a singleton connection state outside the hook
let globalIsConnected = false;

export const useFootPedal = ({
  onLeftPedal,
  onRightPedal,
  onMiddlePedal,
  enabled = true,
}: HIDFootPedalConfig) => {
  const lastHIDEventTime = useRef<number>(0);
  const lastState = useRef({ left: false, right: false, middle: false });

  const handleHIDData = useCallback(
    (data: number[]) => {
      if (!enabled) return;

      console.log('Raw HID Data:', {
        data,
        hex: data.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
      });

      // Update last HID event time
      lastHIDEventTime.current = Date.now();

      // The third byte (index 2) contains the button state
      const buttonState = data[2];
      console.log('Button State:', buttonState);

      // Check button states
      const  rightPressed= (buttonState & 0x01) !== 0;
      const  middlePressed= (buttonState & 0x02) !== 0;
      const  leftPressed= (buttonState & 0x04) !== 0;

      console.log('Pedal States:', { leftPressed, rightPressed, middlePressed });

      if (onLeftPedal) onLeftPedal(leftPressed);
      if (onRightPedal) onRightPedal(rightPressed);
      if (onMiddlePedal) onMiddlePedal(middlePressed);

      // Update last state
      lastState.current = { left: leftPressed, right: rightPressed, middle: middlePressed };
    },
    [enabled, onLeftPedal, onRightPedal, onMiddlePedal]
  );

  // Prevent mouse events that occur immediately after HID events
  const handleMouseEvent = useCallback((event: MouseEvent) => {
    const timeSinceLastHID = Date.now() - lastHIDEventTime.current;

    // If this mouse event occurred within 50ms of an HID event, it's from the footpedal
    if (timeSinceLastHID < 50) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || globalIsConnected) return;

    const connect = async () => {
      try {
        console.log('Attempting to connect to footpedal...');
        const devices = await window.electron.hid.list();
        console.log('Available HID devices:', devices);
        
        const footpedal = devices.find(d => 
          d.vendorId === 1972 && 
          d.productId === 607
        );

        if (footpedal && !globalIsConnected) {
          console.log('Found footpedal, connecting...');
          await window.electron.hid.connect(footpedal.vendorId, footpedal.productId);
          console.log('Footpedal connected successfully');
          globalIsConnected = true;
        }
      } catch (error) {
        console.error('Failed to connect to footpedal:', error);
      }
    };

    // Add event listeners to prevent mouse events
    const options = { capture: true, passive: false };
    window.addEventListener("mousedown", handleMouseEvent, options);
    window.addEventListener("mouseup", handleMouseEvent, options);
    window.addEventListener("click", handleMouseEvent, options);
    window.addEventListener("contextmenu", handleMouseEvent, options);

    connect();
    window.electron.hid.onData(handleHIDData);

    return () => {
      window.removeEventListener("mousedown", handleMouseEvent, options);
      window.removeEventListener("mouseup", handleMouseEvent, options);
      window.removeEventListener("click", handleMouseEvent, options);
      window.removeEventListener("contextmenu", handleMouseEvent, options);

      if (globalIsConnected && !document.querySelector('[data-audio-controls]')) {
        window.electron.hid.disconnect().catch(console.error);
        globalIsConnected = false;
      }
    };
  }, [enabled]);
};
