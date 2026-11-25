import { useEffect, useRef } from "react";
import "./Wheel.css";

const ROW_HEIGHT = 54;

interface Props {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  /** Shown after the selected value, for example "min". */
  unit?: string;
  label: string;
}

/**
 * A picker wheel. It is a real scrolling list with scroll snapping, so the
 * momentum and bounce are the platform's own. The value is whichever row sits
 * in the middle.
 */
export function Wheel({ values, value, onChange, format = String, unit, label }: Props) {
  const list = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, values.indexOf(value));
  const hasScrolled = useRef(false);

  // Bring the selected row to the middle: on open, and when the value is set
  // from outside (a shortcut). Scrolling by hand already leaves it in place.
  useEffect(() => {
    const element = list.current;
    if (!element) return;

    const behavior = hasScrolled.current ? "smooth" : "auto";
    hasScrolled.current = true;

    let frame = 0;
    const align = () => {
      // Inside a sheet that is still opening the list has no size yet: try again.
      if (element.clientHeight === 0) {
        frame = requestAnimationFrame(align);
        return;
      }
      if (Math.round(element.scrollTop / ROW_HEIGHT) === selectedIndex) return;
      element.scrollTo({ top: selectedIndex * ROW_HEIGHT, behavior });
    };
    align();

    return () => cancelAnimationFrame(frame);
  }, [selectedIndex]);

  function onScroll() {
    const element = list.current;
    if (!element) return;
    const index = Math.round(element.scrollTop / ROW_HEIGHT);
    const next = values[Math.min(values.length - 1, Math.max(0, index))];
    if (next !== value) onChange(next);
  }

  return (
    <div
      ref={list}
      className="wheel display"
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
    >
      {values.map((option, index) => {
        const distance = Math.min(2, Math.abs(index - selectedIndex));
        return (
          <div
            key={option}
            className="wheel-row"
            data-distance={distance}
            role="option"
            aria-selected={distance === 0}
            onClick={() => onChange(option)}
          >
            <span className="wheel-value">{format(option)}</span>
            {distance === 0 && unit && <span className="wheel-unit">{unit}</span>}
          </div>
        );
      })}
    </div>
  );
}
