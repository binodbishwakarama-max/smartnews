'use client';
import { useState, useEffect } from 'react';

export default function LiveDate() {
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        setDate(new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }, []);

    return (
        <p className="font-serif italic text-lg text-gray-500">
            {date || 'Loading date...'}
        </p>
    );
}
