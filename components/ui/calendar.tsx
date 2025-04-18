"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

interface BookingCalendarProps {
  selectedDate?: Date;
  onChange?: (date: Date) => void;
  availableDates?: Set<string>;
}

export function BookingCalendar({
  selectedDate: propSelectedDate,
  onChange,
  availableDates = new Set(),
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

  const prevMonth = () => {
    const newMonth = currentMonth.subtract(1, "month");
    setCurrentMonth(newMonth);
  };

  // Track if this is the first render
  const isInitialRender = React.useRef(true);

  const nextMonth = () => {
    const newMonth = currentMonth.add(1, "month");
    setCurrentMonth(newMonth);
    
    // Don't dispatch event on first render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Add an event to signal the parent component to fetch next month data
    const event = new CustomEvent('fetchNextMonth', { 
      detail: { year: newMonth.year(), month: newMonth.month() }
    });
    window.dispatchEvent(event);
  };

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

  // Check if a specific day has available time slots
  const isAvailableDate = (day: number) => {
    const date = currentMonth.date(day);
    // Format date to match our API date string (YYYY-MM-DD)
    const dateString = date.format('YYYY-MM-DD');
    return availableDates.has(dateString);
  };

  // Check if a day is the selected date (considering month and year)
  const isSelectedDay = (day: number) => {
    return (
      selectedDayjs.date() === day &&
      selectedDayjs.month() === currentMonth.month() &&
      selectedDayjs.year() === currentMonth.year()
    );
  };
  
  // Check if a day is today
  const isToday = (day: number) => {
    const today = dayjs();
    return (
      today.date() === day &&
      today.month() === currentMonth.month() &&
      today.year() === currentMonth.year()
    );
  };

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {currentMonth.format("MMMM YYYY")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 border rounded hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border rounded hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-gray-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="font-semibold p-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[
          ...Array(firstDayOfMonth).fill(null),
          ...Array(daysInMonth).keys(),
        ].map((day, index) => {
          const dayNumber = day !== null ? day + 1 : null;
          const isDisabled = dayNumber !== null && isPastDate(dayNumber);
          const isSelected = dayNumber !== null && isSelectedDay(dayNumber);

          return (
            <div
              key={index}
              className={`p-4 text-center rounded-md ${
                dayNumber !== null
                  ? isDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : !isAvailableDate(dayNumber)
                      ? "text-gray-400 cursor-not-allowed border-gray-100 bg-gray-50 relative after:content-[''] after:absolute after:w-full after:h-[1px] after:bg-gray-300 after:left-0 after:top-1/2 after:-rotate-12"
                      : "hover:bg-gray-200 cursor-pointer border border-transparent hover:border-gray-300"
                  : ""
              } ${isSelected ? "bg-black text-white border-transparent" : ""}
              ${isToday(dayNumber) && !isSelected ? "border border-black font-bold" : ""}`}
              title={
                dayNumber !== null
                  ? isDisabled
                    ? "Past dates are not available for booking"
                    : !isAvailableDate(dayNumber)
                      ? "No available appointments on this date"
                      : "Click to see available appointment times"
                  : ""
              }
              onClick={() =>
                dayNumber !== null &&
                !isDisabled &&
                isAvailableDate(dayNumber) &&
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
