'use client';

import { AlertCircle, ArrowUpRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useEffect, useState } from 'react';
import {
  COUNTRY_PHONE_CODES,
  FAQS,
  GENERATED_IMAGES,
  PRESS_COVERAGE,
  SECURITY_PILLARS,
} from '../data/rhinonData';
import { ResilientImage } from './ResilientImage';

interface SecurityAndContactProps {
  presetTopic: string;
  presetRequest: string;
  onOpenSecurityModal: () => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

const NEED_OPTIONS = [
  'New product or MVP',
  'AI or AI agents',
  'Mobile app',
  'Web app or platform',
  'Extend my team with developers',
  'Fix or modernise an existing system',
  'Something else',
];

export function SecurityAndContact({
  presetTopic,
  presetRequest,
  onOpenSecurityModal,
  nameInputRef,
}: SecurityAndContactProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('India');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [need, setNeed] = useState(NEED_OPTIONS[0]);
  const [requestText, setRequestText] = useState('');
  const [ndaFirst, setNdaFirst] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedBrief, setSubmittedBrief] = useState<{
    fullName: string;
    email: string;
    need: string;
    ndaFirst: boolean;
  } | null>(null);

  useEffect(() => {
    if (presetTopic && NEED_OPTIONS.includes(presetTopic)) {
      setNeed(presetTopic);
    }
  }, [presetTopic]);

  useEffect(() => {
    if (presetRequest) {
      setRequestText(presetRequest);
    }
  }, [presetRequest]);

