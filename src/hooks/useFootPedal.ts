import { useEffect, useCallback, useRef } from "react";

interface HIDFootPedalConfig {
  onLeftPedal?: (isPressed: boolean) => void;
  onRightPedal?: (isPressed: boolean) => void;
  onMiddlePedal?: (isPressed: boolean) => void;
  enabled?: boolean;
}

let globalIsConnected = false;

export const useFootPedal = ({
  onLeftPedal,
  onRightPedal,
  onMiddlePedal,
  enabled = true,
}: HIDFootPedalConfig) => {
  const lastHIDEventTime = useRef<number>(0);
  const isProcessing = useRef(false);
  const lastStates = useRef({ left: false, right: false, middle: false });

  const handleHIDData = useCallback(
    (data: number[]) => {
      if (!enabled || isProcessing.current) return;

      const now = Date.now();
      if (now - lastHIDEventTime.current < 200) {
        return;
      }

      isProcessing.current = true;
      lastHIDEventTime.current = now;

      const buttonState = data[2];
      
      const rightPressed = (buttonState & 0x01) !== 0;
      const middlePressed = (buttonState & 0x02) !== 0;
      const leftPressed = (buttonState & 0x04) !== 0;

      if (leftPressed !== lastStates.current.left) {
        onLeftPedal?.(leftPressed);
        lastStates.current.left = leftPressed;
      }

      if (middlePressed !== lastStates.current.middle) {
        onMiddlePedal?.(middlePressed);
        lastStates.current.middle = middlePressed;
      }

      if (rightPressed !== lastStates.current.right) {
        onRightPedal?.(rightPressed);
        lastStates.current.right = rightPressed;
      }

      setTimeout(() => {
        isProcessing.current = false;
      }, 200);
    },
    [enabled, onLeftPedal, onRightPedal, onMiddlePedal]
  );

  const handleMouseEvent = useCallback((event: MouseEvent) => {
    const timeSinceLastHID = Date.now() - lastHIDEventTime.current;
    if (timeSinceLastHID < 200) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const options = { capture: true, passive: false };
    window.addEventListener("mousedown", handleMouseEvent, options);
    window.addEventListener("mouseup", handleMouseEvent, options);
    window.addEventListener("click", handleMouseEvent, options);
    window.addEventListener("contextmenu", handleMouseEvent, options);

    const setupConnection = async () => {
      if (globalIsConnected) return;

      try {
        const devices = await window.electron.hid.list();
        const footpedal = devices.find(d => 
          d.vendorId === 1972 && 
          d.productId === 607
        );

        if (footpedal) {
          await window.electron.hid.connect(footpedal.vendorId, footpedal.productId);
          globalIsConnected = true;
          window.electron.hid.onData(handleHIDData);
        }
      } catch (error) {
        console.error('Failed to connect to footpedal:', error);
      }
    };

    setupConnection();

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
  }, [enabled, handleHIDData, handleMouseEvent]);
};
