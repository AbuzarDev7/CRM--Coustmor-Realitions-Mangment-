import React from 'react'

/**
 * Official Social Media Platform Icons & Badges
 * Pixel-perfect SVG paths matching official brand guidelines:
 * - LinkedIn: Official "in" brand glyph
 * - Twitter / X: Official X glyph
 * - Facebook: Official "f" rounded brand glyph
 * - Instagram: Official camera glyph
 * - WhatsApp: Official chat bubble phone glyph
 * - Website / SEO: Official globe glyph
 * - Referral: Official network glyph
 * - Google: Official multicolor G glyph
 */

export const LinkedInIcon = ({ className = 'w-4 h-4', color = '#0A66C2' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color }}
    aria-label="LinkedIn"
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.46a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
  </svg>
)

export const TwitterIcon = ({ className = 'w-4 h-4', color = '#0f172a' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color }}
    aria-label="Twitter / X"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export const FacebookIcon = ({ className = 'w-4 h-4', color = '#1877F2' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color }}
    aria-label="Facebook"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

export const InstagramIcon = ({ className = 'w-4 h-4', color = '#E4405F' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color }}
    aria-label="Instagram"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

export const WhatsAppIcon = ({ className = 'w-4 h-4', color = '#25D366' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color }}
    aria-label="WhatsApp"
  >
    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.494-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.135-.135.301-.351.452-.527.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.238-.244-.588-.493-.509-.678-.518-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.079 2.912 1.23 3.113c.15.2 2.122 3.24 5.14 4.544.718.31 1.279.496 1.716.635.722.23 1.38.197 1.9-.119.58-.352 1.78-1.43 2.03-1.43.25-.703.25-1.305.175-1.43-.075-.125-.276-.2-.577-.35zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.97-1.396A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
)

export const GoogleIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-label="Google">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
)

export const WebsiteIcon = ({ className = 'w-4 h-4', color = '#7c3aed' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color }}
    aria-label="Website"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
  </svg>
)

export const ReferralIcon = ({ className = 'w-4 h-4', color = '#f59e0b' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color }}
    aria-label="Referral"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

/**
 * Returns the matching official platform icon component
 */
export const getSocialIcon = (source = '', className = 'w-4 h-4') => {
  const s = (source || '').toLowerCase().trim()
  if (s.includes('linkedin')) return <LinkedInIcon className={className} />
  if (s.includes('twitter') || s === 'x' || s.includes('twitter / x'))
    return <TwitterIcon className={className} />
  if (s.includes('facebook') || s.includes('meta')) return <FacebookIcon className={className} />
  if (s.includes('instagram')) return <InstagramIcon className={className} />
  if (s.includes('whatsapp')) return <WhatsAppIcon className={className} />
  if (s.includes('google')) return <GoogleIcon className={className} />
  if (s.includes('referral')) return <ReferralIcon className={className} />
  return <WebsiteIcon className={className} />
}

/**
 * Enhanced Social Badge with official platform icon and brand colors
 */
export const SocialBadge = ({ source = 'Website', label, className = '' }) => {
  const s = (source || '').toLowerCase().trim()

  let styleConfig = {
    bg: 'bg-violet-50 text-violet-700 border-violet-200',
    iconColor: '#7c3aed',
    name: label || source || 'Website / SEO'
  }

  if (s.includes('linkedin')) {
    styleConfig = {
      bg: 'bg-sky-50 text-sky-800 border-sky-200',
      iconColor: '#0A66C2',
      name: label || 'LinkedIn'
    }
  } else if (s.includes('twitter') || s === 'x' || s.includes('twitter / x')) {
    styleConfig = {
      bg: 'bg-slate-100 text-slate-900 border-slate-300',
      iconColor: '#0f172a',
      name: label || 'Twitter / X'
    }
  } else if (s.includes('facebook') || s.includes('meta')) {
    styleConfig = {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      iconColor: '#1877F2',
      name: label || 'Facebook Ads'
    }
  } else if (s.includes('instagram')) {
    styleConfig = {
      bg: 'bg-pink-50 text-pink-800 border-pink-200',
      iconColor: '#E4405F',
      name: label || 'Instagram'
    }
  } else if (s.includes('whatsapp')) {
    styleConfig = {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconColor: '#25D366',
      name: label || 'WhatsApp'
    }
  } else if (s.includes('google')) {
    styleConfig = {
      bg: 'bg-amber-50 text-slate-800 border-slate-200',
      iconColor: '#4285F4',
      name: label || 'Google Ads'
    }
  } else if (s.includes('referral')) {
    styleConfig = {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconColor: '#f59e0b',
      name: label || 'Referral'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs transition-all ${styleConfig.bg} ${className}`}
    >
      <span className="shrink-0 flex items-center justify-center">
        {getSocialIcon(source, 'w-3.5 h-3.5')}
      </span>
      <span>{styleConfig.name}</span>
    </span>
  )
}

export default SocialBadge
