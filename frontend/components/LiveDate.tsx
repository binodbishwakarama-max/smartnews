'use client';

import { useState } from 'react';

export default function LiveDate() {
    const [date] = useState<string>(() =>
        new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    );

    return (
        <p className="font-serif italic text-lg text-gray-500">
            {date}
        </p>
    );
}
