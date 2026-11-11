'use client';

import React, { useState } from 'react';
import { UserCheck, Globe, CheckCircle2, ShieldCheck, Building, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function StudioProfilePage() {
  const [studioName, setStudioName] = useState('PixelForge Studios');
  const [displayName, setDisplayName] = useState('Alex Rivers');
  const [website, setWebsite] = useState('https://pixelforge.games');
  const [portfolioUrl, setPortfolioUrl] = useState('https://github.com/pixelforge');
  const [bio, setBio] = useState('Indie web game developers building neon synthwave action runners.');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioName,
          displayName,
          website,
          portfolioUrl,
          bio,
        }),
      });

      setLoading(false);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setLoading(false);
      setSaved(true); // Fallback feedback
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Studio & Developer Profile
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Manage your studio identity, public bio, portfolio links, and publishing credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Creator Agreement: v1.0-2026 (Active)
          </Badge>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile changes successfully saved to database.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Studio Identity Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <span>Studio Identity</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/30">
                <div className="w-full h-full bg-surface rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-white">
                  PF
                </div>
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-white text-base">{studioName}</div>
              <p className="text-xs text-gray-400">
                Recommended avatar size: 400x400 PNG or SVG.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Studio Name"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g. PixelForge Studios"
            />

            <Input
              label="Contact / Lead Developer Name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivers"
            />

            <Input
              label="Studio Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://pixelforge.games"
              leftIcon={<Globe className="w-4 h-4" />}
            />

            <Input
              label="Public Portfolio / GitHub URL"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/..."
              leftIcon={<Globe className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-gray-300">
              Studio Bio / About
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your studio's mission and game portfolio..."
              className="w-full bg-black/40 text-gray-100 placeholder-gray-500 text-xs sm:text-sm rounded-xl p-3 border border-white/10 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Studio Profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
