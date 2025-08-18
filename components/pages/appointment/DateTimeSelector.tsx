"use client";

import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/ui/calendar";
import { TimeSlot } from "@/lib/booking-service";
import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

interface DateTimeSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onTimeSelect: (time: TimeSlot | null) => void;
  selectedTime: TimeSlot | null;
  availableTimes: TimeSlot[];
  availableDates: string[];
  isLoading: boolean;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  onDateChange,
  onMonthChange,
  onTimeSelect,
  selectedTime,
  availableTimes,
  availableDates,
  isLoading,
}) => {
  // Format time for display in Melbourne timezone (for Australian users)
  const formatTime = (isoTime: string) => {
    // Convert UTC time to Melbourne time
    const melbourneTime = dayjs(isoTime).tz("Australia/Melbourne");
    return melbourneTime.format("h:mm A");
  };

  // Skeleton loader for calendar
  const renderCalendarSkeleton = () => (
    <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* Month and navigation header */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 text-center gap-1 mb-2">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
      </div>

      {/* Calendar grid - 5 weeks */}
      {Array(5)
        .fill(0)
        .map((_, week) => (
          <div key={week} className="grid grid-cols-7 gap-1 mb-1">
            {Array(7)
              .fill(0)
              .map((_, day) => (
                <div
                  key={`${week}-${day}`}
                  className="h-10 bg-gray-200 rounded-md animate-pulse"
                  style={{ animationDelay: `${(week * 7 + day) * 50}ms` }}
                ></div>
              ))}
          </div>
        ))}
    </div>
  );

  // Skeleton loader for time slots
  const renderTimeSlotsSkeleton = () => (
    <div className="flex flex-wrap gap-4">
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="min-w-[100px] h-10 bg-gray-200 rounded-md animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          ></div>
        ))}
    </div>
  );

  // Render available times section
  const renderAvailableTimes = () => {
    if (availableTimes.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-3 text-center text-sm">
          <p>
            No available times for the selected date. Please try another date.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-4">
        {availableTimes.map((time, index) => (
          <Button
            key={index}
            variant={
              selectedTime?.start_at === time.start_at ? "default" : "outline"
            }
            className={`min-w-[100px] rounded-md py-2.5 px-4 text-sm ${
              selectedTime?.start_at === time.start_at
                ? "bg-black text-white"
                : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => onTimeSelect(time)}
          >
            {formatTime(time.start_at)}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-base font-semibold mb-3">
        Please select a date and time
      </h2>
      {isLoading ? (
        renderCalendarSkeleton()
      ) : (
        <BookingCalendar
          selectedDate={selectedDate}
          onChange={onDateChange}
          onMonthChange={onMonthChange}
          availableDates={availableDates}
        />
      )}

      {/* Available times section */}
      <div className="mt-5">
        <h3 className="text-base font-semibold mb-3">Available Times</h3>
        {isLoading ? renderTimeSlotsSkeleton() : renderAvailableTimes()}
      </div>
    </div>
  );
};
