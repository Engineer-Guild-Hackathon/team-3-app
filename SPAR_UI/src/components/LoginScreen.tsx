import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LoginScreenProps {
  onGoogleLogin: () => void;
}

export function LoginScreen({ onGoogleLogin }: LoginScreenProps) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        className="
          w-full max-w-md
          backdrop-blur-3xl bg-white/10 border border-white/20
          rounded-3xl shadow-2xl shadow-black/10
          before:absolute before:inset-0 before:rounded-3xl
          before:bg-gradient-to-br before:from-white/20 before:via-white/10 before:to-transparent
          before:pointer-events-none
          relative overflow-hidden
        "
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 p-8">
          {/* Logo/Icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            className="text-center mb-8"
          >
            <div className="
              w-20 h-20 mx-auto mb-6
              backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20
              border border-white/30 rounded-2xl
              flex items-center justify-center
              shadow-lg shadow-blue-500/10
            ">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-medium text-gray-800 mb-2">
              AI Assistant
            </h1>
            <p className="text-gray-600">
              Liquid Glass Experience
            </p>
          </motion.div>

          {/* Welcome message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            className="text-center mb-8"
          >
            <h2 className="text-xl font-medium text-gray-800 mb-3">
              ようこそ
            </h2>
            <p className="text-gray-600 leading-relaxed">
              AIアシスタントとの新しい体験を始めましょう。<br />
              まずはGoogleアカウントでログインしてください。
            </p>
          </motion.div>

          {/* Google Login Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            onClick={onGoogleLogin}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
            className="
              w-full p-4 rounded-2xl
              backdrop-blur-xl bg-white/20 border border-white/30
              hover:bg-white/30 hover:border-white/40
              transition-all duration-300
              shadow-lg shadow-black/5
              flex items-center justify-center gap-3
              group relative overflow-hidden
            "
          >
            {/* Button background effect */}
            <div className="
              absolute inset-0 rounded-2xl
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              translate-x-[-100%] group-hover:translate-x-[100%]
              transition-transform duration-700 ease-out
            " />
            
            {/* Google Icon */}
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
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
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            
            <span className="font-medium text-gray-700 relative z-10">
              Googleアカウントでログイン
            </span>
          </motion.button>

          {/* Terms */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            className="text-center text-xs text-gray-500 mt-6 leading-relaxed"
          >
            ログインすることで、利用規約とプライバシーポリシーに<br />
            同意したものとみなされます。
          </motion.p>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              initial={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                opacity: 0,
              }}
              animate={{
                y: [null, -20, -40],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}