  const phoneMeta = COUNTRY_PHONE_CODES[country] ?? COUNTRY_PHONE_CODES.India;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name so our architect knows who to address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please provide a valid work email address.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      setErrorMsg('Please enter a valid contact phone number (at least 7 digits).');
      return;
    }

    if (requestText.trim().length < 8) {
      setErrorMsg('Please briefly describe what you are building (at least a few words).');
      return;
    }

    setSubmittedBrief({
      fullName: fullName.trim(),
      email: email.trim(),
      need,
      ndaFirst,
    });
  };

  const handleReset = () => {
    setSubmittedBrief(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setRequestText('');
    setNdaFirst(false);
    setErrorMsg(null);
  };

  return (
    <>
      <section id="security" className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex flex-col gap-5"
            >
              <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-[#F4F5F7]">
                <ResilientImage
                  src={GENERATED_IMAGES.coralShield}
                  alt="Cryptographic security shield 3D artwork"
                  className="w-full h-60 object-cover"
                  fallbackTitle="Security & Compliance"
                />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#121314]">
                Security and compliance, built in from day one
              </h2>
              <p className="text-base sm:text-lg text-[#535A61] leading-relaxed">
                Every layer of our delivery pipeline is engineered around the compliance posture your
                product must satisfy, so you ship rapidly without security debt.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs font-label text-[#121314]">
                <span>ISO 27001</span>
                <span aria-hidden="true" className="text-[#535A61]">
                  ·
                </span>
                <span>HIPAA BAA</span>
                <span aria-hidden="true" className="text-[#535A61]">
                  ·
                </span>
                <span>PCI DSS</span>
                <span aria-hidden="true" className="text-[#535A61]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={onOpenSecurityModal}
                  className="font-body text-sm font-semibold text-[#FF6A2B] hover:underline cursor-pointer"
                >
                  How we protect your data →
                </button>
              </div>
            </motion.div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SECURITY_PILLARS.map((pillar, idx) => (
                <motion.button
                  key={pillar.num}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onClick={onOpenSecurityModal}
                  className="text-left p-6 rounded-3xl metamask-card-glow border border-gray-200/80 hover:border-[#FF6A2B]/60 transition-colors flex flex-col gap-2 cursor-pointer"
                >
                  <span className="font-label text-xs font-semibold text-[#FF6A2B] tabular-nums">
                    {pillar.num}
                  </span>
                  <span className="font-display text-lg font-bold text-[#121314]">
                    {pillar.title}
                  </span>
                  <span className="text-sm text-[#535A61] leading-relaxed">{pillar.detail}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100 flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
                  Awards and recognition
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#121314]">
                  Recognized by the press and industry
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenSecurityModal}
                className="self-start sm:self-auto text-sm font-semibold text-[#121314] hover:text-[#FF6A2B] cursor-pointer whitespace-nowrap"
              >
                All press coverage →
              </button>
            </div>

            <div className="overflow-hidden py-2">
              <div className="marquee-track gap-4">
                {[...PRESS_COVERAGE, ...PRESS_COVERAGE.slice(0, 4)].map((item, idx) => (
                  <div
                    key={`${item.outlet}-${idx}`}
                    className="p-5 rounded-3xl bg-[#F4F5F7] border border-gray-200/70 min-w-64 shrink-0"
                  >
                    <p className="font-display text-base font-bold text-[#121314]">{item.outlet}</p>
                    <p className="text-sm text-[#535A61] mt-1">{item.headline}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature MetaMask Gradient Bottom Conversion Banner */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-10">
        <div className="metamask-gradient rounded-[2rem] p-8 sm:p-14 lg:p-16 text-[#121314] grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="font-label text-xs uppercase tracking-[0.14em] font-semibold text-[#121314]/80">
              Start your build
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] leading-[1.03]">
              Where your next <br />
              AI product ships
            </h2>
            <p className="text-base sm:text-lg text-[#121314]/85 max-w-xl">
              Speak directly with a senior engineering architect—not a salesperson—and leave with
              a fixed scope, timeline, and budget.
            </p>
            <div className="pt-2">
              <a
                href="#contact-form"
                className="bg-[#121314] hover:bg-[#2A2D30] text-white font-semibold px-8 py-4 rounded-full text-base inline-flex items-center gap-2 transition-colors"
              >
                <span>Start Project Discussion</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 hidden sm:block">
            <div className="rounded-3xl overflow-hidden bg-white/85 backdrop-blur-sm p-2 shadow-xl">
              <ResilientImage
                src={GENERATED_IMAGES.mvpPods}
                alt="RhinonLabs 3D AI velocity engineering visual"
                className="w-full h-64 object-cover rounded-2xl"
                fallbackTitle="RhinonLabs Engineering"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Project Discussion Form */}
      <section id="contact" className="bg-[#F4F5F7] py-14 sm:py-20 border-t border-gray-200/70">
        <div
          id="contact-form"
          className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#121314]">
              Tell us what you are building
            </h2>
            <p className="text-base sm:text-lg text-[#535A61] leading-relaxed">
              One 30-minute call, then a technical plan with a fixed scope, an exact price, and a
              target date. If an off-the-shelf tool would serve you better than a custom build, we
              will tell you on that call.
            </p>
            <ul className="flex flex-col gap-3 text-base text-[#121314]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#FF6A2B] shrink-0" aria-hidden="true" />
                <span>NDA signed before we look at anything</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#FF6A2B] shrink-0" aria-hidden="true" />
                <span>A senior engineer on the call, not a salesperson</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#FF6A2B] shrink-0" aria-hidden="true" />
                <span>A written scope, price, and date after the call</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#FF6A2B] shrink-0" aria-hidden="true" />
                <span>No obligation, and nothing to pay to find out</span>
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#contact-form"
                className="px-6 py-3 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#121314] hover:bg-gray-50 transition-colors"
              >
                Schedule 30-Min Call
              </a>
              <a
                href="mailto:hello@rhinonlabs.com"
                className="text-sm font-semibold text-[#121314] hover:text-[#FF6A2B] underline underline-offset-4"
              >
                hello@rhinonlabs.com
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
            {submittedBrief ? (
              <div className="py-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-[#FF6A2B]">
                  <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                  <h3 className="font-display text-2xl font-bold text-[#121314]">
                    Brief Received — Architect Assigned
                  </h3>
                </div>
                <p className="text-base text-[#535A61]">
                  Thank you, <strong className="text-[#121314]">{submittedBrief.fullName}</strong>.
                  A senior engineering architect will reply to{' '}
                  <strong className="text-[#121314]">{submittedBrief.email}</strong> within 12 hours
                  regarding <strong className="text-[#121314]">{submittedBrief.need}</strong>
                  {submittedBrief.ndaFirst ? ', with a mutual NDA attached first.' : '.'}
                </p>
                <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-gray-200/70 text-sm text-[#535A61] flex flex-col gap-1">
                  <span>Direct architecture desk: hello@rhinonlabs.com</span>
                  <span>Delivery Hubs: San Francisco · London · Bengaluru · Dubai</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="self-start px-6 py-3 rounded-full border border-gray-200 text-[#121314] text-sm font-semibold hover:bg-[#F4F5F7] transition-colors cursor-pointer"
                >
                  Submit another brief
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-bold text-[#121314]">
                  Start Your Project Discussion
                </h3>
                <p className="text-sm text-[#6B7280] mb-6">
                  Response guaranteed within 12 hours.
                </p>

                {errorMsg && (
                  <div
                    role="alert"
                    className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">Full name</span>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="David Chen"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">Work email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">Country</span>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    >
                      {Object.keys(COUNTRY_PHONE_CODES).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">
                      Phone ({phoneMeta.code})
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={phoneMeta.placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">Company name</span>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">What do you need?</span>
                    <select
                      value={need}
                      onChange={(e) => setNeed(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    >
                      {NEED_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="md:col-span-2 flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#121314]">Your request</span>
                    <textarea
                      rows={3}
                      required
                      value={requestText}
                      onChange={(e) => setRequestText(e.target.value)}
                      placeholder="Briefly describe your request, idea, or challenge."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121314] text-sm focus:border-[#121314] focus:outline-none"
                    />
                  </label>

                  <label className="md:col-span-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ndaFirst}
                      onChange={(e) => setNdaFirst(e.target.checked)}
                      className="rounded border-gray-300 text-[#121314] focus:ring-[#121314]"
                    />
                    <span className="text-sm text-[#535A61]">Send me an NDA first</span>
                  </label>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-full bg-[#121314] hover:bg-[#2A2D30] text-white font-semibold text-base transition-colors cursor-pointer"
                    >
                      Send my brief
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQs Accordion Section at Bottom */}
      <section id="faqs" className="bg-white py-14 sm:py-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 flex flex-col gap-10">
          <div className="text-center space-y-3">
            <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
              FAQs
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#121314]">
              Questions engineering leaders ask
            </h2>
            <p className="text-base sm:text-lg text-[#535A61] max-w-2xl mx-auto">
              Clear answers on IP ownership, fixed-price Velocity Pods, private VPC security, and
              human-in-the-loop governance.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className={`rounded-3xl border transition-colors ${
                    isOpen
                      ? 'bg-[#F4F5F7] border-[#121314]/20'
                      : 'bg-white border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-display text-base sm:text-lg font-bold text-[#121314]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-[#121314] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#FF6A2B]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-sm sm:text-base text-[#535A61] leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
