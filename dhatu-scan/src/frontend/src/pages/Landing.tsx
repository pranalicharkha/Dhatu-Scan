import { motion, useInView, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -50 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, delay },
  }),
};

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Typing animation component
function TypingAnimation({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useState(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  });

  return <span>{displayText}</span>;
}

// Hero Section
function HeroSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
    >
      <FloatingParticles />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          Smart AI Scanning. <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Clear Insights.
          </span>{" "}
          Better Decisions.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0.2}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
        >
          Upload your data, analyze instantly, and get meaningful insights powered by AI.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0.4}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Start Scan
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 border-2 border-white/20 text-white rounded-2xl font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            Try Demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: "🤖",
      title: "AI Scan Analysis",
      desc: "Advanced AI algorithms analyze your data for patterns and insights.",
    },
    {
      icon: "⚡",
      title: "Real-time Results",
      desc: "Get instant analysis and results as soon as you upload your data.",
    },
    {
      icon: "💡",
      title: "Smart Recommendations",
      desc: "Receive personalized recommendations based on AI insights.",
    },
    {
      icon: "📊",
      title: "Easy Upload & Dashboard",
      desc: "Simple upload process with a comprehensive dashboard for tracking.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          className="text-4xl font-bold text-center mb-12"
        >
          Features
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={slideIn}
              initial="hidden"
              whileInView="visible"
              custom={index * 0.1}
              whileHover={{ y: -10 }}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    { title: "Upload", desc: "Upload your data securely" },
    { title: "Scan", desc: "AI scans and analyzes" },
    { title: "Analyze", desc: "Deep analysis performed" },
    { title: "Results", desc: "Get insights and recommendations" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          className="text-4xl font-bold text-center mb-12"
        >
          How It Works
        </motion.h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              custom={index * 0.2}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
              {index < steps.length - 1 && (
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="hidden md:block text-2xl text-gray-400 mt-4"
                >
                  →
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Dashboard Preview Section
function DashboardPreviewSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          className="text-4xl font-bold text-center mb-12"
        >
          Dashboard Preview
        </motion.h2>
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Analysis Results</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Accuracy</div>
                  <div className="text-2xl font-bold">95%</div>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Insights Found</div>
                  <div className="text-2xl font-bold">12</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Recommendations</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Optimize data structure
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Implement advanced filtering
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Enhance visualization
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// AI Chat Assistant Component
function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-80 mb-4"
          >
            <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">
                Explain my result
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">
                What next?
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">
                Get recommendations
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg"
      >
        <span className="text-2xl">🤖</span>
      </motion.button>
    </div>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "John Doe",
      role: "Data Analyst",
      quote: "This AI tool has revolutionized our data analysis process.",
    },
    {
      name: "Jane Smith",
      role: "Business Owner",
      quote: "Incredible insights and recommendations. Highly recommend!",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          className="text-4xl font-bold text-center mb-12"
        >
          What Our Users Say
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={slideIn}
              initial="hidden"
              whileInView="visible"
              custom={index * 0.2}
              className="bg-gray-50 p-6 rounded-2xl"
            >
              <p className="text-lg mb-4">"{testimonial.quote}"</p>
              <div className="font-semibold">{testimonial.name}</div>
              <div className="text-gray-600">{testimonial.role}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Dhatu Scan</h3>
            <p className="text-gray-400">AI-powered insights for better decisions.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Dhatu Scan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Component
export default function Landing() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <TestimonialsSection />
      <Footer />
      <AIChatAssistant />
    </div>
  );
}
