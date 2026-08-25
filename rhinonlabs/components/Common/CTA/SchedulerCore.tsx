"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Globe, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isBefore, startOfMonth, getDay, getDaysInMonth } from "date-fns";
import { bookScheduleCall, getScheduleCallAvailability, type AvailabilitySlot } from "@/lib/api";

interface SchedulerCoreProps {
  /** Present when embedded in the SchedulerModal overlay — shows the X button and
   *  makes the success screen's button close the modal instead of linking home. */
  onClose?: () => void;
}

/** Slots arrive as UTC instants; render them in whichever zone the visitor is in. */
const slotLabel = (iso: string, timezone: string, is24h: boolean) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: is24h ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: !is24h,
    timeZone: timezone,
  });

export default function SchedulerCore({ onClose }: SchedulerCoreProps) {
  const [step, setStep] = useState(1); // 1: Date & Time, 2: Form, 3: Success
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [is24h, setIs24h] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [countryCode, setCountryCode] = useState("+91");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [booked, setBooked] = useState(true);

  // Form State matching Cal.com image layout
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    institutionType: "",
    annualLeadVolume: "",
    teamSize: "",
  });

  // Detect the visitor's timezone once on mount.
  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata");
    } catch (e) {
      setTimezone("Asia/Kolkata");
    }
  }, []);

  // Pull real availability off the Rhinon calendar whenever the date changes, so slots that
  // are already booked (from here or from the internal Meetings tab) show as unavailable.
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let cancelled = false;

    setLoadingSlots(true);
    setSlotsError(null);
    getScheduleCallAvailability(dateStr)
      .then((res) => {
        if (!cancelled) setSlots(res.slots);
      })
      .catch((err) => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(
          err.code === "CALENDAR_UNAVAILABLE"
            ? "Booking is temporarily unavailable. Please try again shortly."
            : "Couldn't load available times. Please try another date."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = startOfMonth(currentDate);
  const startDayOfWeek = getDay(firstDayOfMonth);
  const daysInMonth = getDaysInMonth(currentDate);

  const prevMonth = () => {
    const today = new Date();
    if (year === today.getFullYear() && month <= today.getMonth()) {
      return;
    }
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(selected, today)) return;
    setSelectedDate(selected);
    setSelectedSlot(null); // Reset time when date changes
  };

  const handleTimeSelect = (slot: AvailabilitySlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep(2); // Go to form
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const refreshSlots = async () => {
    if (!selectedDate) return;
    try {
      const res = await getScheduleCallAvailability(format(selectedDate, "yyyy-MM-dd"));
      setSlots(res.slots);
    } catch {
      /* the banner on step 1 already covers a failed refresh */
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await bookScheduleCall({
        name: formData.name,
        email: formData.email,
        phone: `${countryCode} ${formData.phone}`.trim(),
        website: formData.website,
        institutionType: formData.institutionType,
        annualLeadVolume: formData.annualLeadVolume,
        teamSize: formData.teamSize,
        startTime: selectedSlot.startTime,
        timezone,
      });

      setMeetLink(result.booking.meetLink);
      setBooked(result.booked);
      setStep(3); // Success Screen
    } catch (err: any) {
      console.error("Failed to submit scheduled call:", err);
      if (err.code === "SLOT_TAKEN") {
        // Somebody grabbed it while the form was open — send them back to a fresh grid.
        setSelectedSlot(null);
        setSubmitError(null);
        setStep(1);
        await refreshSlots();
        setSlotsError("That time was just taken. Please choose another slot.");
      } else {
        setSubmitError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(year, month, day);
    return isBefore(dateToCheck, today);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  // Calls are Mon–Fri only, so weekends are never selectable.
  const isWeekend = (day: number) => {
    const weekday = new Date(year, month, day).getDay();
    return weekday === 0 || weekday === 6;
  };

  // Grid layout helper - Pad cells to exactly 42 (6 rows * 7 columns) to prevent height jumps
  const blanks = Array(startDayOfWeek).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const tempCells = [...blanks, ...days];
  const postBlanks = Array(Math.max(0, 42 - tempCells.length)).fill(null);
  const calendarCells = [...tempCells, ...postBlanks];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#0B0F19] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto md:overflow-hidden shadow-2xl relative flex flex-col md:flex-row text-white font-sans md:min-h-[620px]"
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
        >
          <X size={16} />
        </button>
      )}

      {/* Left Column: Event Metadata Info */}
      <div className="w-full md:w-[30%] bg-[#080B12] p-5 md:p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl p-[1px] flex items-center justify-center ">
              <div className="w-full h-full rounded-[10px] flex items-center justify-center overflow-hidden">
                <img
                  src="/RhinonLabs_Dark.png"
                  alt="Rhinon Labs"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white/50 tracking-wider uppercase leading-none mb-1">
                Organizer
              </p>
              <p className="text-sm font-bold text-white uppercase tracking-wider">Rhinon Labs</p>
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-4">
            {step === 3 ? "Call Scheduled!" : "Pick Your Time. See Rhinon Labs in Action"}
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            See our purpose-built, high-performance dashboards, AI integrations, and MVP build workflows in action, customized exactly for your business needs.
          </p>

          <div className="space-y-4 pt-6 border-t border-white/5">
            {/* Selected Slot Information */}
            {selectedDate && selectedSlot && (
              <div className="flex items-start gap-3 text-sm text-white/80">
                <Calendar size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-white block">
                    {format(selectedDate, "eeee, MMMM d, yyyy")}
                  </span>
                  <span className="text-xs text-white/50">
                    {slotLabel(selectedSlot.startTime, timezone, is24h)} – {slotLabel(selectedSlot.endTime, timezone, is24h)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-white/60">
              <Clock size={16} className="text-primary shrink-0" />
              <span>30 min Call</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <span>Google Meet / Video Call</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <Globe size={16} className="text-primary shrink-0" />
              <span className="truncate">{timezone}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-[11px] text-white/30">
          © 2026 Rhinon Labs. All rights reserved.
        </div>
      </div>

      {/* Right Column: Dynamic Steps */}
      <div className="flex-1 p-5 md:p-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full items-stretch"
            >
              {/* Calendar Panel (Takes more width to be bigger) */}
              <div className="flex-[2.2] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-lg text-white">
                      {format(currentDate, "MMMM yyyy")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevMonth}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        disabled={
                          year === new Date().getFullYear() &&
                          month <= new Date().getMonth()
                        }
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid Header (Upper case, tracking spacing) */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* Calendar Days - Bigger grid and cells */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                    {calendarCells.map((cell, idx) => {
                      if (cell === null) {
                        return <div key={`empty-${idx}`} className="w-full aspect-square" />;
                      }

                      const active = !isPastDate(cell) && !isWeekend(cell);
                      const selected = isSelected(cell);

                      return (
                        <button
                          key={`day-${cell}`}
                          onClick={() => active && handleDateSelect(cell)}
                          disabled={!active}
                          className={`
                            w-full aspect-square rounded-lg sm:rounded-xl text-sm sm:text-base font-bold flex items-center justify-center transition-all
                            ${
                              selected
                                ? "bg-white text-black shadow-glow scale-[1.05]"
                                : active
                                ? "bg-white/5 border border-white/5 text-white hover:bg-white/15 hover:border-white/25 active:scale-95"
                                : "text-white/10 bg-transparent border-transparent cursor-not-allowed"
                            }
                          `}
                        >
                          {cell}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots Panel - Width fixed to lg:w-72, hides scrollbar */}
              <div className={`w-full lg:w-72 flex-col border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-10 ${selectedDate ? 'flex' : 'hidden lg:flex'}`}>
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <span className="font-bold text-sm text-white/80">
                    {selectedDate ? format(selectedDate, "eeee, d MMMM") : "Select Date"}
                  </span>
                  {selectedDate && (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-[10px]">
                      <button
                        onClick={() => setIs24h(false)}
                        className={`px-2 py-1 rounded font-bold transition-all ${!is24h ? "bg-white/10 text-white" : "text-white/55 hover:text-white"}`}
                      >
                        12h
                      </button>
                      <button
                        onClick={() => setIs24h(true)}
                        className={`px-2 py-1 rounded font-bold transition-all ${is24h ? "bg-white/10 text-white" : "text-white/55 hover:text-white"}`}
                      >
                        24h
                      </button>
                    </div>
                  )}
                </div>

                {/* Time slots container - fixed height, scrollbar completely hidden */}
                <div className="h-[360px] lg:h-[400px] overflow-y-auto space-y-2 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {selectedDate ? (() => {
                    if (loadingSlots) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                          <span className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-3" />
                          <p className="text-xs text-white/30">Checking availability…</p>
                        </div>
                      );
                    }

                    if (slotsError) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                          <Clock className="w-8 h-8 text-white/10 mb-3" />
                          <p className="text-xs text-white/40 max-w-[190px]">{slotsError}</p>
                        </div>
                      );
                    }

                    if (slots.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                          <Clock className="w-8 h-8 text-white/10 mb-3" />
                          <p className="text-xs text-white/30 max-w-[170px]">
                            No slots on this date. Please pick another day.
                          </p>
                        </div>
                      );
                    }

                    if (slots.every((s) => !s.available)) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                          <Clock className="w-8 h-8 text-white/10 mb-3" />
                          <p className="text-xs text-white/30 max-w-[180px]">
                            Fully booked on this date. Please pick another day.
                          </p>
                        </div>
                      );
                    }

                    // Booked slots stay visible but disabled, so it's obvious the day is
                    // filling up rather than the times silently vanishing.
                    return slots.map((slot) => (
                      <button
                        key={slot.startTime}
                        onClick={() => handleTimeSelect(slot)}
                        disabled={!slot.available}
                        title={slot.available ? undefined : "Already booked"}
                        className={`w-full py-3 px-4 rounded-xl border text-sm font-semibold text-center transition-all duration-200 ${
                          slot.available
                            ? "border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-white/80 hover:text-white active:scale-[0.98]"
                            : "border-white/5 bg-transparent text-white/20 line-through cursor-not-allowed"
                        }`}
                      >
                        {slotLabel(slot.startTime, timezone, is24h)}
                      </button>
                    ));
                  })() : (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <Calendar className="w-8 h-8 text-white/10 mb-3" />
                      <p className="text-xs text-white/30 max-w-[170px]">
                        Select a date from the calendar to view available slots.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg mx-auto"
            >
              <form onSubmit={handleFormSubmit} className="space-y-2">
                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl select-none">
                    {submitError}
                  </div>
                )}
                {/* Your name * */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[13px] font-medium text-white select-none">
                    Your name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#090C15] border border-white/10 focus:border-white/20 focus:outline-none rounded-[10px] text-sm text-white transition-all placeholder-white/30"
                  />
                </div>

                {/* Email address * */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[13px] font-medium text-white select-none">
                    Email address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#090C15] border border-white/10 focus:border-white/20 focus:outline-none rounded-[10px] text-sm text-white transition-all placeholder-white/30"
                  />
                </div>

                {/* Phone Number * */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-[13px] font-medium text-white flex items-center gap-1.5 select-none">
                    Phone Number *
                    <span className="w-3.5 h-3.5 rounded-full border border-white/30 text-[9px] flex items-center justify-center font-bold text-white/50 cursor-pointer hover:border-white/50 hover:text-white transition-colors" title="For calendar and meeting notifications">
                      i
                    </span>
                  </label>
                  <div className="flex rounded-[10px] border border-white/10 bg-[#090C15] focus-within:border-white/20 transition-all overflow-hidden">
                    <div className="relative flex items-center px-3 border-r border-white/10 bg-[#090C15] select-none">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-transparent text-sm text-white/80 pr-4 focus:outline-none cursor-pointer appearance-none"
                      >
                        <option className="bg-[#0B0F19]" value="+44">🇬🇧 +44</option>
                        <option className="bg-[#0B0F19]" value="+91">🇮🇳 +91</option>
                        <option className="bg-[#0B0F19]" value="+1">🇺🇸 +1</option>
                        <option className="bg-[#0B0F19]" value="+61">🇦🇺 +61</option>
                        <option className="bg-[#0B0F19]" value="+49">🇩🇪 +49</option>
                        <option className="bg-[#0B0F19]" value="+65">🇸🇬 +65</option>
                      </select>
                      <span className="absolute right-2 pointer-events-none text-[8px] text-white/50">▼</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-sm text-white placeholder-white/30"
                    />
                  </div>
                </div>

                {/* Organization Website * */}
                <div className="space-y-2">
                  <label htmlFor="website" className="text-[13px] font-medium text-white select-none">
                    Organization Website *
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    required
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#090C15] border border-white/10 focus:border-white/20 focus:outline-none rounded-[10px] text-sm text-white transition-all placeholder-white/30"
                  />
                </div>

                {/* Institution Type * */}
                <div className="space-y-2">
                  <label htmlFor="institutionType" className="text-[13px] font-medium text-white select-none">
                    Institution Type *
                  </label>
                  <div className="relative">
                    <select
                      name="institutionType"
                      id="institutionType"
                      required
                      value={formData.institutionType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#090C15] border border-white/10 focus:border-white/20 focus:outline-none rounded-[10px] text-sm text-white appearance-none cursor-pointer transition-all"
                    >
                      <option className="bg-[#0B0F19]" value="">Select option</option>
                      <option className="bg-[#0B0F19]" value="Higher Education">Higher Education</option>
                      <option className="bg-[#0B0F19]" value="Coaching & Training Institute">Coaching & Training Institute</option>
                      <option className="bg-[#0B0F19]" value="Consultants">Consultants</option>
                      <option className="bg-[#0B0F19]" value="EdTech">EdTech</option>
                      <option className="bg-[#0B0F19]" value="K-12 School">K-12 School</option>
                      <option className="bg-[#0B0F19]" value="Preschool & Playschool">Preschool & Playschool</option>
                      <option className="bg-[#0B0F19]" value="Online Degree">Online Degree</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-white/50">▼</span>
                  </div>
                </div>

                {/* Annual Lead Volume * */}
                <div className="space-y-2">
                  <label htmlFor="annualLeadVolume" className="text-[13px] font-medium text-white select-none">
                    Annual Lead Volume *
                  </label>
                  <div className="relative">
                    <select
                      name="annualLeadVolume"
                      id="annualLeadVolume"
                      required
                      value={formData.annualLeadVolume}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#090C15] border border-white/10 focus:border-white/20 focus:outline-none rounded-[10px] text-sm text-white appearance-none cursor-pointer transition-all"
                    >
                      <option className="bg-[#0B0F19]" value="">Select option</option>
                      <option className="bg-[#0B0F19]" value="Under 10k">Under 10k</option>
                      <option className="bg-[#0B0F19]" value="10k - 50k">10k - 50k</option>
                      <option className="bg-[#0B0F19]" value="50k-100k">50k-100k</option>
                      <option className="bg-[#0B0F19]" value="Above 100k">Above 100k</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-white/50">▼</span>
                  </div>
                </div>

                {/* Team Size */}
                <div className="space-y-2">
                  <label htmlFor="teamSize" className="text-[13px] font-medium text-white select-none">
                    Team Size
                  </label>
                  <div className="relative">
                    <select
                      name="teamSize"
                      id="teamSize"
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#090C15] border border-white/10 focus:border-white/20 focus:outline-none rounded-[10px] text-sm text-white appearance-none cursor-pointer transition-all"
                    >
                      <option className="bg-[#0B0F19]" value="">Select option</option>
                      <option className="bg-[#0B0F19]" value="Just me (1)">Just me (1)</option>
                      <option className="bg-[#0B0F19]" value="2 - 10">2 - 10</option>
                      <option className="bg-[#0B0F19]" value="11 - 50">11 - 50</option>
                      <option className="bg-[#0B0F19]" value="50 - 100">50 - 100</option>
                      <option className="bg-[#0B0F19]" value="100+">100+</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-white/50">▼</span>
                  </div>
                </div>

                {/* Terms and Bottom Buttons */}
                <div className="pt-6 flex flex-col gap-5 border-t border-white/5 mt-6">
                  <p className="text-[13px] text-white/40 leading-relaxed select-none">
                    By proceeding, you agree to Rhinon Labs' <span className="font-semibold text-white">Terms</span> and <span className="font-semibold text-white">Privacy Policy</span>.
                  </p>

                  <div className="flex items-center justify-end gap-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={submitting}
                      className="text-white/60 hover:text-white font-semibold text-sm transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-glow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                          Confirming...
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md mx-auto text-center py-12 px-4 flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-glow">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {booked ? "Booking Confirmed!" : "Request Received"}
              </h3>
              <p className="text-white/60 text-sm mb-6 leading-relaxed max-w-sm">
                {booked
                  ? "Your discovery call is scheduled. Check your inbox for the calendar invite and meeting link."
                  : "We've got your request and will email you a confirmation shortly."}
              </p>

              {booked && selectedSlot && (
                <p className="text-white/80 text-sm font-semibold mb-4">
                  {format(new Date(selectedSlot.startTime), "eeee, MMMM d")} ·{" "}
                  {slotLabel(selectedSlot.startTime, timezone, is24h)} – {slotLabel(selectedSlot.endTime, timezone, is24h)}
                </p>
              )}

              {meetLink && (
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-sm font-semibold text-white hover:bg-primary/25 transition-all"
                >
                  Join with Google Meet
                </a>
              )}
              {!meetLink && <div className="mb-8" />}

              {onClose ? (
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all"
                >
                  Close Window
                </button>
              ) : (
                <Link
                  href="/"
                  className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all"
                >
                  Back to Home
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
