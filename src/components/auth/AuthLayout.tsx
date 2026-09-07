import type { ReactNode } from 'react'
import logo from '../../assets/logo.png'
// Foto dedicada al flujo de autenticación (distinta de la del header del
// landing): se recorta desde la derecha (bg-right) para que el rótulo
// "ASADA Pueblo Nuevo" quede siempre visible, tanto en el panel lateral de
// escritorio como de fondo en mobile.
import loginImg from '../../assets/login-hero.jpg'

// Mismo overlay que usa el Hero del landing (Hero.tsx) sobre la foto: así
// todo el flujo de acceso se siente parte del mismo sitio, no pantallas
// aparte.
const SOMBRA_HEADER =
  'bg-gradient-to-r from-primary-900/90 via-primary-900/70 to-primary-900/30'

interface AuthLayoutProps {
  // Título opcional bajo el logo (Login no lleva; Recuperar/Restablecer sí).
  title?: string
  // Texto opcional bajo el título (o bajo el logo si no hay título).
  subtitle?: ReactNode
  children: ReactNode
}

// Shell de pantalla completa compartido por Login, Recuperar contraseña y
// Restablecer contraseña: panel de foto a la izquierda (fondo completo en
// mobile) + panel de formulario a la derecha, para que las tres pantallas
// del flujo de acceso se vean y se comporten igual en celular y escritorio.
function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full md:flex">
      {/* Panel foto: en mobile es el fondo completo de la pantalla (con la
          sombra del header encima y la card del formulario flotando
          centrada arriba). Desde md+ pasa a ser el panel izquierdo a
          pantalla completa — ya no una card flotando con espacio alrededor,
          sino los dos paneles ocupando todo el ancho y alto de la ventana. */}
      <div className="absolute inset-0 md:relative md:w-1/2 md:flex-none">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-right"
          style={{ backgroundImage: `url(${loginImg})` }}
        />
        <div aria-hidden="true" className={`absolute inset-0 ${SOMBRA_HEADER}`} />
        {/* Curva blanca que funde el panel de foto con el del formulario,
            solo desde md+ (en mobile la foto es el fondo completo). */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-24 text-white md:block"
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M100,0 C60,110 87,230 52,340 C27,420 20,480 47,560 C75,640 52,725 100,800 Z" />
        </svg>
      </div>

      {/* Panel formulario: en mobile flota como card centrada sobre la foto
          de fondo; desde md+ ocupa la mitad derecha a pantalla completa. */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 md:min-h-screen md:w-1/2 md:flex-none md:bg-white md:px-12 md:py-0">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:p-8 md:max-w-md md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <div className="mb-6 text-center">
            <img
              src={logo}
              alt="ASADA Pueblo Nuevo"
              className="mx-auto h-16 w-auto -translate-x-2 object-contain sm:h-20"
            />
            {title && (
              <h1 className="mt-4 text-xl font-semibold text-primary-900">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-3 text-sm text-primary-500">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
