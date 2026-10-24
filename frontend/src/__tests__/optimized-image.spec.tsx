/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OptimizedImage } from '../components/ui/OptimizedImage';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage(props: any) {
    const { src, alt, unoptimized, onError, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        data-unoptimized={unoptimized ? 'true' : 'false'}
        onError={onError}
        {...rest}
      />
    );
  };
});

describe('OptimizedImage Component', () => {
  it('automatically sets unoptimized=true for SVG assets to bypass Vercel transformations', () => {
    render(<OptimizedImage src="/icon.svg" alt="SVG Logo" width={32} height={32} />);
    const img = screen.getByAltText('SVG Logo');
    expect(img).toHaveAttribute('data-unoptimized', 'true');
  });

  it('automatically sets unoptimized=true for small icons (width <= 64, height <= 64)', () => {
    render(<OptimizedImage src="/avatar.png" alt="Small Thumbnail" width={48} height={48} />);
    const img = screen.getByAltText('Small Thumbnail');
    expect(img).toHaveAttribute('data-unoptimized', 'true');
  });

  it('keeps larger photography or hero banners optimized initially', () => {
    render(<OptimizedImage src="/hero-architecture.webp" alt="Hero Banner" width={1200} height={600} />);
    const img = screen.getByAltText('Hero Banner');
    expect(img).toHaveAttribute('data-unoptimized', 'false');
  });

  it('self-heals upon Vercel transformation failure (onError) by falling back to unoptimized=true', () => {
    render(<OptimizedImage src="/photo.jpg" alt="Dynamic Photo" width={800} height={400} />);
    const img = screen.getByAltText('Dynamic Photo');

    expect(img).toHaveAttribute('data-unoptimized', 'false');

    // Simulate Vercel 402/500 transformation error
    fireEvent.error(img);

    // Should re-render as unoptimized=true to directly request the static file
    expect(img).toHaveAttribute('data-unoptimized', 'true');
  });

  it('renders accessible fallback container if asset is completely unreachable', () => {
    render(
      <OptimizedImage
        src="/missing.png"
        alt="Missing Diagram"
        width={200}
        height={100}
        unoptimized={true}
      />,
    );
    const img = screen.getByAltText('Missing Diagram');

    // Trigger error on already unoptimized image
    fireEvent.error(img);

    expect(screen.getByText('Missing Diagram')).toBeInTheDocument();
  });
});
