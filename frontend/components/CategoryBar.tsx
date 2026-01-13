'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
    'All', 'World', 'Business', 'Technology', 'Science', 'Politics', 'Education'
];

export default function CategoryBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('category') || 'All';

    const setCategory = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category === 'All') {
            params.delete('category');
        } else {
            params.set('category', category);
        }
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-center gap-2 md:gap-8 overflow-x-auto py-4 no-scrollbar border-b border-gray-100 mb-8">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === cat
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-400 hover:text-primary hover:bg-gray-100'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
