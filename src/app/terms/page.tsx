import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Gamepad2,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';

export default function PlayerTermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full font-mono">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Gamer Agreement • Player Terms 2026.2</span>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
          Player Terms of Service
        </h1>
        <p className="text-gray-400 text-sm">
          Last Updated: November 2026. These Terms of Service apply exclusively to all players, gamers, and visitors accessing, browsing, or playing instant games on GameVerse. Please read them thoroughly before playing.
        </p>
      </div>

      {/* Critical Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 18+ Mandatory Card */}
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-heading">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Strict 18+ Age Requirement</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            You must be at least 18 years old to use GameVerse or play any games. Anyone under the age of 18 is strictly prohibited from playing. If you are under 18, please exit immediately.
          </p>
        </div>

        {/* Play At Own Risk Card */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-heading">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Play At Your Own Risk</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Games are created by third-party developers. GameVerse is not responsible for in-game content, mechanics, or events. You play entirely at your own risk; any issues lie solely between you and the developer.
          </p>
        </div>
      </div>

      <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
        {/* Section 1: Strict 18+ Age Requirement */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-mono">1</span>
            <h2>Strict Age Requirement (18+ Only — No Minors Permitted)</h2>
          </div>
          <div className="space-y-2 text-gray-300">
            <p>
              To access the GameVerse platform, browse the catalog, create a player account, or play any games, <strong className="text-white">you must be at least 18 years of age</strong> (or the legal age of majority in your jurisdiction, whichever is higher).
            </p>
            <p className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
              <strong>Mandatory Restriction:</strong> If you are under 18 years old, you are <strong>strictly prohibited</strong> from playing any games on this platform. Do not play any games or access GameVerse if you have not attained 18 years of age.
            </p>
            <p>
              By continuing to use this website or clicking to launch any game, you expressly represent, warrant, and certify under penalty of perjury that you are 18 years of age or older, possess full legal competence, and agree unconditionally to these Player Terms of Service. Parents, guardians, and account holders are solely responsible for preventing minors from accessing or playing games on their devices.
            </p>
          </div>
        </section>

        {/* Section 2: Independent Third-Party Games & Platform Hosting Role */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-mono">2</span>
            <h2>Independent Third-Party Games & Platform Role</h2>
          </div>
          <p>
            GameVerse functions strictly as an interactive web portal and hosting venue that allows independent third-party game creators and studios to showcase their browser-playable HTML5 and WebGL games.
          </p>
          <p>
            GameVerse is not the author, creator, or publisher of third-party games. Each game is independently engineered, scripted, and supplied by its respective developer. Consequently, GameVerse does not monitor, direct, or alter the internal code, gameplay dynamics, or narrative elements programmed within each game.
          </p>
        </section>

        {/* Section 3: In-Game Content Disclaimer & Play At Your Own Risk */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-mono">3</span>
            <h2>In-Game Content Disclaimer & Zero Platform Responsibility (Play At Your Own Risk)</h2>
          </div>
          <div className="space-y-3">
            <p>
              What is depicted, played, or experienced inside any individual game—including but not limited to storylines, graphics, audio, characters, difficulty, mechanics, themes, visual effects, simulated actions, or gameplay interactions—is <strong className="text-white">entirely beyond the platform&apos;s scope and responsibility</strong>.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-amber-300">
                Play Strictly At Your Own Risk:
              </p>
              <p>
                You acknowledge and agree that you play any and all games on GameVerse <strong>strictly and entirely at your own personal risk</strong>. GameVerse takes zero responsibility, liability, or accountability for what happens inside games or how games may impact you.
              </p>
              <p>
                If you encounter any discomfort, mental distress, sensory sensitivity, dissatisfaction, loss of progress, technical conflict, or any other issue whatsoever arising from things occurring inside a game, <strong className="text-white">GameVerse and its operators shall NOT be held responsible or liable under any circumstances</strong>. Full responsibility lies either with you (the player) for choosing to play, or with the third-party developer who authored the game.
              </p>
            </div>
            <p>
              Any complaint, objection, claim, or feedback regarding in-game graphics, storylines, fairness, bugs, or content must be resolved solely between you and the respective game developer.
            </p>
          </div>
        </section>

        {/* Section 4: Gamer Acceptance & Entertainment License */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-mono">4</span>
            <h2>Gamer Entertainment License</h2>
          </div>
          <p>
            Subject to your compliance with these Terms, GameVerse grants you a personal, non-commercial, revocable, non-exclusive, non-transferable license to access the Platform and play games in your web browser solely for personal leisure and entertainment.
          </p>
          <p>
            You may not decompile, reverse-engineer, modify, redistribute, screen-scrape, or exploit game assets, audio files, or software code for any commercial purpose.
          </p>
        </section>

        {/* Section 5: Fair Play & Player Conduct Rules */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-mono">5</span>
            <h2>Fair Play & Player Conduct Rules</h2>
          </div>
          <p>As a player on GameVerse, you agree to maintain fair play and respect the community. You agree NOT to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 pl-2">
            <li>Use automated scripts, bots, clickers, or macros to spoof game playtime, generate fake heartbeats, or manipulate rewards.</li>
            <li>Attempt to break out of, tamper with, or circumvent browser iframe security or sandboxing controls (<code className="text-xs bg-black/40 text-cyan-300 px-1 py-0.5 rounded font-mono">sandbox=&quot;allow-scripts allow-same-origin&quot;</code>).</li>
            <li>Post offensive, abusive, hateful, defamatory, or promotional spam in game reviews or community ratings.</li>
            <li>Interfere with platform infrastructure, overload API endpoints, or compromise other players&apos; accounts.</li>
          </ul>
          <p className="text-xs text-gray-400">
            Violations of fair play rules will result in immediate termination of the gamer account and permanent revocation of rewards and platform access.
          </p>
        </section>

        {/* Section 6: Health, Safety & Photosensitivity Warning */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-mono">6</span>
            <h2>Health, Safety & Photosensitivity Warning</h2>
          </div>
          <p>
            A very small percentage of individuals may experience epileptic seizures or blackouts when exposed to certain light patterns or flashing lights common in video games. If you experience dizziness, altered vision, eye or muscle twitches, loss of awareness, disorientation, or involuntary movements while playing, <strong className="text-white">discontinue play immediately</strong> and consult a medical professional.
          </p>
          <p>
            Always play in a well-lit room, sit at a safe distance from your screen, and take frequent breaks of 10 to 15 minutes every hour.
          </p>
        </section>

        {/* Section 7: Limitation of Liability & "AS-IS" Platform Provision */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-mono">7</span>
            <h2>Limitation of Liability & &quot;As-Is&quot; Provision</h2>
          </div>
          <p>
            The Platform, its features, and all hosted games are provided on an <strong className="text-white">&quot;AS-IS&quot;</strong> and <strong className="text-white">&quot;AS-AVAILABLE&quot;</strong> basis without warranties of any kind, whether express or implied.
          </p>
          <p>
            GameVerse does not warrant that gameplay will be uninterrupted, error-free, compatible with every operating system, or that local save states will remain permanently intact. To the maximum extent permitted by applicable law, GameVerse and its directors, officers, employees, and affiliates shall not be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your use of or inability to use the platform.
          </p>
        </section>

        {/* Section 8: Governing Law & Jurisdiction */}
        <section className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-mono">8</span>
            <h2>Governing Law & Jurisdiction</h2>
          </div>
          <p>
            These Player Terms of Service are governed by and construed in accordance with the laws of India, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of India.
          </p>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
        <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium transition-colors">
          <span>Read Player Privacy Policy</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <div className="flex items-center gap-4 text-gray-400">
          <span>Questions? Contact us at:</span>
          <a href="mailto:support@gameverse.com" className="text-cyan-400 hover:underline">
            support@gameverse.com
          </a>
        </div>
      </div>
    </div>
  );
}
