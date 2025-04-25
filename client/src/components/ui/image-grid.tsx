
import React from 'react';
import { Card, CardContent } from './card';
import { AspectRatio } from './aspect-ratio';

interface ImageGridProps {
  images: Array<{
    url: string;
    title?: string;
    alt?: string;
  }>;
}

export function ImageGrid({ images }: ImageGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {images.map((image, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-2">
            <AspectRatio ratio={16/9}>
              <img
                src={image.url}
                alt={image.alt || image.title || 'Image'}
                className="object-cover w-full h-full rounded-md"
                loading="lazy"
              />
            </AspectRatio>
            {image.title && (
              <p className="mt-2 text-sm text-gray-600">{image.title}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
