import React, {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  forwardRef,
} from 'react';
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// Utilitaire simple pour combiner des classes Tailwind
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==================== Input Component ====================

export const Input = memo(
  forwardRef(function Input(
    { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
          #6366f1,
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          type={type}
          className={cn(
            `flex h-10 w-full rounded-md border-none bg-slate-900/90 px-3 py-2 text-sm text-white transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:ring-[2px] focus-visible:ring-[#6366f1] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 shadow-[0px_0px_1px_1px_#262833]`,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);

Input.displayName = 'Input';

// ==================== BoxReveal Component ====================

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

export const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position as
          | 'relative'
          | 'absolute'
          | 'fixed'
          | 'sticky'
          | 'static',
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? '#6366f1',
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Ripple Component ====================

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

export const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 11,
  className = '',
}: RippleProps) {
  return (
    <section
      className={`max-w-[50%] absolute inset-0 flex items-center justify-center
        bg-transparent
        [mask-image:linear-gradient(to_bottom,black,transparent)] ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';
        const borderOpacity = 5 + i * 5;

        return (
          <span
            key={i}
            className="absolute animate-ripple rounded-full bg-indigo-500/10 border"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              borderWidth: '1px',
              borderColor: `rgba(99, 102, 241, ${borderOpacity / 100})`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </section>
  );
});

// ==================== OrbitingCircles Component ====================

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

export const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-white/10 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      <section
        style={
          {
            '--duration': duration,
            '--radius': radius,
            '--delay': -delay,
          } as React.CSSProperties
        }
        className={cn(
          'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-white/5 [animation-delay:calc(var(--delay)*1000ms)]',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        {children}
      </section>
    </>
  );
});

// ==================== TechOrbitDisplay Component ====================

export type IconConfig = {
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
  component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
  iconsArray: IconConfig[];
  text?: string;
  subtext?: string;
};

export const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
  text = 'Seven Tracking',
  subtext = 'Professional Trading Journal',
}: TechnologyOrbitDisplayProps) {
  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      <div className="z-10 text-center space-y-2">
        <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-white via-slate-200 to-indigo-400 bg-clip-text text-center text-6xl font-black tracking-tight text-transparent">
          {text}
        </span>
        {subtext && (
          <p className="text-sm font-mono text-indigo-400/80 uppercase tracking-widest">
            {subtext}
          </p>
        )}
      </div>

      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});

// ==================== AnimatedForm Component ====================

type FieldType = 'text' | 'email' | 'password';

type Field = {
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
  header: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  fieldPerRow?: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

type Errors = {
  [key: string]: string;
};

export const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  fieldPerRow = 1,
  onSubmit,
  goTo,
}: AnimatedFormProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event: FormEvent<HTMLFormElement>) => {
    const currentErrors: Errors = {};
    fields.forEach((field) => {
      const inputEl = (event.target as HTMLFormElement).querySelector(
        `#${field.label.replace(/\s+/g, '_')}`
      ) as HTMLInputElement;
      const value = inputEl ? inputEl.value : field.value || '';

      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} est requis`;
      }

      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = 'Adresse e-mail invalide';
      }

      if (field.type === 'password' && value && value.length < 6) {
        currentErrors[field.label] =
          'Le mot de passe doit faire au moins 6 caractères';
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formErrors = validateForm(event);

    if (Object.keys(formErrors).length === 0) {
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className="max-md:w-full flex flex-col gap-4 w-96 mx-auto">
      <BoxReveal boxColor="#6366f1" duration={0.3}>
        <h2 className="font-heading font-bold text-3xl text-white">
          {header}
        </h2>
      </BoxReveal>

      {subHeader && (
        <BoxReveal boxColor="#6366f1" duration={0.3} className="pb-2">
          <p className="text-slate-400 text-sm max-w-sm">
            {subHeader}
          </p>
        </BoxReveal>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section
          className={`grid grid-cols-1 md:grid-cols-${fieldPerRow} gap-3`}
        >
          {fields.map((field) => (
            <section key={field.label} className="flex flex-col gap-1.5">
              <BoxReveal boxColor="#6366f1" duration={0.3}>
                <Label htmlFor={field.label.replace(/\s+/g, '_')}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
              </BoxReveal>

              <BoxReveal
                width="100%"
                boxColor="#6366f1"
                duration={0.3}
                className="flex flex-col space-y-1 w-full"
              >
                <section className="relative">
                  <Input
                    type={
                      field.type === 'password'
                        ? visible
                          ? 'text'
                          : 'password'
                        : field.type
                    }
                    id={field.label.replace(/\s+/g, '_')}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={field.onChange}
                  />

                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-400 hover:text-white"
                    >
                      {visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </section>

                {errors[field.label] && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors[field.label]}
                  </p>
                )}
              </BoxReveal>
            </section>
          ))}
        </section>

        {errorField && (
          <BoxReveal width="100%" boxColor="#ef4444" duration={0.3}>
            <p className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              {errorField}
            </p>
          </BoxReveal>
        )}

        <BoxReveal
          width="100%"
          boxColor="#6366f1"
          duration={0.3}
          overflow="visible"
        >
          <button
            className="bg-gradient-to-r relative group/btn from-[#6366f1] via-[#4f46e5] to-[#8b5cf6] block w-full text-white rounded-xl h-11 font-bold shadow-indigo-glow hover:opacity-90 transition duration-300 outline-none cursor-pointer"
            type="submit"
          >
            {submitButton} &rarr;
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal boxColor="#6366f1" duration={0.3}>
            <section className="mt-4 text-center">
              <button
                type="button"
                className="text-xs font-medium text-slate-400 hover:text-[#818cf8] transition-colors cursor-pointer outline-none"
                onClick={goTo}
              >
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}
      </form>
    </section>
  );
});

export const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

// ==================== AuthTabs Component ====================

interface AuthTabsProps {
  formFields: {
    header: string;
    subHeader?: string;
    fields: Array<{
      label: string;
      required?: boolean;
      type: FieldType;
      placeholder: string;
      value?: string;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    }>;
    submitButton: string;
    textVariantButton?: string;
    errorField?: string;
  };
  goTo: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const AuthTabs = memo(function AuthTabs({
  formFields,
  goTo,
  handleSubmit,
}: AuthTabsProps) {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full h-full flex flex-col justify-center items-center">
        <AnimatedForm
          {...formFields}
          fieldPerRow={1}
          onSubmit={handleSubmit}
          goTo={goTo}
        />
      </div>
    </div>
  );
});

// ==================== Label Component ====================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

export const Label = memo(function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-xs font-mono font-medium text-slate-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});
