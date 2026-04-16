import { motion } from "motion/react";
import { useState } from "react";
import { useTheme } from "next-themes";

// Dashboard-style constants
const DASHBOARD_BG = "#F2EAE0";
const SURFACE = "rgba(255, 250, 245, 0.42)";
const SURFACE_ALT = "rgba(255, 250, 245, 0.56)";
const BORDER = "rgba(156, 143, 203, 0.18)";
const TEXT = "#403552";
const MUTED = "#6D6578";
const ACCENT = "#9C8FCB";
const CARD_SHADOW = "0 14px 32px rgba(120, 101, 152, 0.08)";
const CARD_HOVER = "0 20px 38px rgba(120, 101, 152, 0.14)";

// Doctor details
const DOCTOR = {
  name: "Dr Indrajit Lakade",
  specialization: "Pediatrician",
  location: "Latur",
  phone: "9422214636",
  email: "indrajitlakade86@gmail.com",
  whatsapp: "https://wa.me/919422214636",
};

// Generate time slots from 7:00 AM to 9:00 PM in 30-minute intervals
const generateTimeSlots = (): { value: string; label: string }[] => {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      slots.push({ value: timeString, label: displayTime });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  }),
};

// Booking Modal Component
function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{date?: string; time?: string}>({});
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const surface = isDark ? "rgba(29, 36, 48, 0.76)" : SURFACE;
  const surfaceAlt = isDark ? "rgba(35, 44, 58, 0.82)" : SURFACE_ALT;
  const border = isDark ? "rgba(124, 107, 192, 0.22)" : BORDER;
  const text = isDark ? "#F3F2FB" : TEXT;
  const muted = isDark ? "#B8B2C9" : MUTED;
  const accent = isDark ? "#B39BFF" : ACCENT;
  const cardShadow = isDark
    ? "0 18px 38px rgba(0, 0, 0, 0.28)"
    : CARD_SHADOW;

  const validateForm = () => {
    const newErrors: {date?: string; time?: string} = {};
    
    // Check if date is valid and not in the past
    if (!date) {
      newErrors.date = "Please select a date";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Please select a future date";
      }
    }

    // Check if time is within allowed range
    if (!time) {
      newErrors.time = "Please select a time";
    } else {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      const minTime = 7 * 60; // 7:00 AM
      const maxTime = 21 * 60; // 9:00 PM
      if (timeInMinutes < minTime || timeInMinutes > maxTime) {
        newErrors.time = "Please select a time between 7:00 AM and 9:00 PM";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Here you would typically send the booking request
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
      onClose();
      // Reset form
      setName("");
      setDate("");
      setTime("");
      setErrors({});
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="rounded-[2rem] p-6 w-full max-w-md mx-4"
        style={{
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(16px)",
        }}
      >
        {showConfirmation ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: accent }}>Success!</h2>
            <p style={{ color: muted }}>Appointment request sent successfully</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4" style={{ color: text }}>Book Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: text }}>Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border"
                  style={{
                    background: surfaceAlt,
                    borderColor: border,
                    color: text,
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: text }}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${errors.date ? 'border-red-500' : ''}`}
                  style={{
                    background: surfaceAlt,
                    borderColor: errors.date ? 'red' : border,
                    color: text,
                  }}
                  required
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: text }}>Time</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${errors.time ? 'border-red-500' : ''}`}
                  style={{
                    background: surfaceAlt,
                    borderColor: errors.time ? 'red' : border,
                    color: text,
                  }}
                  required
                >
                  <option value="">Select a time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-full font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)",
                    boxShadow: "0 4px 14px rgba(20, 184, 166, 0.3)",
                  }}
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-full font-semibold"
                  style={{
                    background: surfaceAlt,
                    border: `1px solid ${border}`,
                    color: text,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function Consult() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const pageBg = isDark ? "#141821" : DASHBOARD_BG;
  const surface = isDark ? "rgba(29, 36, 48, 0.76)" : SURFACE;
  const surfaceAlt = isDark ? "rgba(35, 44, 58, 0.82)" : SURFACE_ALT;
  const border = isDark ? "rgba(124, 107, 192, 0.22)" : BORDER;
  const text = isDark ? "#F3F2FB" : TEXT;
  const muted = isDark ? "#B8B2C9" : MUTED;
  const accent = isDark ? "#B39BFF" : ACCENT;
  const cardShadow = isDark
    ? "0 18px 38px rgba(0, 0, 0, 0.28)"
    : CARD_SHADOW;
  const cardHover = isDark
    ? "0 22px 44px rgba(0, 0, 0, 0.34)"
    : CARD_HOVER;

  const handleChatWithDoctor = () => {
    window.open(DOCTOR.whatsapp, '_blank');
  };

  const handleCallNow = () => {
    window.location.href = `tel:${DOCTOR.phone}`;
  };

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: pageBg }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Header Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1
            className="font-display text-4xl md:text-5xl font-bold mb-4"
            style={{ color: text }}
          >
            Consult a Doctor
          </h1>
          <p
            className="text-lg md:text-xl leading-7 max-w-2xl mx-auto"
            style={{ color: muted }}
          >
            Take the next step towards better child health with expert guidance.
          </p>
        </motion.div>

        {/* Doctor Card Container */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="flex justify-center"
        >
          <div
            className="rounded-[2rem] p-8 w-full max-w-2xl transition-smooth hover:-translate-y-1"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: cardShadow,
              backdropFilter: "blur(16px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = cardHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = cardShadow;
            }}
          >
            {/* Doctor Card Content */}
            <div className="flex items-start gap-6">
              {/* Left: Avatar */}
              <div className="flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                  style={{
                    background: "linear-gradient(135deg, #9C8FCB 0%, #14b8a6 100%)",
                    color: "white",
                  }}
                >
                  👨‍⚕️
                </div>
              </div>

              {/* Center: Doctor Details */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: text }}
                >
                  {DOCTOR.name}
                </h2>
                <p
                  className="text-lg mb-1"
                  style={{ color: accent }}
                >
                  {DOCTOR.specialization}
                </p>
                <p
                  className="text-sm mb-4"
                  style={{ color: muted }}
                >
                  📍 {DOCTOR.location}
                </p>

                {/* Contact Info */}
                <div
                  className="text-sm space-y-1 mb-6"
                  style={{ color: muted }}
                >
                  <p>📞 {DOCTOR.phone}</p>
                  <p>✉️ {DOCTOR.email}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsBookingModalOpen(true)}
                    className="py-3 px-4 rounded-full font-semibold text-white text-sm"
                    style={{
                      background: "linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)",
                      boxShadow: "0 4px 14px rgba(20, 184, 166, 0.3)",
                    }}
                  >
                    Book Appointment
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleChatWithDoctor}
                    className="py-3 px-4 rounded-full font-semibold text-white text-sm"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    💬 Chat
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCallNow}
                    className="py-3 px-4 rounded-full font-semibold text-sm"
                    style={{
                      background: surfaceAlt,
                      border: `1px solid ${border}`,
                      color: text,
                    }}
                  >
                    📞 Call Now
                  </motion.button>
                </div>
              </div>

              {/* Right: Availability Badge */}
              <div className="flex-shrink-0">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  Available Now
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
}
