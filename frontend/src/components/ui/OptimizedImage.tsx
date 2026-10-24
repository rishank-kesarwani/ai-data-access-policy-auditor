'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackText?: string;
}

/**
 * Enterprise Next.js image wrapper designed to eliminate unnecessary Vercel Image Optimization
 * transformations and protect against quota exhaustion (5,000 monthly limit).
 *
 * Capabilities:
 * 1. Automatic SVG Bypass: SVGs and vector data URIs automatically set `unoptimized={true}`.
 * 2. Small Icon/Thumbnail Bypass: Assets with width <= 64 and height <= 64 default to `unoptimized={true}`.
 * 3. Self-Healing Quota Recovery: If Vercel returns HTTP 402 or 500 for an optimized variant,
 *    it catches the error and instantly falls back to direct unoptimized static delivery.
 * 4. Zero Layout Shift (CLS = 0): Preserves intrinsic dimensions and aspect ratios.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  unoptimized: explicitUnoptimized,
  fallbackText,
  className,
  style,
  ...rest
}: OptimizedImageProps) {
  // Determine if this asset should bypass Vercel optimizer by default
  const isSvg =
    typeof src === 'string' &&
    (src.toLowerCase().endsWith('.svg') || src.startsWith('data:image/svg'));

  const isSmallIcon =
    typeof width === 'number' &&
    typeof height === 'number' &&
    width <= 64 &&
    height <= 64;

  const shouldDefaultUnoptimized = Boolean(
    explicitUnoptimized || isSvg || isSmallIcon,
  );

  const [isUnoptimized, setIsUnoptimized] = useState<boolean>(
    shouldDefaultUnoptimized,
  );
  const [hasError, setHasError] = useState<boolean>(false);

  // Self-healing fallback handler
  const handleError = () => {
    if (!isUnoptimized) {
      // Vercel transformation quota might be exhausted (HTTP 402/500).
      // Fallback immediately to direct static file delivery.
      console.warn(
        `[OptimizedImage] Transformation failed for "${src}". Engaging self-healing unoptimized bypass.`,
      );
      setIsUnoptimized(true);
    } else {
      // Asset is completely unreachable. Display accessible fallback element.
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textAlign: 'center',
          padding: '4px',
          ...style,
        }}
        aria-label={alt || 'Fallback image placeholder'}
      >
        {fallbackText || alt || 'Asset'}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ''}
      width={width}
      height={height}
      unoptimized={isUnoptimized}
      onError={handleError}
      className={className}
      style={style}
      {...rest}
    />
  );
}
