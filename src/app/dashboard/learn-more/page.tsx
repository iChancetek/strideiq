"use client";

import { Activity, Zap, Users, Mic, Smartphone, Heart, Award, Calendar, Brain, Coffee } from "lucide-react";

export default function LearnMorePage() {
    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header - Agentic Style */}
            <header className="mb-16 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Powered by Agentic AI
                </div>

                <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
                    The World's First <br />
                    <span className="text-primary italic">Agentic Fitness System</span>
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl mx-auto font-sans font-light leading-relaxed">
                    StrideIQ isn't just a tracker. It's a swarm of <strong className="text-white">intelligent, autonomous agents</strong> working in harmony to optimize your health. From real-time coaching to predictive recovery, your AI team is always active.
                </p>
            </header>

            <div className="space-y-12">

                {/* Voice Command System */}
                <section className="bg-zinc-900/30 border-l-4 border-primary p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Mic size={120} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-serif text-white mb-6 border-b border-white/10 pb-4">
                            Voice Command Interface
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-gray-300 mb-6 text-lg font-light leading-relaxed">
                                    StrideIQ is now hands-free. Tap the microphone in the bottom right to activate your voice agent. Powered by OpenAI Whisper for ultra-accurate transcription.
                                </p>
                                <div className="text-xs uppercase tracking-widest text-primary mb-2">Capabilities</div>
                                <div className="flex flex-wrap gap-2">
                                    {["Start Run", "Log Food", "Open Journal", "Navigation"].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 p-6 border border-white/5">
                                <h3 className="font-serif text-white mb-3 text-lg italic">"Try saying..."</h3>
                                <ul className="space-y-3 text-gray-400 text-sm font-mono">
                                    <li className="flex items-center gap-2">
                                        <span className="text-primary">›</span> "Start a run"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-primary">›</span> "Go for a walk"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-primary">›</span> "Take me to my journal"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-primary">›</span> "Sign out"
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Active Performance */}
                    <section className="bg-[#050505] p-8 border-l-2 border-white/20">
                        <div className="mb-6 text-primary">
                            <Activity size={32} />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2">
                            Active Performance
                        </h2>
                        <p className="text-gray-400 font-light leading-relaxed mb-6">
                            Track every move with precision using our multi-modal activity agents. Run, Walk, and Bike modes available.
                        </p>
                        <div className="text-xs uppercase tracking-widest text-gray-600">
                            Modules: GPS • Pace • Elevation
                        </div>
                    </section>

                    {/* Predictive Wellness */}
                    <section className="bg-[#050505] p-8 border-l-2 border-white/20">
                        <div className="mb-6 text-pink-500">
                            <Heart size={32} />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2">
                            Predictive Wellness
                        </h2>
                        <p className="text-gray-400 font-light leading-relaxed mb-6">
                            Monitor your fasting windows and mental state. Our wellness agents correlate your mood with your performance.
                        </p>
                        <div className="text-xs uppercase tracking-widest text-gray-600">
                            Modules: Fasting • Journal • Recovery
                        </div>
                    </section>

                    {/* Community Swarm */}
                    <section className="bg-[#050505] p-8 border-l-2 border-white/20">
                        <div className="mb-6 text-yellow-400">
                            <Users size={32} />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2">
                            Community Swarm
                        </h2>
                        <p className="text-gray-400 font-light leading-relaxed mb-6">
                            Connect with other athletes. Compete on global leaderboards where every step counts toward your rank.
                        </p>
                        <div className="text-xs uppercase tracking-widest text-gray-600">
                            Modules: Friends • Leaderboard • Social
                        </div>
                    </section>

                    {/* Neural Platform */}
                    <section className="bg-[#050505] p-8 border-l-2 border-white/20">
                        <div className="mb-6 text-white">
                            <Smartphone size={32} />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2">
                            Neural Platform
                        </h2>
                        <p className="text-gray-400 font-light leading-relaxed mb-6">
                            Install StrideIQ as a Progressive Web App (PWA) for a native, high-performance experience on any device.
                        </p>
                        <div className="text-xs uppercase tracking-widest text-gray-600">
                            Modules: PWA • Dark Mode • Offline
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
