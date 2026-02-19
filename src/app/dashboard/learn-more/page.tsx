"use client";

import { Activity, Zap, Users, Mic, Smartphone, Heart, Award, Calendar, Brain, Coffee } from "lucide-react";

export default function LearnMorePage() {
    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <header className="mb-12 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white uppercase" style={{ fontFamily: 'var(--font-heading)' }}>
                    Stride<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">IQ</span> Guide
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Master your fitness journey with our agentic AI features.
                </p>
            </header>

            <div className="space-y-12">

                {/* Voice Command System - NEW */}
                <section className="bg-black/40 border border-primary/30 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Mic size={120} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-primary uppercase">
                            <span className="p-2 rounded-lg bg-primary/10"><Mic size={24} /></span>
                            Voice Command System 🎙️
                        </h2>
                        <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                            StrideIQ is now hands-free. Tap the microphone button in the bottom right corner to control the app with your voice.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-black/60 rounded-xl p-5 border border-white/5">
                                <h3 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">How it works</h3>
                                <p className="text-gray-400 text-sm">
                                    We use OpenAI Whisper for ultra-accurate transcription and GPT-4o to understand your intent. It handles natural language, so you don't need to memorize strict commands.
                                </p>
                            </div>
                            <div className="bg-black/60 rounded-xl p-5 border border-white/5">
                                <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Try saying...</h3>
                                <ul className="space-y-2 text-gray-300 text-sm font-mono">
                                    <li className="flex items-center gap-2"><span className="text-secondary">"Start a run"</span></li>
                                    <li className="flex items-center gap-2"><span className="text-secondary">"Go for a walk"</span></li>
                                    <li className="flex items-center gap-2"><span className="text-secondary">"Take me to my journal"</span></li>
                                    <li className="flex items-center gap-2"><span className="text-secondary">"Sign out"</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Training */}
                    <section className="glass-panel p-8 rounded-3xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-secondary uppercase">
                            <span className="p-2 rounded-lg bg-secondary/10"><Activity size={20} /></span>
                            Training
                        </h2>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex gap-3">
                                <Activity size={16} className="mt-1 text-secondary shrink-0" />
                                <div>
                                    <strong className="text-white">Activity Tracking:</strong> Record Runs, Walks, and Bike rides. We track distance, pace, calories, and map your route (outdoor only).
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <Calendar size={16} className="mt-1 text-secondary shrink-0" />
                                <div>
                                    <strong className="text-white">Training Plan:</strong> Generate AI-powered running plans (5K, 10K, Marathon) tailored to your fitness level.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <Brain size={16} className="mt-1 text-secondary shrink-0" />
                                <div>
                                    <strong className="text-white">AI Coach:</strong> Get personalized advice and motivation from your AI running coach based on your recent activity.
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Wellness */}
                    <section className="glass-panel p-8 rounded-3xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-pink-500 uppercase">
                            <span className="p-2 rounded-lg bg-pink-500/10"><Heart size={20} /></span>
                            Wellness
                        </h2>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex gap-3">
                                <Coffee size={16} className="mt-1 text-pink-500 shrink-0" />
                                <div>
                                    <strong className="text-white">Fasting Timer:</strong> Track your intermittent fasting windows with our premium timer.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <Zap size={16} className="mt-1 text-pink-500 shrink-0" />
                                <div>
                                    <strong className="text-white">Daily Journal:</strong> Reflect on your training and mood. AI helps summarize your entries.
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Community */}
                    <section className="glass-panel p-8 rounded-3xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-yellow-400 uppercase">
                            <span className="p-2 rounded-lg bg-yellow-400/10"><Users size={20} /></span>
                            Community
                        </h2>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex gap-3">
                                <Users size={16} className="mt-1 text-yellow-400 shrink-0" />
                                <div>
                                    <strong className="text-white">Friends & Social:</strong> Find friends, follow their activities, and compete on the leaderboard.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <Award size={16} className="mt-1 text-yellow-400 shrink-0" />
                                <div>
                                    <strong className="text-white">Leaderboards:</strong> Compete for Distance and Steps. See where you stack up against the community.
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Platform */}
                    <section className="glass-panel p-8 rounded-3xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white uppercase">
                            <span className="p-2 rounded-lg bg-white/10"><Smartphone size={20} /></span>
                            Platform
                        </h2>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex gap-3">
                                <Smartphone size={16} className="mt-1 text-white shrink-0" />
                                <div>
                                    <strong className="text-white">Install App:</strong> StrideIQ is a Progressive Web App (PWA). You can install it on your home screen for a native app experience.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <Zap size={16} className="mt-1 text-white shrink-0" />
                                <div>
                                    <strong className="text-white">Dark Mode:</strong> We feature a high-voltage dark mode designed to save battery on OLED screens.
                                </div>
                            </li>
                        </ul>
                    </section>

                </div>
            </div>
        </div>
    );
}
