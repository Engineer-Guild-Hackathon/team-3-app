import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, BookOpen } from 'lucide-react';

interface SubjectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const subjects = [
  { id: 'math', name: '数学' },
  { id: 'english', name: '英語' },
  { id: 'science', name: '理科' },
  { id: 'japanese', name: '国語' },
  { id: 'social', name: '社会' },
  { id: 'programming', name: 'プログラミング' },
];

export function SubjectDropdown({ value, onChange, disabled = false }: SubjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedSubject = subjects.find(s => s.id === value);

  const handleSelect = (subjectId: string) => {
    onChange(subjectId);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative z-50">
      <motion.button
        onClick={handleToggle}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={`
          w-full p-4 rounded-2xl text-left
          backdrop-blur-xl border border-white/10
          shadow-lg shadow-black/5
          transition-all duration-200
          flex items-center justify-between gap-3
          ${disabled 
            ? 'bg-white/2 text-gray-400 cursor-not-allowed' 
            : 'bg-white/5 hover:bg-white/10 text-gray-800'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <BookOpen className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-600'}`} />
          <span>{selectedSubject ? selectedSubject.name : '教科を選択'}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        </motion.div>
      </motion.button>

      {/* SubjectMenu Overlay */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              absolute top-full left-0 right-0 mt-2
              bg-white border border-gray-200
              rounded-2xl shadow-2xl shadow-black/20
              overflow-hidden
              min-w-full z-[100]
            "
          >
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(subject.id);
                }}
                className="
                  w-full p-4 text-left
                  hover:bg-blue-50 transition-all duration-200
                  text-gray-800 border-b border-gray-100 last:border-b-0
                  bg-white cursor-pointer
                  focus:outline-none focus:bg-blue-50
                "
              >
                {subject.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}