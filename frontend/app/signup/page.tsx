import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col items-center">
                <div className="text-center mb-6">
                    <Link href="/">
                        <h1 className="text-4xl font-serif font-black tracking-tighter mb-2">
                            The Smart News<span className="text-accent">.</span>
                        </h1>
                    </Link>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                        Create Account
                    </p>
                </div>

                <SignUp
                    appearance={{
                        elements: {
                            formButtonPrimary: 'bg-black hover:bg-accent text-white uppercase tracking-[0.2em] font-black py-4 h-auto',
                            card: 'shadow-none border-none p-0',
                            headerTitle: 'hidden',
                            headerSubtitle: 'hidden',
                            socialButtonsBlockButton: 'border-2 border-black rounded-none shadow-none font-bold',
                            formFieldInput: 'border-2 border-black rounded-none focus:border-accent',
                            footerActionLink: 'text-black font-bold underline hover:text-accent font-serif'
                        }
                    }}
                    routing="hash"
                />
            </div>
        </div>
    );
}
