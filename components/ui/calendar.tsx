"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

interface BookingCalendarProps {
  selectedDate?: Date;
  onChange?: (date: Date) => void;
  availableDates?: string[];
}

export function BookingCalendar({
  selectedDate: propSelectedDate,
  onChange,
  availableDates = [],
}: BookingCalendarProps) {
  // Use dayjs for consistent date handling
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));

  // Convert propSelectedDate to dayjs date for internal use
  const [, setSelectedDate] = useState(
    propSelectedDate ? dayjs(propSelectedDate).date() : dayjs().date()
  );

  // Also store the full selected dayjs object for accurate comparisons
  const [selectedDayjs, setSelectedDayjs] = useState(
    propSelectedDate ? dayjs(propSelectedDate) : dayjs()
  );

  // Update internal state when prop changes
  useEffect(() => {
    if (propSelectedDate) {
      const propDateDayjs = dayjs(propSelectedDate);
      setSelectedDate(propDateDayjs.date());
      setSelectedDayjs(propDateDayjs);
      setCurrentMonth(propDateDayjs.startOf("month"));
    }
  }, [propSelectedDate]);

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  const handleDateSelection = (day: number) => {
    // Create a new date object for the selected day in the current month
    const newDateDayjs = currentMonth.date(day);
    setSelectedDate(day);
    setSelectedDayjs(newDateDayjs);

    // Call the onChange handler if provided
    if (onChange) {
      onChange(newDateDayjs.toDate());
    }
  };

  // Disable past dates (can't book appointments in the past)
  const isPastDate = (day: number) => {
    const date = currentMonth.date(day);
    return date.isBefore(dayjs().startOf("day"));
  };

  // Check if a day is available for booking
  const isDateAvailable = (day: number) => {
    // If no available dates provided, all future dates are considered available
    if (!availableDates || availableDates.length === 0) return true;
    
    // Create a date string in YYYY-MM-DD format for comparison
    const date = currentMonth.date(day);
    const dateString = date.format('YYYY-MM-DD');
    
    // Check if this date is in the available dates array
    return availableDates.includes(dateString);
  };

  // Check if a day is the selected date (considering month and year)
  const isSelectedDay = (day: number) => {
    return (
      selectedDayjs.date() === day &&
      selectedDayjs.month() === currentMonth.month() &&
      selectedDayjs.year() === currentMonth.year()
    );
  };

  return (
    <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">
          {currentMonth.format("MMMM YYYY")}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-1 border rounded hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 border rounded hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-gray-500 text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="font-semibold p-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[
          ...Array(firstDayOfMonth).fill(null),
          ...Array(daysInMonth).keys(),
        ].map((day, index) => {
          const dayNumber = day !== null ? day + 1 : null;
          const isPast = dayNumber !== null && isPastDate(dayNumber);
          const isAvailable = dayNumber !== null && isDateAvailable(dayNumber);
          const isDisabled = isPast || !isAvailable;
          const isSelected = dayNumber !== null && isSelectedDay(dayNumber);

          return (
            <div
              key={index}
              className={`p-2 text-center text-sm rounded-md ${
                dayNumber !== null
                  ? isDisabled
                    ? isPast 
                      ? "text-gray-300 cursor-not-allowed" 
                      : "text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "hover:bg-gray-200 cursor-pointer"
                  : ""
              } ${isSelected ? "bg-black text-white" : ""}`}
              onClick={() =>
                dayNumber !== null &&
                !isDisabled &&
                handleDateSelection(dayNumber)
              }
            >
              {dayNumber !== null ? dayNumber : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
